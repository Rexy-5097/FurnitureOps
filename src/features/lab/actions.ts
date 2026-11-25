'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { can, isRole, LAB_ROLE_COOKIE } from './auth';
import { getLabRole } from './session';
import { ItemInputSchema, toFieldErrors, type ItemInput, type LabItem } from './schema';
import { createItem, resetStore } from './data/store';

/**
 * Server Actions (INT257 Unit III). They run only on the server, re-validate
 * with the same Zod schema the client used, and revalidate cached pages.
 */

export async function signInAction(formData: FormData) {
  const role = formData.get('role');
  const next = String(formData.get('next') || '/lab/studio');
  if (!isRole(role)) return;

  cookies().set(LAB_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hour lab session
    secure: process.env.NODE_ENV === 'production',
  });

  // Only allow same-site relative redirects.
  redirect(next.startsWith('/lab') ? next : '/lab');
}

export async function signOutAction() {
  cookies().delete(LAB_ROLE_COOKIE);
  redirect('/lab');
}

export type CreateResult =
  | { ok: true; item: LabItem }
  | { ok: false; message: string; fieldErrors?: Partial<Record<keyof ItemInput, string>> };

export async function createItemAction(input: unknown): Promise<CreateResult> {
  if (!can(getLabRole(), 'create')) {
    return { ok: false, message: 'Your role cannot add pieces. Sign in as staff or admin.' };
  }

  const parsed = ItemInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Some fields need attention.', fieldErrors: toFieldErrors(parsed.error) };
  }

  const item = createItem(parsed.data);
  revalidatePath('/lab', 'layout');
  return { ok: true, item };
}

const NewsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export type NewsletterState = { status: 'idle' | 'ok' | 'error'; message?: string };

/** Newsletter sign-up. Validates only; the lab stores nothing. */
export async function subscribeAction(input: unknown): Promise<NewsletterState> {
  const parsed = NewsletterSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message };
  await new Promise((resolve) => setTimeout(resolve, 400)); // simulate a mail provider
  return { status: 'ok', message: `Thanks. We'll write to ${parsed.data.email} when new pieces land.` };
}

export async function resetLabAction() {
  if (!can(getLabRole(), 'reset')) return { ok: false as const };
  resetStore();
  revalidatePath('/lab', 'layout');
  return { ok: true as const };
}
