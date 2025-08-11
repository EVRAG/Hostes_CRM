import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Layout() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const Nav = (
    <>
      <nav className="space-y-2">
        <NavLink to="/bookings" onClick={() => setOpen(false)} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>Бронирования</NavLink>
        <NavLink to="/settings" onClick={() => setOpen(false)} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>Настройки</NavLink>
        <NavLink to="/dashboard" onClick={() => setOpen(false)} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>Дашборд</NavLink>
        <NavLink to="/clients" onClick={() => setOpen(false)} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>Клиенты</NavLink>
        <NavLink to="/finance" onClick={() => setOpen(false)} className={({isActive}) => `block px-3 py-2 rounded-md ${isActive ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>Финансы</NavLink>
      </nav>
      <button onClick={logout} className="btn mt-8 w-full">Выйти</button>
    </>
  )

  return (
    <div className="min-h-screen flex">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <button aria-label="Меню" className="px-3 py-2 rounded-md border hover:bg-gray-50" onClick={() => setOpen(v => !v)}>☰</button>
        <Link to="/" className="text-lg font-semibold">CRM</Link>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-6">
        <div className="mb-8">
          <Link to="/" className="text-xl font-semibold">CRM</Link>
        </div>
        {Nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <Link to="/" className="text-xl font-semibold" onClick={() => setOpen(false)}>CRM</Link>
              <button className="px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => setOpen(false)}>✕</button>
            </div>
            {Nav}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 w-full md:ml-0 pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}

