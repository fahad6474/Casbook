'use client';
import { useState } from 'react';
import { Search, SlidersHorizontal, X, Calendar } from 'lucide-react';
import { TransactionFilters, Category, Partner, TransactionType } from '@/types';

interface Props {
  filters: TransactionFilters;
  onChange: (f: TransactionFilters) => void;
  categories: Category[];
  partners: Partner[];
}

const QUICK_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

function getRange(range: string): { start_date: string; end_date: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (range) {
    case 'today': {
      const t = fmt(now);
      return { start_date: t, end_date: t };
    }
    case 'week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return { start_date: fmt(new Date(now.setDate(diff))), end_date: fmt(new Date()) };
    }
    case 'month': {
      return {
        start_date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
        end_date: fmt(now),
      };
    }
    case 'last_month': {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lme = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start_date: fmt(lm), end_date: fmt(lme) };
    }
    case 'year': {
      return { start_date: `${now.getFullYear()}-01-01`, end_date: fmt(now) };
    }
    default:
      return { start_date: '', end_date: '' };
  }
}

export default function FilterBar({ filters, onChange, categories, partners }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeRange, setActiveRange] = useState('all');

  const setQuickRange = (range: string) => {
    setActiveRange(range);
    const { start_date, end_date } = getRange(range);
    onChange({ ...filters, start_date, end_date });
  };

  const hasActiveFilters =
    filters.type || filters.category_id || filters.partner_id ||
    filters.start_date || filters.end_date;

  const clearAll = () => {
    setActiveRange('all');
    onChange({ search: filters.search });
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Search transactions..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Quick date ranges */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => setQuickRange(r.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeRange === r.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Advanced filters toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-indigo-600 font-semibold"
        >
          <SlidersHorizontal size={15} />
          {showAdvanced ? 'Hide Filters' : 'More Filters'}
        </button>
        {hasActiveFilters && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 shadow-sm">
          {/* Custom date range */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Custom Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={e => { setActiveRange('custom'); onChange({ ...filters, start_date: e.target.value }); }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={e => { setActiveRange('custom'); onChange({ ...filters, end_date: e.target.value }); }}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Type filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {(['', 'income', 'expense', 'withdrawal'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => onChange({ ...filters, type: t as TransactionType | '' })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    filters.type === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t === '' ? 'All' : t === 'income' ? 'In' : t === 'expense' ? 'Out' : 'Draw'}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Category</label>
            <select
              value={filters.category_id || ''}
              onChange={e => onChange({ ...filters, category_id: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Partner filter */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Person</label>
            <select
              value={filters.partner_id || ''}
              onChange={e => onChange({ ...filters, partner_id: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Persons</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
