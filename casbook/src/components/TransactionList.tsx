'use client';
import { useState } from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown, ArrowDownUp } from 'lucide-react';
import { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Math.abs(n));
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const typeConfig = {
  income: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', sign: '+' },
  expense: { icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50', badge: 'bg-rose-100 text-rose-700', sign: '-' },
  withdrawal: { icon: ArrowDownUp, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', sign: '-' },
};

export default function TransactionList({ transactions, onEdit, onDelete, loading }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📒</div>
        <div className="font-semibold text-gray-500">No transactions yet</div>
        <div className="text-sm mt-1">Tap + to add your first entry</div>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const t of transactions) {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date].push(t);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{fmtDate(date)}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="space-y-2">
            {txs.map(t => {
              const cfg = typeConfig[t.type];
              const Icon = cfg.icon;
              return (
                <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`${cfg.bg} rounded-full p-2.5 flex-shrink-0`}>
                      <Icon size={16} className={cfg.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm truncate">
                          {t.description || t.category_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                          {t.category_name}
                        </span>
                        {t.partner_name && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {t.partner_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount + balance */}
                    <div className="text-right flex-shrink-0">
                      <div className={`font-bold text-sm ${cfg.color}`}>
                        {cfg.sign}{fmt(t.amount)}
                      </div>
                      {t.running_balance !== undefined && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Bal: {fmt(t.running_balance ?? 0)}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 ml-1">
                      <button
                        onClick={() => onEdit(t)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(t.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Delete confirm modal */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
            <div className="text-lg font-bold text-gray-900 mb-2">Delete Transaction?</div>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
