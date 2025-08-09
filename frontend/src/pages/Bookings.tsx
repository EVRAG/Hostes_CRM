import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import Calendar from '../components/Calendar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

type Slot = { time: string; booked: number; free: number }

export default function BookingsPage() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [clientName, setClientName] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [phone, setPhone] = useState('')
  const [guestCount, setGuestCount] = useState<number | ''>('')
  const [comment, setComment] = useState('')
  const TAG_OPTIONS = ['Парковка', 'Семейное', 'Вегетарианское', 'VIP']
  const [tags, setTags] = useState<string[]>([])
  const [deposit, setDeposit] = useState(false)
  const token = localStorage.getItem('token')
  const restaurantId = 1

  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

  const fetchSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_URL}/bookings/${restaurantId}/${date}`, authHeaders)
      setSlots(res.data.slots)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Не удалось загрузить слоты')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [date])

  // Auto refresh slots periodically
  useEffect(() => {
    const id = setInterval(() => {
      fetchSlots()
    }, 15000)
    return () => clearInterval(id)
  }, [date])

  const openModal = (time: string) => {
    setSelectedTime(time)
    setClientName('')
    setStartTime(time)
    setEndTime(time)
    setPhone('')
    setGuestCount('')
    setComment('')
    setTags([])
    setDeposit(false)
    setModalOpen(true)
  }

  const createBooking = async () => {
    try {
      await axios.post(
        `${API_URL}/bookings`,
        {
          restaurant_id: restaurantId,
          date,
          time_slot: selectedTime,
          client_name: clientName,
          start_time: startTime || null,
          end_time: endTime || null,
          phone: phone || null,
          guest_count: typeof guestCount === 'number' ? guestCount : null,
          comment: comment || null,
          tags,
          deposit,
        },
        authHeaders
      )
      setModalOpen(false)
      await fetchSlots()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Ошибка бронирования')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mt-4 md:mt-6">
      <div className="md:col-span-1 order-1 md:order-none">
        <h2 className="font-semibold mb-2">Выбор даты</h2>
        <Calendar value={date} onChange={setDate} />
      </div>
      <div className="md:col-span-3 card p-4 order-2 md:order-none">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Слоты на {date}</h2>
          <button className="btn-outline" onClick={fetchSlots}>Обновить</button>
        </div>
        {loading ? (
          <div>Загрузка...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="flex flex-col gap-3">
            {slots.map((s) => (
              <div key={s.time} className={`p-4 border rounded-md flex items-center justify-between w-full ${s.booked >= 5 ? 'bg-red-50' : 'bg-white'}`}>
                <div>
                  <div className="text-lg font-medium">{s.time}</div>
                  <div className="text-sm text-gray-600">Занято: {s.booked} • Свободно: {s.free}</div>
                </div>
                <button className="btn-secondary" onClick={() => openModal(s.time)} disabled={s.free <= 0}>Добавить</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3 className="text-lg font-semibold mb-4">Создание брони</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Дата</label>
                  <Calendar value={date} onChange={setDate} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Время (диапазон)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" type="time" value={startTime} onChange={e => { setStartTime(e.target.value); setSelectedTime(e.target.value) }} />
                    <input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Телефон</label>
                  <input className="input" placeholder="+7 (___) ___-__-__" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Бронь на имя*</label>
                  <input className="input" placeholder="Иван Иванов" value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Персон</label>
                  <input className="input" type="number" min={1} placeholder="4" value={guestCount} onChange={e => setGuestCount(e.target.value ? parseInt(e.target.value) : '')} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Депозит</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2"><input type="radio" name="deposit" checked={!deposit} onChange={() => setDeposit(false)} /> Без депозита</label>
                    <label className="inline-flex items-center gap-2"><input type="radio" name="deposit" checked={deposit} onChange={() => setDeposit(true)} /> С депозитом</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Комментарий</label>
                <textarea className="input min-h-[90px]" value={comment} onChange={e => setComment(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm mb-2">Теги</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(t => (
                    <label key={t} className="inline-flex items-center gap-2 border rounded-md px-2 py-1">
                      <input type="checkbox" checked={tags.includes(t)} onChange={(e) => {
                        if (e.target.checked) setTags(prev => [...prev, t])
                        else setTags(prev => prev.filter(x => x !== t))
                      }} />
                      {t}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button className="px-4 py-2 rounded-md border" onClick={() => setModalOpen(false)}>Отмена</button>
                <button className="btn" onClick={createBooking} disabled={!clientName}>Добавить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  let d = digits
  if (d.startsWith('8')) d = '7' + d.slice(1)
  if (!d.startsWith('7')) d = '7' + d
  const p1 = d.slice(1, 4)
  const p2 = d.slice(4, 7)
  const p3 = d.slice(7, 9)
  const p4 = d.slice(9, 11)
  let out = '+7'
  if (p1) out += ` (${p1}`
  if (p1 && p1.length === 3) out += ')'
  if (p2) out += ` ${p2}`
  if (p3) out += `-${p3}`
  if (p4) out += `-${p4}`
  return out
}

