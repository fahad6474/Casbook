import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);

  const start_date = searchParams.get('start_date') || '';
  const end_date = searchParams.get('end_date') || '';

  let where = 'WHERE 1=1';
  const params: string[] = [];
  if (start_date) { where += ' AND date >= ?'; params.push(start_date); }
  if (end_date) { where += ' AND date <= ?'; params.push(end_date); }

  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN type='withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawal,
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as balance,
      COUNT(*) as transaction_count
    FROM transactions ${where}
  `).get(params);

  // Category breakdown
  const byCategory = db.prepare(`
    SELECT c.name, c.color, t.type,
      SUM(t.amount) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${where}
    GROUP BY t.category_id, t.type
    ORDER BY total DESC
  `).all(params);

  // Partner withdrawals
  const byPartner = db.prepare(`
    SELECT p.name, p.role,
      SUM(t.amount) as total,
      COUNT(*) as count
    FROM transactions t
    LEFT JOIN partners p ON t.partner_id = p.id
    ${where.replace('WHERE 1=1', "WHERE t.type IN ('withdrawal', 'expense')")}
    GROUP BY t.partner_id
    ORDER BY total DESC
  `).all(params);

  // Monthly trend (last 6 months)
  const trend = db.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense,
      SUM(CASE WHEN type='withdrawal' THEN amount ELSE 0 END) as withdrawal
    FROM transactions
    WHERE date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all();

  return NextResponse.json({ summary, byCategory, byPartner, trend });
}
