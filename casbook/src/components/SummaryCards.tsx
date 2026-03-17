'use client';
import { TrendingUp, TrendingDown, Wallet, ArrowDownUp } from 'lucide-react';

interface SummaryCardsProps {
  summary: {
    total_income: number;
    total_expense: number;
    total_withdrawal: number;
    balance: number;
    transaction_count: number;
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Balance',
      value: summary.balance,
      icon: Wallet,
      bg: summary.balance >= 0 ? 'bg-indigo-600' : 'bg-red-600',
      iconBg: summary.balance >= 0 ? 'bg-indigo-500' : 'bg-red-500',
      textColor: 'text-white',
    },
    {
      label: 'Money In',
      value: summary.total_income,
      icon: TrendingUp,
      bg: 'bg-emerald-600',
      iconBg: 'bg-emerald-500',
      textColor: 'text-white',
    },
    {
      label: 'Money Out',
      value: summary.total_expense,
      icon: TrendingDown,
      bg: 'bg-rose-600',
      iconBg: 'bg-rose-500',
      textColor: 'text-white',
    },
    {
      label: 'Withdrawals',
      value: summary.total_withdrawal,
      icon: ArrowDownUp,
      bg: 'bg-amber-500',
      iconBg: 'bg-amber-400',
      textColor: 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4 shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium ${card.textColor} opacity-80`}>{card.label}</span>
              <div className={`${card.iconBg} rounded-full p-1.5`}>
                <Icon size={14} className={card.textColor} />
              </div>
            </div>
            <div className={`text-lg font-bold ${card.textColor} leading-tight`}>
              {fmt(card.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
