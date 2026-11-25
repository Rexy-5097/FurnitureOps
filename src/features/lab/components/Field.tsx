import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from '../utils/format';

/**
 * Reusable form field (INT252 Unit IV). Wires label, hint and error together
 * with aria-describedby / aria-invalid so screen readers announce errors.
 */

type Base = { name: string; label: string; hint?: string; error?: string; className?: string };

const control =
  'mt-2 block w-full rounded-xl border bg-lab-surface px-4 text-[15px] text-lab-ink placeholder:text-lab-muted/60 transition-colors focus:outline-none';

function Shell({ name, label, hint, error, className, children }: Base & { children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-sm font-medium text-lab-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-lab-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="mt-1.5 text-xs text-lab-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const a11y = ({ name, error, hint }: Base) => ({
  id: name,
  name,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${name}-error` : hint ? `${name}-hint` : undefined,
});

const border = (error?: string) => (error ? 'border-lab-danger focus:border-lab-danger' : 'border-lab-line focus:border-lab-ink');

export function TextField({ label, hint, error, className, ...rest }: Base & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  const base = { name: rest.name, label, hint, error };
  return (
    <Shell {...base} className={className}>
      <input {...rest} {...a11y(base)} className={cx(control, 'h-12', border(error))} />
    </Shell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...rest
}: Base & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'name'>) {
  const base = { name: rest.name, label, hint, error };
  return (
    <Shell {...base} className={className}>
      <select {...rest} {...a11y(base)} className={cx(control, 'h-12 capitalize', border(error))}>
        {children}
      </select>
    </Shell>
  );
}

export function TextAreaField({ label, hint, error, className, ...rest }: Base & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'>) {
  const base = { name: rest.name, label, hint, error };
  return (
    <Shell {...base} className={className}>
      <textarea {...rest} {...a11y(base)} className={cx(control, 'min-h-[96px] py-3', border(error))} />
    </Shell>
  );
}
