import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const { date, type, category_id, description, amount, partner_id } = body;

  if (!date || !type || !category_id || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  db.prepare(`
    UPDATE transactions SET date=?, type=?, category_id=?, description=?, amount=?, partner_id=?
    WHERE id=?
  `).run(date, type, category_id, description || '', amount, partner_id || null, Number(id));

  const tx = db.prepare(`
    SELECT t.*, c.name as category_name, p.name as partner_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN partners p ON t.partner_id = p.id
    WHERE t.id = ?
  `).get(Number(id));

  return NextResponse.json(tx);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM transactions WHERE id=?').run(Number(id));
  return NextResponse.json({ success: true });
}
