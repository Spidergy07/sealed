import Link from "next/link";
import { syncOrder } from "@/lib/paypal";
import { PackBench } from "./bench";

export const dynamic = "force-dynamic";

export default async function Pack({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await syncOrder(id).catch((e: Error) => e);
  if (o instanceof Error) return <main className="mx-auto max-w-md px-4 py-8"><p role="alert">{o.message}</p></main>;
  const a = o.shipTo;
  return (
    <main className="mx-auto max-w-md px-4 py-6 space-y-6">
      <div className="space-y-1">
        <Link href={`/orders/${o.id}`} className="text-sm text-neutral-500 hover:underline">{o.title ?? "Order"} · ${o.amount}</Link>
        <h1 className="text-2xl font-semibold">Packing bench</h1>
      </div>
      <section className="rounded-xl bg-neutral-100 dark:bg-neutral-900 p-4 text-sm">
        <p className="text-neutral-500">PayPal says ship to</p>
        {a ? (
          <p className="text-base leading-snug">{a.name}<br />{a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ""}<br />{a.admin_area_2}, {a.admin_area_1} <strong className="tabular-nums">{a.postal_code}</strong></p>
        ) : <p>No ship-to on this order.</p>}
      </section>
      <PackBench orderId={o.id} amount={o.amount ?? ""} paid={o.captureStatus === "COMPLETED"} />
    </main>
  );
}
