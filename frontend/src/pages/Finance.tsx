export default function FinancePage() {
  return (
    <div className="space-y-4 mt-4 md:mt-6">
      <h1 className="text-2xl font-semibold">Финансовый модуль</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-lg font-medium mb-2">Текущий тариф</h2>
          <div className="text-sm text-gray-600">План: Pro</div>
          <div className="text-sm text-gray-600">Цена: 4 900 ₽ / месяц</div>
          <div className="text-sm text-gray-600">Следующее списание: 15.09.2025</div>
          <div className="mt-3 flex gap-2">
            <button className="btn-secondary">Оплатить сейчас</button>
            <button className="btn-outline">Изменить план</button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-medium mb-2">Способ оплаты</h2>
          <div className="text-sm text-gray-600">Карта: **** **** **** 1234</div>
          <div className="text-sm text-gray-600">Держатель: IVAN IVANOV</div>
          <div className="text-sm text-gray-600">Действует до: 12/27</div>
          <div className="mt-3">
            <button className="btn-outline">Обновить карту</button>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-lg font-medium mb-3">История счетов</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Дата</th>
                <th className="py-2 pr-4">Сумма</th>
                <th className="py-2 pr-4">Статус</th>
                <th className="py-2 pr-4">Счёт</th>
              </tr>
            </thead>
            <tbody>
              {[{
                date: '15.08.2025', amount: '4 900 ₽', status: 'Оплачено', link: '#'
              },{
                date: '15.07.2025', amount: '4 900 ₽', status: 'Оплачено', link: '#'
              },{
                date: '15.06.2025', amount: '4 900 ₽', status: 'Оплачено', link: '#'
              }].map((r,i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{r.amount}</td>
                  <td className="py-2 pr-4">{r.status}</td>
                  <td className="py-2 pr-4"><a className="text-gray-700 underline" href={r.link}>Скачать PDF</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

