import { NextResponse } from 'next/server';
import { can, roleFromRequest } from '@/features/lab/auth';
import { CATEGORIES, ItemInputSchema, toFieldErrors, type Category } from '@/features/lab/schema';
import { createItem, listItems, type ListQuery } from '@/features/lab/data/store';

// Route Handlers + REST (INT257 Unit III). Always dynamic: the store is in memory.
export const dynamic = 'force-dynamic';

const SORTS = ['newest', 'price-asc', 'price-desc', 'name'] as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');

  const query: ListQuery = {
    q: searchParams.get('q') ?? '',
    category: CATEGORIES.includes(category as Category) ? (category as Category) : 'all',
    sort: SORTS.includes(sort as (typeof SORTS)[number]) ? (sort as ListQuery['sort']) : 'newest',
    inStock: searchParams.get('inStock') === '1',
  };

  // Optional artificial latency so loading states can be inspected in the lab.
  const delay = Math.min(Number(searchParams.get('delay') ?? 0), 3000);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

  if (searchParams.get('fail') === '1') {
    return NextResponse.json({ error: 'Simulated upstream failure' }, { status: 503 });
  }

  const items = listItems(query);
  return NextResponse.json(
    { items, count: items.length, servedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(req: Request) {
  if (!can(roleFromRequest(req), 'create')) {
    return NextResponse.json({ error: 'Forbidden for this role' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: toFieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  return NextResponse.json(createItem(parsed.data), { status: 201 });
}
