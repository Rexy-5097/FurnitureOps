'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { subscribeAction, type NewsletterState } from '../actions';

/** Controlled email field + Server Action, with inline status for screen readers. */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<NewsletterState>({ status: 'idle' });
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await subscribeAction({ email });
      setState(result);
      if (result.status === 'ok') setEmail('');
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.status === 'error') setState({ status: 'idle' });
          }}
          placeholder="Your email address"
          aria-invalid={state.status === 'error' || undefined}
          aria-describedby="newsletter-status"
          className="h-12 flex-1 rounded-full bg-white px-5 text-[15px] text-[#292725] placeholder:text-[#8a837a] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-full bg-lab-forest px-7 text-sm font-semibold text-lab-on-dark transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? 'Signing up…' : 'Sign me up'}
        </button>
      </div>
      <p id="newsletter-status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm">
        {state.message}
      </p>
    </form>
  );
}
