import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const partners = db.prepare('SELECT * FROM partners ORDER BY name').all();
  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const { name, role } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const result = db.prepare('INSERT INTO partners (name, role) VALUES (?, ?)').run(name, role || 'Partner');
  const partner = db.prepare('SELECT * FROM partners WHERE id=?').get(result.lastInsertRowid);
  return NextResponse.json(partner, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { id } = await req.json();
  db.prepare('DELETE FROM partners WHERE id=?').run(Number(id));
  return NextResponse.json({ success: true });
}
