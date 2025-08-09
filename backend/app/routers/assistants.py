import asyncio
import json
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from ..auth import get_current_user
from ..config import settings
from ..schemas import AssistantChatRequest, AssistantChatResponse


router = APIRouter()


async def _assistants_headers() -> Dict[str, str]:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="OPENAI_API_KEY not configured")
    return {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
    }


async def _create_thread(client: httpx.AsyncClient) -> str:
    resp = await client.post(f"{settings.OPENAI_BASE_URL}/threads", json={})
    resp.raise_for_status()
    data = resp.json()
    return data["id"]


async def _add_message(client: httpx.AsyncClient, thread_id: str, content: str) -> None:
    resp = await client.post(
        f"{settings.OPENAI_BASE_URL}/threads/{thread_id}/messages",
        json={"role": "user", "content": content},
    )
    resp.raise_for_status()


async def _create_run(
    client: httpx.AsyncClient,
    thread_id: str,
    assistant_id: str,
    instructions: str | None = None,
) -> str:
    body: Dict[str, Any] = {"assistant_id": assistant_id}
    if instructions:
        body["instructions"] = instructions
    resp = await client.post(
        f"{settings.OPENAI_BASE_URL}/threads/{thread_id}/runs",
        json=body,
    )
    resp.raise_for_status()
    return resp.json()["id"]


async def _wait_run_complete(client: httpx.AsyncClient, thread_id: str, run_id: str, timeout_s: float = 30.0) -> None:
    waited = 0.0
    interval = 0.5
    while waited < timeout_s:
        resp = await client.get(f"{settings.OPENAI_BASE_URL}/threads/{thread_id}/runs/{run_id}")
        resp.raise_for_status()
        st = resp.json().get("status")
        if st in ("completed", "failed", "cancelled", "expired"):
            if st != "completed":
                raise HTTPException(status_code=500, detail=f"Assistant run status: {st}")
            return
        await asyncio.sleep(interval)
        waited += interval
    raise HTTPException(status_code=504, detail="Assistant run timeout")


async def _get_last_assistant_message(client: httpx.AsyncClient, thread_id: str) -> str:
    resp = await client.get(f"{settings.OPENAI_BASE_URL}/threads/{thread_id}/messages", params={"limit": 10, "order": "desc"})
    resp.raise_for_status()
    data = resp.json()
    for msg in data.get("data", []):
        if msg.get("role") == "assistant":
            parts = msg.get("content", [])
            texts = []
            for p in parts:
                if p.get("type") == "text":
                    val = p.get("text", {}).get("value")
                    if val:
                        texts.append(val)
            if texts:
                return "\n\n".join(texts)
    return ""


@router.post("/chat", response_model=AssistantChatResponse)
async def assistant_chat(req: AssistantChatRequest, _: dict = Depends(get_current_user)):
    headers = await _assistants_headers()
    async with httpx.AsyncClient(headers=headers, timeout=60) as client:
        thread_id = req.thread_id or await _create_thread(client)
        await _add_message(client, thread_id, req.message)
        run_id = await _create_run(client, thread_id, req.assistant_id)
        await _wait_run_complete(client, thread_id, run_id)
        answer = await _get_last_assistant_message(client, thread_id)
        return AssistantChatResponse(thread_id=thread_id, assistant_message=answer)


@router.post("/chat_stream")
async def assistant_chat_stream(req: AssistantChatRequest, _: dict = Depends(get_current_user)):
    headers = await _assistants_headers()

    async def event_generator():
        async with httpx.AsyncClient(headers=headers, timeout=60) as client:
            try:
                thread_id = req.thread_id or await _create_thread(client)
                yield f"data: {json.dumps({ 'thread_id': thread_id })}\n\n"
                await _add_message(client, thread_id, req.message)
                run_id = await _create_run(client, thread_id, req.assistant_id)

                accumulated = ""
                while True:
                    # Check run state
                    resp = await client.get(f"{settings.OPENAI_BASE_URL}/threads/{thread_id}/runs/{run_id}")
                    resp.raise_for_status()
                    st = resp.json().get("status")

                    # Read latest assistant text
                    msg_resp = await client.get(
                        f"{settings.OPENAI_BASE_URL}/threads/{thread_id}/messages",
                        params={"limit": 1, "order": "desc"},
                    )
                    msg_resp.raise_for_status()
                    data = msg_resp.json()
                    latest_text = ""
                    if data.get("data"):
                        msg = data["data"][0]
                        if msg.get("role") == "assistant":
                            parts = msg.get("content", [])
                            chunks = []
                            for p in parts:
                                if p.get("type") == "text":
                                    val = p.get("text", {}).get("value")
                                    if val:
                                        chunks.append(val)
                            latest_text = "\n\n".join(chunks)

                    if len(latest_text) > len(accumulated):
                        delta = latest_text[len(accumulated):]
                        accumulated = latest_text
                        # send delta
                        yield f"data: {json.dumps({ 'delta': delta })}\n\n"

                    if st in ("completed", "failed", "cancelled", "expired"):
                        if st != "completed":
                            yield f"data: {json.dumps({ 'error': st })}\n\n"
                        break
                    await asyncio.sleep(0.5)
            except Exception as e:
                yield f"data: {json.dumps({ 'error': str(e) })}\n\n"
            finally:
                # final event
                try:
                    # thread_id may not exist if error before creation
                    tid = locals().get('thread_id', None)
                    payload = { 'done': True }
                    if tid:
                        payload['thread_id'] = tid
                    yield f"data: {json.dumps(payload)}\n\n"
                except Exception:
                    pass

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    })

