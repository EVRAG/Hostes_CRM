import { useState } from 'react'

type Client = {
  id: string
  name: string
  phone: string
  note: string
}

const CLIENTS: Client[] = [
  { id: 'c1', name: 'Иван Иванов', phone: '+7 (915) 123-45-67', note: 'Постоянный клиент. Любит стол у окна.' },
  { id: 'c2', name: 'Мария Петрова', phone: '+7 (926) 555-77-11', note: 'Предпочитает вегетарианское меню.' },
  { id: 'c3', name: 'Сергей', phone: '+7 (903) 222-33-44', note: 'Отмечал день рождения, заказывает заранее.' },
  { id: 'c4', name: 'Ольга', phone: '+7 (901) 000-11-22', note: 'Всегда просит парковочное место.' },
]

export default function ClientsPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const filtered = CLIENTS.filter(c => (
    c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
  ))
  return (
    <div className="space-y-4 mt-4 md:mt-6">
      <h1 className="text-2xl font-semibold">Клиенты</h1>
      <div className="card p-4">
        <input className="input" placeholder="Поиск: имя или телефон" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(c => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">{c.phone}</div>
              </div>
              <button className="px-2 py-2 rounded-md border hover:bg-gray-50" onClick={() => setOpenId(openId === c.id ? null : c.id)}>
                <svg className={`transition-transform ${openId === c.id ? 'rotate-180' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>
            {openId === c.id && (
              <div className="mt-3 text-sm text-gray-700">{c.note}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

