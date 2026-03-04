import AddTransactionForm from './components/AddTransactionForm';
import ExpenseChart from './components/ExpenseChart';

export default async function DashboardPage() {
  const SUPABASE_URL = process.env.SUPABASE_URL as string;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY as string;

  const [categoriesRes, transactionsRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/categories?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: 'no-store'
    }),
    fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: 'no-store'
    })
  ]);

  const categories = await categoriesRes.json();
  const transactions = await transactionsRes.json();

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t: any) => {
    const category = categories.find((c: any) => c.id === t.category_id);
    if (category?.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  const balance = totalIncome - totalExpense;

  // Группируем траты для графика (суммируем расходы по каждой категории)
  const chartData = categories
    .filter((c: any) => c.type !== 'income')
    .map((c: any) => {
      const sum = transactions
        .filter((t: any) => t.category_id === c.id)
        .reduce((acc: number, t: any) => acc + t.amount, 0);
      return { name: c.name, value: sum };
    })
    .filter((d: any) => d.value > 0); // Убираем категории с нулями, чтобы не захламлять график

  // Прогресс бюджета
  const budgetProgress = categories
    .filter((c: any) => c.type !== 'income' && c.plan_amount > 0)
    .map((category: any) => {
      const spent = transactions
        .filter((t: any) => t.category_id === category.id)
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      return {
        name: category.name, plan: category.plan_amount, spent: spent,
        percent: Math.min((spent / category.plan_amount) * 100, 100)
      };
    });

  // Сортируем все транзакции от новых к старым
  const sortedTransactions = [...transactions].reverse();

  return (
    <main className="main-content">
      <header className="topbar">
        <div className="greeting">
          <h1>Аналитика 📊</h1>
          <p>Твой полноценный финансовый дашборд.</p>
        </div>
      </header>

      {/* Немного меняем сетку: график занимает 2 колонки */}
      <div className="dashboard-grid">
        
        <div className="card balance-card">
          <h3>Остаток бюджета</h3>
          <div className="balance-amount">₽ {balance.toLocaleString('ru-RU')}</div>
          <p className="text-muted">За всё время</p>
        </div>

        <div className="card action-card">
          <h3>Добавить операцию</h3>
          <AddTransactionForm categories={categories} />
        </div>

        {/* НОВАЯ КАРТОЧКА С ГРАФИКОМ */}
        <div className="card span-2">
          <h3>Структура расходов</h3>
          <ExpenseChart data={chartData} />
        </div>

        <div className="card transactions-card span-2">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3>Все операции</h3>
          </div>
          <div className="transaction-list">
            {sortedTransactions.length === 0 ? (
              <p className="text-muted">Транзакций пока нет.</p>
            ) : (
              sortedTransactions.map((tx: any) => {
                const cat = categories.find((c: any) => c.id === tx.category_id);
                const isIncome = cat?.type === 'income';
                return (
                  <div key={tx.id} className="transaction-item">
                    <div className="t-info">
                      <div>
                        <h4>{cat?.name || 'Неизвестно'}</h4>
                        <p className="text-muted">{new Date(tx.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                    <div className={`t-amount ${isIncome ? 'income' : 'expense'}`}>
                      {isIncome ? '+' : '-'} ₽ {tx.amount.toLocaleString('ru-RU')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card budget-card span-2">
          <h3>Исполнение бюджета</h3>
          <div className="budget-list">
            {budgetProgress.length === 0 ? (
               <p className="text-muted">Плановые лимиты не заданы (укажи в Supabase).</p>
            ) : (
              budgetProgress.map((b: any, idx: number) => {
                const isWarning = b.percent > 85 ? 'warning' : '';
                return (
                  <div key={idx} className="progress-item">
                    <div className="progress-info">
                      <span>{b.name}</span>
                      <span>₽ {b.spent.toLocaleString('ru-RU')} / {b.plan.toLocaleString('ru-RU')}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className={`progress-bar-fill ${isWarning}`} style={{ width: `${b.percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </main>
  );
}