import { NextResponse } from 'next/server';
import { can, roleFromRequest } from '@/features/lab/auth';
import { ItemPatchSchema, toFieldErrors } from '@/features/lab/schema';
import { deleteItem, getItem, updateItem } from '@/features/lab/data/store';

// Dynamic Route Handler (INT257 Unit III): /api/lab/inventory/:id
export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } };

const notFound = (id: string) => NextResponse.json({ error: `No piece with id "${id}"` }, { status: 404 });

export async function GET(_req: Request, { params: { id } }: Ctx) {
  const item = getItem(id);
  return item ? NextResponse.json(item) : notFound(id);
}

export async function PATCH(req: Request, { params: { id } }: Ctx) {
  if (!can(roleFromRequest(req), 'edit')) {
    return NextResponse.json({ error: 'Forbidden for this role' }, { status: 403 });
  }
  const parsed = ItemPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: toFieldErrors(parsed.error) }, { status: 422 });
  }
  const item = updateItem(id, parsed.data);
  return item ? NextResponse.json(item) : notFound(id);
}

export async function DELETE(req: Request, { params: { id } }: Ctx) {
  if (!can(roleFromRequest(req), 'delete')) {
    return NextResponse.json({ error: 'Only admins can delete pieces' }, { status: 403 });
  }
  return deleteItem(id) ? new NextResponse(null, { status: 204 }) : notFound(id);
}
