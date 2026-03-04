// app/page.tsx

// Импортируем клиентский компонент (форму), который напишем позже
import AddTransactionForm from './components/AddTransactionForm';

export default async function DashboardPage() {
  // 1. ЗАПРОСЫ К БАЗЕ (Выполняются на Vercel)
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY as string;

  const [categoriesRes, transactionsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: 'no-store' // Говорим Next.js всегда брать свежие данные
    }),
    fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: 'no-store'
    })
  ]);

  const categories = await categoriesRes.json();
  const transactions = await transactionsRes.json();

  // 2. МАТЕМАТИКА (Выполняется на Vercel)
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t: any) => {
    const category = categories.find((c: any) => c.id === t.category_id);
    if (category?.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  const balance = totalIncome - totalExpense;

  // 3. ОТРИСОВКА (В браузер летит только этот HTML)
  return (
    <main className="main-content">
      <header className="topbar">
        <h1>Привет! 👋</h1>
      </header>

      <div className="dashboard-grid">
        {/* Карточка баланса */}
        <div className="card balance-card">
          <h3>Остаток бюджета</h3>
          <div className="balance-amount">₽ {balance.toLocaleString()}</div>
        </div>

        {/* Форма добавления траты (передаем ей категории с сервера) */}
        <div className="card action-card">
          <h3>Быстрый расход</h3>
          <AddTransactionForm categories={categories} />
        </div>

        {/* Список транзакций */}
        <div className="card transactions-card span-2">
          <h3>Последние операции</h3>
          <div className="transaction-list">
            {transactions.slice(-5).reverse().map((tx: any) => {
              const cat = categories.find((c: any) => c.id === tx.category_id);
              return (
                <div key={tx.id} className="transaction-item">
                  <span>{cat?.name || 'Неизвестно'}</span>
                  <span>₽ {tx.amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}