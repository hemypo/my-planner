'use server'

import { revalidatePath } from 'next/cache'

export async function addTransaction(formData: FormData) {
  // Достаем данные из формы
  const amount = formData.get('amount')
  const category_id = formData.get('category_id')
  
  const SUPABASE_URL = process.env.SUPABASE_URL as string
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY as string

  // Отправляем новую транзакцию в Supabase
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      amount: Number(amount),
      category_id: category_id,
      // Дату Supabase поставит сам (мы настроили это в SQL)
    })
  })

  // Магия Next.js: приказываем серверу сбросить кэш главной страницы
  // и перерисовать ее с новыми данными. Сайт обновится мгновенно!
  revalidatePath('/')
}