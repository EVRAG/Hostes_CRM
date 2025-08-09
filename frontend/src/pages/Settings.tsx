import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ASSISTANT_ID = 'asst_vitxwiKAOhWiFHgynXl07lzT'

const HOSTESS_OPTIONS = ['Анна', 'Мария', 'Алексей', 'Ирина', 'Дмитрий']

export default function SettingsPage() {
  const token = localStorage.getItem('token')
  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])
  const restaurantId = 1

  const [hostChoice, setHostChoice] = useState<string>('')
  const [greetingText, setGreetingText] = useState<string>('')
  const [infoText, setInfoText] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Chat state (OpenAI Assistants via backend proxy)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [threadId, setThreadId] = useState<string | null>(() => localStorage.getItem('assistant_thread_id'))

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await axios.get(`${API_URL}/restaurants/${restaurantId}/settings`, authHeaders)
      setHostChoice(res.data.host_choice || '')
      setGreetingText(res.data.greeting_text || '')
      setInfoText(res.data.info_text || '')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Не удалось загрузить настройки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveSettings = async () => {
    try {
      setSaving(true)
      await axios.put(
        `${API_URL}/restaurants/${restaurantId}/settings`,
        { host_choice: hostChoice || null, greeting_text: greetingText || null, info_text: infoText || null },
        authHeaders
      )
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Не удалось сохранить настройки')
    } finally {
      setSaving(false)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    try {
      setChatLoading(true)
      const response = await fetch(`${API_URL}/assistants/chat_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authHeaders.headers.Authorization },
        body: JSON.stringify({ assistant_id: ASSISTANT_ID, message: text, thread_id: threadId }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Stream failed')
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantAccum = ''
      let nextThreadId: string | null = threadId

      const applyInfoTrigger = async (fullText: string) => {
        const lines = fullText.split('\n')
        const triggerIndex = lines.findIndex(l => l.trim().toUpperCase().startsWith('INFO_TRIGGER='))
        if (triggerIndex >= 0) {
          const raw = lines[triggerIndex].trim()
          const toAppend = raw.slice(raw.indexOf('=') + 1).trim()
          if (toAppend) {
            const newInfo = infoText ? `${infoText}\n${toAppend}` : toAppend
            setInfoText(newInfo)
            try {
              await axios.put(
                `${API_URL}/restaurants/${restaurantId}/settings`,
                { host_choice: hostChoice || null, greeting_text: greetingText || null, info_text: newInfo },
                authHeaders
              )
            } catch {}
          }
          // Remove trigger line from assistant visible text
          assistantAccum = lines.filter((_, i) => i !== triggerIndex).join('\n').trim()
          if (!assistantAccum) assistantAccum = '(обновил информацию о ресторане)'
        }
      }

      // Optimistically add an empty assistant message to be updated as we stream
      let appended = false
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''
        for (const chunk of parts) {
          if (!chunk.startsWith('data:')) continue
          const jsonStr = chunk.slice(5).trim()
          if (!jsonStr) continue
          try {
            const evt = JSON.parse(jsonStr) as { delta?: string; error?: string; done?: boolean; thread_id?: string }
            if (evt.thread_id && !nextThreadId) {
              nextThreadId = evt.thread_id
              setThreadId(nextThreadId)
              localStorage.setItem('assistant_thread_id', nextThreadId)
            }
            if (evt.delta) {
              assistantAccum += evt.delta
              if (!appended) {
                setMessages(prev => [...prev, { role: 'assistant', content: assistantAccum }])
                appended = true
              } else {
                setMessages(prev => {
                  const copy = [...prev]
                  copy[copy.length - 1] = { role: 'assistant', content: assistantAccum }
                  return copy
                })
              }
            }
            if (evt.done) {
              await applyInfoTrigger(assistantAccum)
            }
            if (evt.error) {
              throw new Error(evt.error)
            }
          } catch {}
        }
      }
    } catch (e: any) {
      const err = e?.response?.data?.detail || 'Ошибка отправки в ассистента'
      setMessages(prev => [...prev, { role: 'assistant', content: `Ошибка: ${err}` }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 md:mt-6">
      {/* Chat */}
      <div className="card p-4 h-[70vh] flex flex-col">
        <h2 className="text-xl font-semibold mb-3">Чат</h2>
        <div className="flex-1 overflow-auto space-y-2">
          {messages.length === 0 && (
            <div className="text-sm text-gray-500">Задайте вопрос ассистенту. Интеграция с OpenAI Assistants будет подключена.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-md ${m.role === 'user' ? 'bg-gray-100' : 'bg-white border'}`}>
              <div className="text-xs text-gray-500 mb-1">{m.role === 'user' ? 'Вы' : 'Ассистент'}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input flex-1" placeholder="Введите сообщение" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} />
          <button className="btn-secondary" onClick={sendMessage} disabled={chatLoading}>{chatLoading ? 'Отправка...' : 'Отправить'}</button>
        </div>
      </div>

      {/* Settings form */}
      <div className="card p-4">
        <h2 className="text-xl font-semibold mb-3">Настройки ресторана</h2>
        {loading ? (
          <div>Загрузка...</div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="font-medium mb-1">Выбор хостес</div>
              <select className="input" value={hostChoice} onChange={e => setHostChoice(e.target.value)}>
                <option value="">— Не выбрано —</option>
                {HOSTESS_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="font-medium mb-1">Приветствие</div>
              <textarea className="input min-h-[100px]" value={greetingText} onChange={e => setGreetingText(e.target.value)} />
            </div>
            <div>
              <div className="font-medium mb-1">Общая информация о ресторане</div>
              <textarea className="input min-h-[140px]" value={infoText} onChange={e => setInfoText(e.target.value)} />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button className="btn-outline" onClick={saveSettings} disabled={saving}>{saving ? 'Обновляю...' : 'Обновить'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

