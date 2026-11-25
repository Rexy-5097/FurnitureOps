import 'server-only';
import { cookies } from 'next/headers';
import { isRole, LAB_ROLE_COOKIE, type Role } from './auth';

/** Server-side session read for Server Components and Server Actions. */
export const getLabRole = (): Role => {
  const value = cookies().get(LAB_ROLE_COOKIE)?.value;
  return isRole(value) ? value : 'guest';
};
