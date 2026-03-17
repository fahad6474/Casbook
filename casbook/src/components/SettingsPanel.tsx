'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Category, Partner } from '@/types';

interface Props {
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: 'income', label: 'Income', color: 'text-emerald-600' },
  { value: 'expense', label: 'Expense', color: 'text-rose-600' },
  { value: 'withdrawal', label: 'Withdrawal', color: 'text-amber-600' },
  { value: 'all', label: 'All Types', color: 'text-gray-600' },
];

const COLORS = ['#22c55e', '#16a34a', '#ef4444', '#dc2626', '#f97316', '#eab308', '#a855f7', '#6366f1', '#ec4899', '#06b6d4', '#14b8a6', '#8b5cf6'];

export default function SettingsPanel({ onClose }: Props) {
  const [tab, setTab] = useState<'categories' | 'partners'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newCat, setNewCat] = useState({ name: '', type: 'expense', color: COLORS[0] });
  const [newPartner, setNewPartner] = useState({ name: '', role: 'Partner' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [cats, parts] = await Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/partners').then(r => r.json()),
    ]);
    setCategories(cats);
    setPartners(parts);
  };

  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    if (!newCat.name.trim()) return;
    setLoading(true);
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat),
    });
    setNewCat({ name: '', type: 'expense', color: COLORS[0] });
    await load();
    setLoading(false);
  };

  const deleteCategory = async (id: number) => {
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const addPartner = async () => {
    if (!newPartner.name.trim()) return;
    setLoading(true);
    await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPartner),
    });
    setNewPartner({ name: '', role: 'Partner' });
    await load();
    setLoading(false);
  };

  const deletePartner = async (id: number) => {
    await fetch('/api/partners', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await load();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {(['categories', 'partners'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-semibold capitalize transition-colors border-b-2 ${
                tab === t ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === 'categories' && (
            <>
              {/* Add new category */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Category</div>
                <input
                  type="text"
                  value={newCat.name}
                  onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
                  placeholder="Category name"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newCat.type}
                    onChange={e => setNewCat(n => ({ ...n, type: e.target.value }))}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCat(n => ({ ...n, color: c }))}
                      className={`w-7 h-7 rounded-full transition-transform ${newCat.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <button
                  onClick={addCategory}
                  disabled={loading || !newCat.name.trim()}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={15} /> Add Category
                </button>
              </div>

              {/* Existing categories */}
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{cat.type}</div>
                    </div>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'partners' && (
            <>
              {/* Add new partner */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Person</div>
                <input
                  type="text"
                  value={newPartner.name}
                  onChange={e => setNewPartner(n => ({ ...n, name: e.target.value }))}
                  placeholder="Person's name"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={newPartner.role}
                  onChange={e => setNewPartner(n => ({ ...n, role: e.target.value }))}
                  placeholder="Role (e.g. Partner, Owner, Employee)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addPartner}
                  disabled={loading || !newPartner.name.trim()}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={15} /> Add Person
                </button>
              </div>

              {/* Existing partners */}
              <div className="space-y-2">
                {partners.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {p.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.role}</div>
                    </div>
                    <button
                      onClick={() => deletePartner(p.id)}
                      className="p-1.5 text-gray-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
