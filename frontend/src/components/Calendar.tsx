import { useMemo, useState } from 'react'

type Props = {
  value: string
  onChange: (next: string) => void
}

function toISO(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Calendar({ value, onChange }: Props) {
  const initial = useMemo(() => (value ? new Date(value + 'T00:00:00') : new Date()), [value])
  const [view, setView] = useState<Date>(new Date(initial.getFullYear(), initial.getMonth(), 1))

  const selectedISO = value
  const todayISO = toISO(new Date())

  const monthLabel = view.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })

  const daysMatrix = useMemo(() => {
    const y = view.getFullYear()
    const m = view.getMonth()
    const first = new Date(y, m, 1)
    // Monday-first index: 0..6 where 0 is Monday
    const firstDayIdx = (first.getDay() + 6) % 7
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const cells: Array<{ iso: string | null; day: number | null }> = []

    // leading blanks
    for (let i = 0; i < firstDayIdx; i++) cells.push({ iso: null, day: null })
    // days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d)
      cells.push({ iso: toISO(date), day: d })
    }
    // trailing to complete weeks
    while (cells.length % 7 !== 0) cells.push({ iso: null, day: null })
    return cells
  }, [view])

  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const prevMonth = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
  const nextMonth = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <button className="px-2 py-1 rounded-md border hover:bg-gray-50" onClick={prevMonth}>«</button>
        <div className="font-medium capitalize">{monthLabel}</div>
        <button className="px-2 py-1 rounded-md border hover:bg-gray-50" onClick={nextMonth}>»</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
        {weekdays.map(w => (
          <div className="text-center" key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysMatrix.map((cell, idx) => {
          if (!cell.iso) return <div key={idx} className="h-9" />
          const isSelected = cell.iso === selectedISO
          const isToday = cell.iso === todayISO
          return (
            <button
              key={idx}
              onClick={() => onChange(cell.iso!)}
              className={
                `h-9 rounded-md text-sm flex items-center justify-center border ` +
                (isSelected ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50 border-gray-200') +
                (isToday && !isSelected ? ' ring-1 ring-gray-300' : '')
              }
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

