'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';
import { resetLabAction } from '@/features/lab/actions';
import { Price } from '@/features/lab/components/client-bits';
import { Notice, buttonClass } from '@/features/lab/components/StateViews';
import { labKeys, useDeleteItem, useLabInventory, useUpdateStock } from '@/features/lab/hooks/use-lab-inventory';
import { cx } from '@/features/lab/utils/format';

const ALL = { q: '', category: 'all', sort: 'newest', inStock: false };

/** Stock ledger with optimistic mutations (INT257 Unit III: Optimistic UI). */
export default function StockLedger({ canDelete, canReset }: { canDelete: boolean; canReset: boolean }) {
  const qc = useQueryClient();
  const { data, isPending, isError, error, refetch } = useLabInventory(ALL);
  const updateStock = useUpdateStock();
  const deleteItem = useDeleteItem();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isResetting, startReset] = useTransition();

  const mutationError = updateStock.error ?? deleteItem.error;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="ledger" className="font-display text-2xl">
            Stock ledger
          </h2>
          <p className="mt-1 text-sm text-lab-muted">Changes apply instantly and roll back if the server refuses.</p>
        </div>
        {canReset && (
          <button
            type="button"
            disabled={isResetting}
            onClick={() =>
              startReset(async () => {
                await resetLabAction();
                await qc.invalidateQueries({ queryKey: labKeys.all });
              })
            }
            className={buttonClass.ghost + ' h-9 px-4 text-xs'}
          >
            {isResetting ? 'Resetting…' : 'Reset lab data'}
          </button>
        )}
      </div>

      {mutationError && (
        <p role="alert" className="mt-4 rounded-2xl bg-lab-danger/10 px-4 py-3 text-sm text-lab-danger">
          {mutationError.message}. The change was rolled back.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-[22px] border border-lab-line bg-lab-surface">
        {isPending ? (
          <div className="space-y-px" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse bg-lab-line/40" />
            ))}
          </div>
        ) : isError ? (
          <Notice tone="danger" title="Ledger unavailable" action={<button className={buttonClass.primary} onClick={() => refetch()}>Retry</button>}>
            {error.message}
          </Notice>
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">Pieces and stock levels</caption>
            <thead>
              <tr className="border-b border-lab-line text-left text-[11px] uppercase tracking-[0.16em] text-lab-muted">
                <th scope="col" className="px-5 py-3 font-medium">Piece</th>
                <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Price</th>
                <th scope="col" className="px-3 py-3 text-center font-medium">Stock</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lab-line">
              {data.items.map((item) => (
                <tr key={item.id} className="align-middle">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: item.tone }} aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="truncate text-xs text-lab-muted">{item.origin}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 tabular-nums sm:table-cell">
                    <Price amount={item.price} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="mx-auto flex w-fit items-center rounded-full border border-lab-line">
                      <button
                        type="button"
                        aria-label={`Decrease stock of ${item.name}`}
                        disabled={item.quantity_available === 0}
                        onClick={() => updateStock.mutate({ id: item.id, patch: { quantity_available: item.quantity_available - 1 } })}
                        className="h-8 w-8 rounded-l-full hover:bg-lab-ink/5 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className={cx('w-8 text-center tabular-nums', item.quantity_available === 0 && 'text-lab-danger')}>
                        {item.quantity_available}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase stock of ${item.name}`}
                        onClick={() => updateStock.mutate({ id: item.id, patch: { quantity_available: item.quantity_available + 1 } })}
                        className="h-8 w-8 rounded-r-full hover:bg-lab-ink/5"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {canDelete ? (
                      confirmId === item.id ? (
                        <span className="inline-flex gap-1">
                          <button type="button" className={buttonClass.danger + ' bg-lab-danger/10'} onClick={() => { deleteItem.mutate(item.id); setConfirmId(null); }}>
                            Confirm
                          </button>
                          <button type="button" className="h-9 px-3 text-xs text-lab-muted" onClick={() => setConfirmId(null)}>
                            Keep
                          </button>
                        </span>
                      ) : (
                        <button type="button" className={buttonClass.danger} onClick={() => setConfirmId(item.id)}>
                          Delete
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-lab-muted" title="Only admins can delete">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
