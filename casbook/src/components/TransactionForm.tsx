'use client';
import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Transaction, Category, Partner, TransactionType } from '@/types';

interface Props {
  transaction?: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export default function TransactionForm({ transaction, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [form, setForm] = useState({
    date: transaction?.date || today(),
    type: transaction?.type || 'income' as TransactionType,
    category_id: transaction?.category_id?.toString() || '',
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    partner_id: transaction?.partner_id?.toString() || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/partners').then(r => r.json()),
    ]).then(([cats, parts]) => {
      setCategories(cats);
      setPartners(parts);
      if (!transaction && cats.length > 0) {
        const filtered = cats.filter((c: Category) => c.type === 'income' || c.type === 'all');
        if (filtered.length > 0) setForm(f => ({ ...f, category_id: filtered[0].id.toString() }));
      }
    });
  }, [transaction]);

  const filteredCategories = categories.filter(
    c => c.type === form.type || c.type === 'all'
  );

  const typeChanged = (type: TransactionType) => {
    const filtered = categories.filter(c => c.type === type || c.type === 'all');
    setForm(f => ({
      ...f,
      type,
      category_id: filtered[0]?.id.toString() || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        type: form.type,
        category_id: Number(form.category_id),
        description: form.description,
        amount: Number(form.amount),
        partner_id: form.partner_id ? Number(form.partner_id) : null,
      };
      const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions';
      const method = transaction ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved();
      onClose();
    } catch {
      setError('Failed to save transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions: { value: TransactionType; label: string; color: string }[] = [
    { value: 'income', label: 'Money In', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'expense', label: 'Expense', color: 'bg-rose-100 text-rose-700 border-rose-300' },
    { value: 'withdrawal', label: 'Withdrawal', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => typeChanged(opt.value)}
                  className={`py-2 px-2 rounded-xl text-sm font-semibold border transition-all ${
                    form.type === opt.value
                      ? opt.color + ' border-2'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Category</label>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              required
            >
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this transaction for?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Partner (optional) */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
              Person <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <select
              value={form.partner_id}
              onChange={e => setForm(f => ({ ...f, partner_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">— None —</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-base"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Check size={18} /> {transaction ? 'Save Changes' : 'Add Transaction'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
