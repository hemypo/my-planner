"use client"; // Говорим Next.js, что этот код работает в браузере

import { useState } from 'react';

export default function AddTransactionForm({ categories }: { categories: any[] }) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Здесь будет вызов Server Action для отправки данных в Supabase
    console.log("Отправляем:", amount, categoryId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="number" 
        placeholder="Сумма" 
        className="input-field"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required 
      />
      <select 
        className="input-field"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
      >
        <option value="">Выберите категорию...</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <button type="submit" className="btn btn-primary w-100">Записать</button>
    </form>
  );
}