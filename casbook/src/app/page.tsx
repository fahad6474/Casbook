'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Settings, BarChart2, List, RefreshCw } from 'lucide-react';
import SummaryCards from '@/components/SummaryCards';
import TransactionList from '@/components/TransactionList';
import TransactionForm from '@/components/TransactionForm';
import FilterBar from '@/components/FilterBar';
import SettingsPanel from '@/components/SettingsPanel';
import { TrendChart, CategoryPieChart } from '@/components/Charts';
import { Transaction, Category, Partner, TransactionFilters, Summary } from '@/types';

type Tab = 'ledger' | 'charts';

const DEFAULT_SUMMARY: Summary = {
  total_income: 0,
  total_expense: 0,
  total_withdrawal: 0,
  balance: 0,
  transaction_count: 0,
};

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('ledger');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>(DEFAULT_SUMMARY);
  const [trend, setTrend] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byPartner, setByPartner] = useState([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState(1);

  const loadMeta = useCallback(async () => {
    const [cats, parts] = await Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/partners').then(r => r.json()),
    ]);
    setCategories(cats);
    setPartners(parts);
  }, []);

  const buildQuery = useCallback((f: TransactionFilters, p: number) => {
    const params = new URLSearchParams();
    if (f.start_date) params.set('start_date', f.start_date);
    if (f.end_date) params.set('end_date', f.end_date);
    if (f.type) params.set('type', f.type);
    if (f.category_id) params.set('category_id', String(f.category_id));
    if (f.partner_id) params.set('partner_id', String(f.partner_id));
    if (f.search) params.set('search', f.search);
    params.set('page', String(p));
    params.set('limit', '50');
    return params.toString();
  }, []);

  const loadTransactions = useCallback(async (f: TransactionFilters, p: number) => {
    setLoading(true);
    try {
      const qs = buildQuery(f, p);
      const sumParams = new URLSearchParams();
      if (f.start_date) sumParams.set('start_date', f.start_date);
      if (f.end_date) sumParams.set('end_date', f.end_date);
      const [txRes, sumRes] = await Promise.all([
        fetch(`/api/transactions?${qs}`).then(r => r.json()),
        fetch(`/api/summary?${sumParams.toString()}`).then(r => r.json()),
      ]);
      setTransactions(txRes.transactions || []);
      setTotal(txRes.total || 0);
      setSummary(sumRes.summary || DEFAULT_SUMMARY);
      setTrend(sumRes.trend || []);
      setByCategory(sumRes.byCategory || []);
      setByPartner(sumRes.byPartner || []);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { loadMeta(); }, [loadMeta]);

  useEffect(() => {
    setPage(1);
    loadTransactions(filters, 1);
  }, [filters, loadTransactions]);

  const handleDelete = async (id: number) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    loadTransactions(filters, page);
  };

  const handleEdit = (t: Transaction) => {
    setEditTx(t);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTx(null);
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 px-5 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CashBook</h1>
            <p className="text-indigo-200 text-xs mt-0.5">Company Ledger</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadTransactions(filters, page)}
              className="p-2 rounded-full bg-indigo-500/50 hover:bg-indigo-500 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full bg-indigo-500/50 hover:bg-indigo-500 transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        <SummaryCards summary={summary} />

        {/* Partner breakdown */}
        {byPartner && (byPartner as {name: string; role: string; total: number; count: number}[]).length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {(byPartner as {name: string; role: string; total: number; count: number}[]).map(p => (
              <div key={p.name} className="flex-shrink-0 bg-white/10 rounded-xl px-3 py-2 text-center min-w-[90px]">
                <div className="text-xs text-indigo-200">{p.name}</div>
                <div className="text-sm font-bold text-white">${p.total?.toFixed(2)}</div>
                <div className="text-xs text-indigo-300">{p.count} txns</div>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 flex sticky top-0 z-30">
        {([
          { key: 'ledger', label: 'Ledger', icon: List },
          { key: 'charts', label: 'Charts', icon: BarChart2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors border-b-2 ${
              tab === key
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 pb-24 space-y-4">
        {tab === 'ledger' && (
          <>
            <FilterBar
              filters={filters}
              onChange={setFilters}
              categories={categories}
              partners={partners}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                {total} transaction{total !== 1 ? 's' : ''}
              </span>
              {total > 50 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { const newPage = Math.max(1, page - 1); setPage(newPage); loadTransactions(filters, newPage); }}
                    disabled={page === 1}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500">Page {page}</span>
                  <button
                    onClick={() => { const newPage = page + 1; setPage(newPage); loadTransactions(filters, newPage); }}
                    disabled={page * 50 >= total}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <TransactionList
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </>
        )}

        {tab === 'charts' && (
          <div className="space-y-4">
            <TrendChart trend={trend} />
            <CategoryPieChart byCategory={byCategory} />

            {byPartner && (byPartner as {name: string; role: string; total: number; count: number}[]).length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Spending by Person</h3>
                <div className="space-y-2">
                  {(byPartner as {name: string; role: string; total: number; count: number}[]).map(p => (
                    <div key={p.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.count} transactions</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">${p.total?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-6 right-4 z-40">
        <button
          onClick={() => { setEditTx(null); setShowForm(true); }}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
        >
          <Plus size={26} />
        </button>
      </div>

      {showForm && (
        <TransactionForm
          transaction={editTx}
          onClose={closeForm}
          onSaved={() => loadTransactions(filters, page)}
        />
      )}
      {showSettings && (
        <SettingsPanel onClose={() => { setShowSettings(false); loadMeta(); }} />
      )}
    </div>
  );
}
