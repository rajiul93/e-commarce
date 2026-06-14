'use client';

import { Button } from '@/components/ui/button';
import { buildAllCombinations, emptyRow, suggestSku } from '@/lib/variant-draft';
import type { VariantDraftRow } from '@/lib/variant-draft';
import type { Attribute } from '@/types';

type Props = {
  assigned: Attribute[];
  rows: VariantDraftRow[];
  onChange: (rows: VariantDraftRow[]) => void;
  productTitle: string;
};

export function ProductVariantSetup({ assigned, rows, onChange, productTitle }: Props) {
  if (!assigned.length) {
    return (
      <p className="text-sm text-zinc-500">
        Select one or more attributes above (Size, Color, Weight …), then set up variants below.
      </p>
    );
  }

  const isSingle = assigned.length === 1;

  function updateRow(localId: string, patch: Partial<VariantDraftRow>) {
    onChange(rows.map((r) => (r.localId === localId ? { ...r, ...patch } : r)));
  }

  function addRow() {
    onChange([...rows, emptyRow(assigned, productTitle)]);
  }

  function removeRow(localId: string) {
    onChange(rows.filter((r) => r.localId !== localId));
  }

  function generateAll() {
    onChange(buildAllCombinations(assigned, productTitle));
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Stock & availability</h3>
          <p className="text-xs text-zinc-500">
            {isSingle
              ? `Tick available ${assigned[0].name} values and set price/stock.`
              : `Each row must pick a value for: ${assigned.map((a) => a.name).join(', ')}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isSingle ? (
            <Button type="button" variant="secondary" onClick={generateAll}>
              Generate all combinations
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={addRow}>
            Add row
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-3">Available</th>
              {assigned.map((attr) => (
                <th key={attr._id} className="p-3">
                  {attr.name}
                </th>
              ))}
              <th className="p-3">Buy price</th>
              <th className="p-3">Sell price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">SKU</th>
              {!isSingle ? <th className="p-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={assigned.length + 6} className="p-4 text-center text-zinc-500">
                  No variant rows yet. Add a row
                  {!isSingle ? ' or generate all combinations' : ''}.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.localId} className="border-b border-zinc-50 align-top">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateRow(row.localId, { enabled: e.target.checked })}
                    />
                  </td>
                  {assigned.map((attr) => (
                    <td key={attr._id} className="p-3">
                      {isSingle ? (
                        <span className="font-medium">{row.attrValues[attr.name]}</span>
                      ) : (
                        <select
                          value={row.attrValues[attr.name] ?? ''}
                          disabled={!row.enabled}
                          onChange={(e) => {
                            const attrValues = {
                              ...row.attrValues,
                              [attr.name]: e.target.value,
                            };
                            updateRow(row.localId, {
                              attrValues,
                              sku: suggestSku(productTitle, attrValues),
                            });
                          }}
                          className="w-full min-w-[5rem] rounded border border-zinc-300 px-2 py-1.5 text-sm disabled:bg-zinc-100"
                        >
                          <option value="">Select {attr.name}</option>
                          {attr.values.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  ))}
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      value={row.buyPrice || ''}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        updateRow(row.localId, { buyPrice: Number(e.target.value) || 0 })
                      }
                      className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-100"
                      placeholder="Cost"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      value={row.price || ''}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        updateRow(row.localId, { price: Number(e.target.value) || 0 })
                      }
                      className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-100"
                      placeholder="Sell"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      value={row.stock || ''}
                      disabled={!row.enabled}
                      onChange={(e) =>
                        updateRow(row.localId, { stock: Number(e.target.value) || 0 })
                      }
                      className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-100"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={row.sku}
                      disabled={!row.enabled}
                      onChange={(e) => updateRow(row.localId, { sku: e.target.value })}
                      className="w-full min-w-[7rem] rounded border border-zinc-300 px-2 py-1 text-xs disabled:bg-zinc-100"
                    />
                  </td>
                  {!isSingle ? (
                    <td className="p-3">
                      <button
                        type="button"
                        className="text-xs text-red-600 underline"
                        onClick={() => removeRow(row.localId)}
                      >
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500">
        Attributes: {assigned.map((a) => a.name).join(', ')} · Available:{' '}
        {rows.filter((r) => r.enabled).length} · Total stock:{' '}
        {rows.filter((r) => r.enabled).reduce((s, r) => s + r.stock, 0)}
      </p>
    </div>
  );
}
