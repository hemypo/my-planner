import AddTransactionForm from './components/AddTransactionForm';
import ExpenseChart from './components/ExpenseChart';
import MonthFilter from './components/MonthFilter';

// Next.js автоматически передает searchParams в серверную страницу
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const SUPABASE_URL = process.env.SUPABASE_URL as string;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY as string;

  // Загружаем ВСЕ данные (для большого проекта фильтровали бы в базе, но для личного планера JS справится идеально)
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
  const allTransactions = await transactionsRes.json();

  // === ЛОГИКА ВРЕМЕНИ ===
  const today = new Date();
  const selectedMonthStr = searchParams.month || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [year, month] = selectedMonthStr.split('-').map(Number);
  
  // Границы выбранного месяца
  const startOfSelected = new Date(year, month - 1, 1);
  const endOfSelected = new Date(year, month, 0, 23, 59, 59);

  // Границы предыдущего месяца (для умного планирования)
  const startOfPrev = new Date(year, month - 2, 1);
  const endOfPrev = new Date(year, month - 1, 0, 23, 59, 59);

  // Фильтруем транзакции по периодам
  const currentMonthTx = allTransactions.filter((t: any) => {
    const d = new Date(t.created_at);
    return d >= startOfSelected && d <= endOfSelected;
  });

  const prevMonthTx = allTransactions.filter((t: any) => {
    const d = new Date(t.created_at);
    return d >= startOfPrev && d <= endOfPrev;
  });

  // === ПОДСЧЕТЫ ДЛЯ ВЫБРАННОГО МЕСЯЦА ===
  let totalIncome = 0;
  let totalExpense = 0;

  currentMonthTx.forEach((t: any) => {
    const category = categories.find((c: any) => c.id === t.category_id);
    if (category?.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  const balance = totalIncome - totalExpense;

  // Данные для графика (только за выбранный месяц)
  const chartData = categories
    .filter((c: any) => c.type !== 'income')
    .map((c: any) => {
      const sum = currentMonthTx
        .filter((t: any) => t.category_id === c.id)
        .reduce((acc: number, t: any) => acc + t.amount, 0);
      return { name: c.name, value: sum };
    })
    .filter((d: any) => d.value > 0);

  // === УМНЫЙ БЮДЖЕТ ===
  const budgetProgress = categories
    .filter((c: any) => c.type !== 'income')
    .map((category: any) => {
      // Траты в текущем месяце
      const spentNow = currentMonthTx
        .filter((t: any) => t.category_id === category.id)
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      // Траты в прошлом месяце
      const spentPrev = prevMonthTx
        .filter((t: any) => t.category_id === category.id)
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Логика: если жесткий план не задан (0), берем траты прошлого месяца как ориентир.
      // Если в прошлом месяце тоже было 0, то бюджета нет.
      const effectivePlan = category.plan_amount > 0 ? category.plan_amount : spentPrev;
      
      let percent = 0;
      if (effectivePlan > 0) {
        percent = Math.min((spentNow / effectivePlan) * 100, 100);
      }

      return {
        name: category.name,
        plan: effectivePlan,
        spent: spentNow,
        percent: percent,
        isAutoPlan: category.plan_amount === 0 && spentPrev > 0
      };
    })
    .filter((b: any) => b.plan > 0 || b.spent > 0); // Не показываем пустые категории

  // Сортировка транзакций (новые сверху)
  const sortedTransactions = [...currentMonthTx].reverse();

  return (
    <main className="main-content">
      <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="greeting">
          <h1>Аналитика 📊</h1>
          <p>Финансовая сводка за выбранный период.</p>
        </div>
        {/* Вставляем наш переключатель месяцев */}
        <MonthFilter />
      </header>

      <div className="dashboard-grid">
        
        {/* БАЛАНС МЕСЯЦА */}
        <div className="card balance-card">
          <h3>Остаток бюджета</h3>
          <div className="balance-amount">₽ {balance.toLocaleString('ru-RU')}</div>
          <p className="text-muted">За {selectedMonthStr}</p>
        </div>

        <div className="card action-card">
          <h3>Добавить операцию</h3>
          <AddTransactionForm categories={categories} />
        </div>

        <div className="card span-2">
          <h3>Структура расходов</h3>
          <ExpenseChart data={chartData} />
        </div>

        <div className="card transactions-card span-2">
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <h3>Операции ({selectedMonthStr})</h3>
          </div>
          <div className="transaction-list">
            {sortedTransactions.length === 0 ? (
              <p className="text-muted">В этом месяце транзакций еще нет.</p>
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

        {/* ИСПОЛНЕНИЕ БЮДЖЕТА */}
        <div className="card budget-card span-2">
          <h3>Исполнение бюджета</h3>
          <div className="budget-list">
            {budgetProgress.length === 0 ? (
               <p className="text-muted">Нет данных для планирования.</p>
            ) : (
              budgetProgress.map((b: any, idx: number) => {
                const isWarning = b.percent > 85 ? 'warning' : '';
                return (
                  <div key={idx} className="progress-item">
                    <div className="progress-info">
                      <span>
                        {b.name} 
                        {b.isAutoPlan && <span style={{fontSize: '11px', color: '#ff9f43', marginLeft: '6px'}}>(по прошлому месяцу)</span>}
                      </span>
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