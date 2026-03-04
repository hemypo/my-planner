"use client";

import { useRouter, useSearchParams } from 'next/navigation';

export default function MonthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Берем месяц из URL или ставим текущий по умолчанию (формат YYYY-MM)
  const currentMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // При выборе нового месяца меняем URL. Next.js сам обновит данные на сервере!
    router.push(`/?month=${e.target.value}`);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
      <label className="text-muted" style={{ fontWeight: 500, margin: 0 }}>Период:</label>
      <input 
        type="month" 
        className="input-field" 
        style={{ width: 'auto', marginBottom: 0, padding: '8px 12px' }}
        value={currentMonth} 
        onChange={handleChange} 
      />
    </div>
  );
}