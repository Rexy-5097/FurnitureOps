/**
 * Lab-only session + role-based access control (INT257 Unit IV).
 * Kept free of `next/headers` so the Edge middleware can import it too.
 * The real app keeps using Supabase auth; this is a sandbox that needs no keys.
 */

export const LAB_ROLE_COOKIE = 'fo_lab_role';
export const ROLES = ['guest', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'reset';

const GRANTS: Record<Role, readonly Permission[]> = {
  guest: ['view'],
  staff: ['view', 'create', 'edit'],
  admin: ['view', 'create', 'edit', 'delete', 'reset'],
};

export const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value);

export const can = (role: Role | null | undefined, permission: Permission) =>
  GRANTS[role ?? 'guest'].includes(permission);

/** Reads the role from a Request's Cookie header (used by Route Handlers). */
export const roleFromRequest = (req: Request): Role => {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${LAB_ROLE_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return isRole(value) ? value : 'guest';
};

export const ROLE_COPY: Record<Role, { title: string; blurb: string }> = {
  guest: { title: 'Guest', blurb: 'Browse the collection. No studio access.' },
  staff: { title: 'Showroom staff', blurb: 'Add pieces and edit stock in the studio.' },
  admin: { title: 'Administrator', blurb: 'Everything staff can do, plus delete and reset.' },
};
