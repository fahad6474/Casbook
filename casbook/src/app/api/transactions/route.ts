import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);

  const start_date = searchParams.get('start_date') || '';
  const end_date = searchParams.get('end_date') || '';
  const type = searchParams.get('type') || '';
  const category_id = searchParams.get('category_id') || '';
  const partner_id = searchParams.get('partner_id') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (start_date) { where += ' AND t.date >= ?'; params.push(start_date); }
  if (end_date) { where += ' AND t.date <= ?'; params.push(end_date); }
  if (type) { where += ' AND t.type = ?'; params.push(type); }
  if (category_id) { where += ' AND t.category_id = ?'; params.push(Number(category_id)); }
  if (partner_id) { where += ' AND t.partner_id = ?'; params.push(Number(partner_id)); }
  if (search) { where += ' AND (t.description LIKE ? OR c.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  const query = `
    SELECT
      t.id, t.date, t.type, t.category_id, c.name as category_name,
      t.description, t.amount, t.partner_id, p.name as partner_name, t.created_at
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN partners p ON t.partner_id = p.id
    ${where}
    ORDER BY t.date DESC, t.id DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${where}
  `;

  const transactions = db.prepare(query).all([...params, limit, offset]);
  const { total } = db.prepare(countQuery).get(params) as { total: number };

  // Compute running balance for filtered set (ordered ascending)
  const balanceQuery = `
    SELECT
      t.id,
      CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END as signed_amount
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    ${where}
    ORDER BY t.date ASC, t.id ASC
  `;
  const allRows = db.prepare(balanceQuery).all(params) as { id: number; signed_amount: number }[];
  const balanceMap = new Map<number, number>();
  let running = 0;
  for (const row of allRows) {
    running += row.signed_amount;
    balanceMap.set(row.id, running);
  }

  const enriched = (transactions as { id: number }[]).map(t => ({
    ...t,
    running_balance: balanceMap.get(t.id) ?? 0,
  }));

  return NextResponse.json({ transactions: enriched, total, page, limit });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { date, type, category_id, description, amount, partner_id } = body;

  if (!date || !type || !category_id || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const stmt = db.prepare(`
    INSERT INTO transactions (date, type, category_id, description, amount, partner_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(date, type, category_id, description || '', amount, partner_id || null);

  const tx = db.prepare(`
    SELECT t.*, c.name as category_name, p.name as partner_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN partners p ON t.partner_id = p.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  return NextResponse.json(tx, { status: 201 });
}
