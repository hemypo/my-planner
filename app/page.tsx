import AddTransactionForm from './components/AddTransactionForm';

export default async function DashboardPage() {
  const SUPABASE_URL = process.env.SUPABASE_URL as string;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY as string;

  // 1. Загружаем данные
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

  // 2. Считаем баланс и группируем транзакции
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t: any) => {
    const category = categories.find((c: any) => c.id === t.category_id);
    if (category?.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  });

  const balance = totalIncome - totalExpense;

  // 3. Вычисляем прогресс по категориям (для карточки "Исполнение бюджета")
  const budgetProgress = categories
    .filter((c: any) => c.type !== 'income' && c.plan_amount > 0)
    .map((category: any) => {
      const spent = transactions
        .filter((t: any) => t.category_id === category.id)
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      return {
        name: category.name,
        plan: category.plan_amount,
        spent: spent,
        percent: Math.min((spent / category.plan_amount) * 100, 100)
      };
    });

  return (
    <main className="main-content">
      <header className="topbar">
        <div className="greeting">
          <h1>Привет! 👋</h1>
          <p>Твоя финансовая сводка на сегодня.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        
        {/* ОСТАТОК БЮДЖЕТА */}
        <div className="card balance-card">
          <h3>Остаток бюджета</h3>
          <div className="balance-amount">₽ {balance.toLocaleString('ru-RU')}</div>
          <p className="text-muted">Разница между доходами и расходами</p>
        </div>

        {/* ФОРМА ДОБАВЛЕНИЯ */}
        <div className="card action-card">
          <h3>Быстрый расход</h3>
          <AddTransactionForm categories={categories} />
        </div>

        {/* ПОСЛЕДНИЕ ОПЕРАЦИИ */}
        <div className="card transactions-card span-2">
          <div className="card-header">
            <h3>Последние операции</h3>
          </div>
          <div className="transaction-list">
            {transactions.length === 0 ? (
              <p className="text-muted">Транзакций пока нет. Запиши первую!</p>
            ) : (
              transactions.slice(-5).reverse().map((tx: any) => {
                const cat = categories.find((c: any) => c.id === tx.category_id);
                const isIncome = cat?.type === 'income';
                return (
                  <div key={tx.id} className="transaction-item">
                    <div className="t-info">
                      <div>
                        <h4>{cat?.name || 'Неизвестно'}</h4>
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

        {/* ИСПОЛНЕНИЕ БЮДЖЕТА */}
        <div className="card budget-card span-2">
          <h3>Исполнение бюджета</h3>
          <div className="budget-list">
            {budgetProgress.length === 0 ? (
               <p className="text-muted">Плановые лимиты не заданы. Установи их в Supabase.</p>
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