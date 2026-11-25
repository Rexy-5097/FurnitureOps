'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import { createItemAction } from '@/features/lab/actions';
import { SelectField, TextAreaField, TextField } from '@/features/lab/components/Field';
import { buttonClass } from '@/features/lab/components/StateViews';
import PieceVisual from '@/features/lab/components/PieceVisual';
import { labKeys } from '@/features/lab/hooks/use-lab-inventory';
import { CATEGORIES, ItemInputSchema, toFieldErrors, type ItemInput, type LabItem } from '@/features/lab/schema';

/**
 * Controlled form + Zod (INT252 Unit IV, INT257 Unit III).
 * - every input is controlled by `values`
 * - errors show only for touched fields, and for all fields after a submit attempt
 * - submit calls a Server Action, which validates again on the server
 */

type Values = Record<keyof ItemInput, string>;
type Errors = Partial<Record<keyof ItemInput, string>>;

const EMPTY: Values = {
  name: '',
  origin: '',
  category: 'seating',
  material: '',
  price: '',
  quantity_available: '1',
  tone: '#9A5C2C',
  description: '',
};

export default function ItemForm() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof ItemInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Errors>({});
  const [result, setResult] = useState<{ tone: 'ok' | 'error'; message: string; item?: LabItem } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Derived state: validation runs on every render from `values`; no extra state to keep in sync.
  const parsed = useMemo(() => ItemInputSchema.safeParse(values), [values]);
  const clientErrors: Errors = parsed.success ? {} : toFieldErrors(parsed.error);
  const errorFor = (field: keyof ItemInput) =>
    (submitted || touched[field] ? clientErrors[field] : undefined) ?? serverErrors[field];

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value })); // functional, immutable update
    setServerErrors(({ [name as keyof ItemInput]: _drop, ...rest }) => rest);
  };
  const onBlur = (e: { target: { name: string } }) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setResult(null);
    if (!parsed.success) return;

    startTransition(async () => {
      const res = await createItemAction(parsed.data);
      if (res.ok) {
        setResult({ tone: 'ok', message: `“${res.item.name}” is on the floor.`, item: res.item });
        setValues(EMPTY);
        setTouched({});
        setSubmitted(false);
        await qc.invalidateQueries({ queryKey: labKeys.all });
      } else {
        setServerErrors(res.fieldErrors ?? {});
        setResult({ tone: 'error', message: res.message });
      }
    });
  };

  const preview = {
    name: values.name || 'New piece',
    tone: /^#[0-9a-f]{6}$/i.test(values.tone) ? values.tone : '#9A5C2C',
    category: (CATEGORIES as readonly string[]).includes(values.category) ? (values.category as ItemInput['category']) : 'seating',
    image_url: null,
  };

  return (
    <form noValidate onSubmit={onSubmit} className="mt-8 space-y-5" aria-describedby="form-status">
      <div className="flex items-center gap-4 rounded-[20px] border border-lab-line bg-lab-surface p-3">
        <PieceVisual item={preview} className="h-20 w-20 shrink-0 rounded-[14px]" />
        <div className="min-w-0">
          <p className="truncate font-display text-xl">{preview.name}</p>
          <p className="text-xs text-lab-muted">Live preview from controlled state</p>
        </div>
      </div>

      <TextField name="name" label="Name" placeholder="Orla Lounge Chair" value={values.name} onChange={onChange} onBlur={onBlur} error={errorFor('name')} autoComplete="off" />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="origin" label="Origin" placeholder="Oslo, Norway" value={values.origin} onChange={onChange} onBlur={onBlur} error={errorFor('origin')} />
        <TextField name="material" label="Material" placeholder="Ash and sheepskin" value={values.material} onChange={onChange} onBlur={onBlur} error={errorFor('material')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField name="category" label="Category" value={values.category} onChange={onChange} onBlur={onBlur} error={errorFor('category')}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
        <TextField name="price" label="Price (₹)" inputMode="decimal" placeholder="88000" value={values.price} onChange={onChange} onBlur={onBlur} error={errorFor('price')} />
        <TextField name="quantity_available" label="Stock" inputMode="numeric" value={values.quantity_available} onChange={onChange} onBlur={onBlur} error={errorFor('quantity_available')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <TextField name="tone" label="Material tone" hint="Hex colour for the swatch" value={values.tone} onChange={onChange} onBlur={onBlur} error={errorFor('tone')} />
        <label className="flex flex-col text-sm font-medium">
          Pick
          <input
            type="color"
            aria-label="Pick tone colour"
            value={preview.tone}
            onChange={(e) => setValues((prev) => ({ ...prev, tone: e.target.value.toUpperCase() }))}
            className="mt-2 h-12 w-16 cursor-pointer rounded-xl border border-lab-line bg-lab-surface p-1"
          />
        </label>
      </div>

      <TextAreaField
        name="description"
        label="Description"
        hint={`${values.description.length}/280`}
        value={values.description}
        onChange={onChange}
        onBlur={onBlur}
        error={errorFor('description')}
      />

      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={isPending} className={buttonClass.primary}>
          {isPending ? 'Adding…' : 'Add to the floor'}
        </button>
        <button
          type="button"
          className="text-sm text-lab-muted hover:text-lab-ink"
          onClick={() => {
            setValues(EMPTY);
            setTouched({});
            setSubmitted(false);
            setServerErrors({});
            setResult(null);
          }}
        >
          Reset
        </button>
      </div>

      <div id="form-status" aria-live="polite">
        {result && (
          <p className={'rounded-2xl px-4 py-3 text-sm ' + (result.tone === 'ok' ? 'bg-lab-moss/10 text-lab-moss' : 'bg-lab-danger/10 text-lab-danger')}>
            {result.message}{' '}
            {result.item && (
              <Link href={`/lab/collection/${result.item.id}`} className="underline underline-offset-4">
                View it
              </Link>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
