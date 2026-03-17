import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories ORDER BY type, name').all();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { name, type, color } = await req.json();
  if (!name || !type) return NextResponse.json({ error: 'Name and type required' }, { status: 400 });

  const result = db.prepare('INSERT INTO categories (name, type, color) VALUES (?, ?, ?)').run(
    name, type, color || '#6366f1'
  );
  const cat = db.prepare('SELECT * FROM categories WHERE id=?').get(result.lastInsertRowid);
  return NextResponse.json(cat, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  db.prepare('DELETE FROM categories WHERE id=?').run(Number(id));
  return NextResponse.json({ success: true });
}
