"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ExpenseChart({ data }: { data: { name: string, value: number }[] }) {
  // Цветовая палитра для категорий
  const COLORS = ['#6c5ce7', '#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#ff6348', '#5352ed'];

  // Если трат еще нет, показываем заглушку
  if (data.length === 0) {
    return (
      <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted">Нет расходов для построения графика</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70} // Делает график "бубликом"
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `₽ ${value.toLocaleString('ru-RU')}`} 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}