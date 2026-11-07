import Link from "next/link";
import { syncOrder } from "@/lib/paypal";
import { orderFlags } from "@/lib/rules";
import { FlagCard } from "./flag-card";
import { DmCheck } from "./dm-check";
import { SAMPLE_DM } from "@/lib/dm";

export const dynamic = "force-dynamic";

export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let o;
  try {
    o = await syncOrder(id);
  } catch (e) {
    return <main className="mx-auto max-w-xl px-4 py-10"><p role="alert">{(e as Error).message}</p><Link href="/" className="underline">Back</Link></main>;
  }
  const paid = !!o.captureId;
  const flags = paid ? orderFlags(o) : [];
  const a = o.shipTo;

  return (
    <main className="mx-auto max-w-xl px-4 py-10 space-y-8">
      <div className="space-y-1">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">Sealed</Link>
        <h1 className="text-2xl font-semibold">{o.title}</h1>
        <p className="tabular-nums text-neutral-600 dark:text-neutral-400">${o.amount} · order {o.id} · {o.status}</p>
      </div>

      {!paid && o.approveUrl && (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
          <h2 className="font-medium">Waiting for the buyer to pay</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Send this PayPal link to the buyer. Sandbox: log in as the sandbox buyer and pay with the PayPal wallet.</p>
          <a href={o.approveUrl} className="block break-all rounded-md bg-neutral-100 dark:bg-neutral-900 px-3 py-2 text-sm underline">{o.approveUrl}</a>
          <a href={`/orders/${o.id}`} className="inline-block text-sm underline">I paid, refresh</a>
        </section>
      )}

      {paid && (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
          <h2 className="font-medium">Ship to (PayPal Transaction Details)</h2>
          {a ? (
            <address className="not-italic leading-relaxed">
              {a.name}<br />{a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ""}<br />
              {a.admin_area_2}, {a.admin_area_1} <strong className="tabular-nums">{a.postal_code}</strong> {a.country_code}
            </address>
          ) : <p>No shipping address on this order.</p>}
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-neutral-500">Capture</dt><dd className="tabular-nums">{o.captureId} · {o.captureStatus}</dd>
            <dt className="text-neutral-500">PayPal&apos;s flag at capture</dt><dd>{o.sellerProtection?.status ?? "none"}</dd>
            <dt className="text-neutral-500">Covers</dt><dd>{o.sellerProtection?.dispute_categories?.join(", ").replaceAll("_", " ").toLowerCase() || "none"}</dd>
            <dt className="text-neutral-500">debug_id</dt><dd className="font-mono text-xs">{o.debugId}</dd>
          </dl>
        </section>
      )}

      {flags.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium">Order checks</h2>
          {flags.map(f => <FlagCard key={f.rule.id} flag={f} />)}
        </section>
      )}

      <DmCheck orderId={o.id} sample={SAMPLE_DM} />
    </main>
  );
}
