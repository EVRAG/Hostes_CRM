import { useMemo, useState } from 'react'

type Message = { role: 'agent' | 'user'; text: string }
type Recording = {
  id: string
  title: string
  duration: string
  src: string
  callerName?: string
  phone?: string
  transcript: Message[]
}

const DEMO: Recording[] = [
  {
    id: 'rec1',
    title: 'Звонок №1 — бронирование стола',
    duration: '02:13',
    src: '',
    callerName: 'Иван Иванов',
    phone: '+7 (915) 123-45-67',
    transcript: [
      { role: 'agent', text: 'Здравствуйте! Ресторан “Default Restaurant”. Чем могу помочь?' },
      { role: 'user', text: 'Привет! Хочу стол на двоих сегодня в 19:00.' },
      { role: 'agent', text: 'Проверяю доступность... Да, есть свободные столики.' },
      { role: 'user', text: 'Отлично! На имя Иван.' },
      { role: 'agent', text: 'Готово! Ждём вас в 19:00.' },
    ],
  },
  {
    id: 'rec2',
    title: 'Звонок №2 — уточнение меню',
    duration: '01:05',
    src: '',
    callerName: 'Мария Петрова',
    phone: '+7 (926) 555-77-11',
    transcript: [
      { role: 'user', text: 'Здравствуйте, подскажите, есть ли вегетарианские блюда?' },
      { role: 'agent', text: 'Да, у нас есть салаты и паста, можем предложить варианты.' },
      { role: 'user', text: 'Спасибо! Тогда забронирую на завтра.' },
      { role: 'agent', text: 'Конечно, подскажите время и количество гостей.' },
      { role: 'user', text: 'Завтра на 20:00, двое.' },
    ],
  },
  {
    id: 'rec3',
    title: 'Звонок №3 — день рождения',
    duration: '03:20',
    src: '',
    callerName: 'Сергей',
    phone: '+7 (903) 222-33-44',
    transcript: [
      { role: 'user', text: 'Добрый день! Планируем день рождения, 6 человек.' },
      { role: 'agent', text: 'Поздравляем! Можем предложить зал у окна.' },
      { role: 'user', text: 'Здорово, на 18:30 завтра.' },
      { role: 'agent', text: 'Бронь создана. Хотите торт или свечи?' },
      { role: 'user', text: 'Да, маленький торт, пожалуйста.' },
    ],
  },
  {
    id: 'rec4',
    title: 'Звонок №4 — парковка',
    duration: '00:47',
    src: '',
    callerName: 'Ольга',
    phone: '+7 (901) 000-11-22',
    transcript: [
      { role: 'user', text: 'Здравствуйте! У вас есть парковка?' },
      { role: 'agent', text: 'Да, на 10 мест, первый час бесплатно.' },
      { role: 'user', text: 'Спасибо, удобно!' },
      { role: 'agent', text: 'Будем рады видеть вас!' },
      { role: 'user', text: 'Хорошего дня!' },
    ],
  },
]

export default function DashboardPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return DEMO
    return DEMO.filter(r =>
      (r.callerName || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.transcript.some(m => m.text.toLowerCase().includes(q))
    )
  }, [query])
  return (
    <div className="space-y-4 mt-4 md:mt-6">
      <h1 className="text-2xl font-semibold">Дашборд</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Звонков сегодня" value="42" sublabel="из 60" percent={70} color="#0ea5e9" />
        <StatCard title="Ошибок LLM" value="3" sublabel="из 42" percent={7} color="#ef4444" />
        <StatCard title="Успешных бронирований" value="18" sublabel="из 22" percent={82} color="#22c55e" />
      </div>
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-lg font-medium">Записи звонков</div>
          <input className="input md:max-w-sm" placeholder="Поиск: имя или телефон" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((item) => (
          <RecordingCard key={item.id} rec={item} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ title, value, sublabel, percent, color }: { title: string; value: string; sublabel?: string; percent: number; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <StatDonut percent={percent} color={color} />
      <div className="flex-1">
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {sublabel ? <div className="text-xs text-gray-500">{sublabel}</div> : null}
      </div>
    </div>
  )
}

function StatDonut({ percent, color }: { percent: number; color: string }) {
  const size = 64
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="12" fill="#111827">
        {percent}%
      </text>
    </svg>
  )
}

function RecordingCard({ rec }: { rec: Recording }) {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  // Демонстрация таймлайна без настоящего аудио
  const togglePlay = () => {
    if (!playing) {
      setPlaying(true)
      // простая имитация прогресса
      const start = Date.now()
      const durationMs = 60 * 1000
      const timer = setInterval(() => {
        const elapsed = Date.now() - start
        const p = Math.min(100, Math.round((elapsed / durationMs) * 100))
        setProgress(p)
        if (p >= 100) {
          clearInterval(timer)
          setPlaying(false)
        }
      }, 200)
      // сохраняем идентификатор на замыкании — для демо достаточно
    } else {
      setPlaying(false)
      setProgress(0)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <button
          className={`inline-flex items-center justify-center w-10 h-10 rounded-full border ${playing ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'}`}
          onClick={togglePlay}
          aria-label={playing ? 'Пауза' : 'Плей'}
          title={playing ? 'Пауза' : 'Плей'}
        >
          {playing ? (
            // pause icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            // play icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <div className="font-medium">{rec.title}</div>
            <div>{rec.duration}</div>
          </div>
          <div className="h-2 bg-gray-200 rounded">
            <div className="h-2 bg-gray-700 rounded" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button
          className="px-2 py-2 rounded-md border hover:bg-gray-50"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls={`t-${rec.id}`}
          aria-label={open ? 'Свернуть' : 'Развернуть'}
          title={open ? 'Свернуть' : 'Развернуть'}
        >
          <svg
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {open && (
        <div id={`t-${rec.id}`} className="mt-4 space-y-2">
          {(rec.callerName || rec.phone) && (
            <div className="text-sm text-gray-600">{rec.callerName} {rec.phone ? `• ${rec.phone}` : ''}</div>
          )}
          {rec.transcript.map((m, i) => (
            <div key={i} className={`p-3 rounded-md ${m.role === 'agent' ? 'bg-gray-100 text-gray-700' : 'bg-white border'}`}>
              <div className="text-xs text-gray-500 mb-1">{m.role === 'agent' ? 'Агент' : 'Пользователь'}</div>
              <div>{m.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


