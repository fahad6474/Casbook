'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface TrendItem {
  month: string;
  income: number;
  expense: number;
  withdrawal: number;
}

interface CategoryItem {
  name: string;
  color: string;
  total: number;
  type: string;
}

interface Props {
  trend: TrendItem[];
  byCategory: CategoryItem[];
}

function shortMonth(ym: string) {
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function TrendChart({ trend }: { trend: TrendItem[] }) {
  if (!trend || trend.length === 0) return null;
  const data = trend.map(t => ({ ...t, month: shortMonth(t.month) }));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 mb-4">6-Month Trend</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barGap={2} barSize={12}>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={38} />
          <Tooltip
            formatter={(v, name) => [fmt(Number(v)), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="income" />
          <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="expense" />
          <Bar dataKey="withdrawal" fill="#f59e0b" radius={[4, 4, 0, 0]} name="withdrawal" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2">
        {[['#22c55e', 'Income'], ['#ef4444', 'Expense'], ['#f59e0b', 'Withdrawal']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryPieChart({ byCategory }: { byCategory: CategoryItem[] }) {
  if (!byCategory || byCategory.length === 0) return null;

  const expenses = byCategory.filter(c => c.type === 'expense' || c.type === 'withdrawal');
  if (expenses.length === 0) return null;

  const top = expenses.slice(0, 6);
  const otherTotal = expenses.slice(6).reduce((s, c) => s + c.total, 0);
  const data = otherTotal > 0 ? [...top, { name: 'Other', color: '#d1d5db', total: otherTotal }] : top;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 mb-2">Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={75}
            innerRadius={40}
            dataKey="total"
            nameKey="name"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v, name) => [fmt(Number(v)), String(name)]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
