import { Section } from "@evinvest/kitstart/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@evinvest/uikit";
import type { Copy } from "@/entities/content";
import type { PriceRow } from "@/shared/config/prices";
import { TYPE } from "@/shared/ui";

/**
 * The price list, TTC, right-aligned in tabular figures. Rendered only from
 * real numbers: with no list (`PRICES` null) there is no band at all — a
 * table of "to be published" rows would promise nothing.
 */
export function PriceTable({ copy, id, prices }: { copy: Copy; id: string; prices: readonly PriceRow[] | null }) {
  if (prices === null || prices.length === 0) return null;
  const t = copy.t.priceTable;
  const eur = new Intl.NumberFormat(copy.locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  return (
    <Section surface="card" id={id}>
      <div className="flex flex-col gap-5 md:flex-row md:gap-20">
        <div className="flex flex-col gap-3 md:w-[352px] md:shrink-0 md:gap-4">
          <h2 className={TYPE.h2}>{t.title}</h2>
          <p className={TYPE.lede}>{t.lede}</p>
        </div>
        <div className="min-w-0 flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[13px] font-medium text-ink-soft">{t.service}</TableHead>
                <TableHead className="text-right text-[13px] font-medium text-ink-soft">{t.price}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map(row => (
                <TableRow key={row.subject}>
                  <TableCell className="py-[18px]">
                    <span className="block text-[17px] font-medium text-ink">{copy.t.subjects[row.subject]}</span>
                    <span className="block text-sm text-ink-soft">{t.detail[row.subject]}</span>
                  </TableCell>
                  <TableCell className="py-[18px] text-right text-[17px] font-semibold tabular-nums text-ink">{eur.format(row.eur)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Section>
  );
}
