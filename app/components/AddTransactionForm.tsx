"use client";

import { useRef } from 'react';
import { addTransaction } from '../actions';

export default function AddTransactionForm({ categories }: { categories: any[] }) {
  // Ссылка на форму, чтобы очистить её после успешной отправки
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form 
      ref={formRef}
      action={async (formData) => {
        await addTransaction(formData); // Вызываем серверную функцию
        formRef.current?.reset();       // Очищаем инпуты
      }}
    >
      <input 
        type="number" 
        name="amount" 
        placeholder="Сумма" 
        className="input-field"
        required 
      />
      <select 
        name="category_id" 
        className="input-field"
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