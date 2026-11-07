import Link from "next/link";
import { coverage, getDispute, observe } from "@/lib/disputes";
import { gatherFacts, templateNotes, timeline } from "@/lib/evidence";
import { get } from "@/lib/store";
import { FlagCard } from "@/app/orders/[id]/flag-card";
import { Filing } from "./filing";

export const dynamic = "force-dynamic";

const nice = (s?: string) => s?.replaceAll("_", " ").toLowerCase() ?? "";
const when = (s: string) => s.slice(0, 19).replace("T", " ") + " UTC";

export default async function Case({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDispute(id).catch((e: Error) => e);
  if (d instanceof Error) return <main className="mx-auto max-w-xl px-4 py-10"><p role="alert">{d.message}</p></main>;
  const rec = await observe(d, "page view");
  const sale = rec.orderId ? await get("sales", rec.orderId) : undefined;
  const facts = rec.orderId ? await gatherFacts(d, rec.orderId, sale) : undefined;
  const cover = coverage(d, facts?.sale.categories);
  const t = facts?.tracking[0];
  const plan = facts ? [
    { ok: !!t, text: t ? `${t.carrier} ${t.number} is on the PayPal transaction (${t.status})` : "No tracking on the PayPal transaction" },
    { ok: facts.label?.matchesShipTo === true || !!facts.label?.reprintedToZip, text: facts.label ? `Label checked against the Transaction Details address${facts.label.reprintedToZip ? `, reprinted to ZIP ${facts.label.reprintedToZip}` : ""}` : "No packing-bench label check recorded" },
    { ok: !!facts.label?.photoSha256, text: facts.label?.photoSha256 ? `Packing photo recorded, SHA-256 ${facts.label.photoSha256.slice(0, 12)}...` : "No packing photo recorded" },
    { ok: !!facts.shipTo, text: facts.shipTo ? `Ship-to on file: ${facts.shipTo.admin_area_2}, ${facts.shipTo.admin_area_1} ${facts.shipTo.postal_code}` : "No ship-to on the order" },
  ] : [];
  const canFile = d.links.includes("provide_evidence") || d.links.includes("provide_supporting_info");

  return (
    <main className="mx-auto max-w-xl px-4 py-10 space-y-8">
      <div className="space-y-1">
        <Link href="/disputes" className="text-sm text-neutral-500 hover:underline">Cases</Link>
        <h1 className="text-2xl font-semibold">{nice(d.reason).replace(/^./, c => c.toUpperCase())}</h1>
        <p className="tabular-nums text-neutral-600 dark:text-neutral-400">${d.amount} · {d.id} · {nice(d.stage)} · {nice(d.status)}</p>
        {rec.orderId && <Link href={`/orders/${rec.orderId}`} className="text-sm underline">{facts?.sale.item ?? "Order"} {rec.orderId}</Link>}
        {d.dueAt && <p className="text-sm">Respond by {when(d.dueAt)}</p>}
      </div>

      {d.buyerNotes[0] && <blockquote className="border-l-2 pl-3 italic">Buyer: &ldquo;{d.buyerNotes[0]}&rdquo;</blockquote>}

      {cover.map(f => <FlagCard key={f.rule.id} flag={f} />)}

      <section className="space-y-2">
        <h2 className="font-medium">PayPal asks for: {d.requested.length ? d.requested.map(nice).join(", ") : "nothing named (supporting info only)"}</h2>
        <ul className="space-y-1 text-sm">
          {plan.map(p => <li key={p.text}><span aria-hidden>{p.ok ? "✓" : "✗"}</span> <span className={p.ok ? "" : "text-red-700 dark:text-red-400"}>{p.text}</span></li>)}
        </ul>
      </section>

      {facts && (
        <section className="space-y-2">
          <h2 className="font-medium">Timeline in the evidence PDF</h2>
          <ol className="space-y-2 text-sm">
            {timeline(facts).map(([at, what]) => <li key={at + what}><span className="font-mono text-xs text-neutral-500">{at}</span><br />{what}</li>)}
          </ol>
        </section>
      )}

      {facts && (
        <Filing id={d.id} filed={rec.filing ? { ...rec.filing, pdfBase64: undefined } : undefined} canFile={canFile}
          path={d.links.includes("provide_evidence") ? "provide-evidence" : "provide-supporting-info"}
          initialNotes={rec.draft?.notes ?? ""} initialBy={rec.draft?.by} fallbackNotes={templateNotes(facts)} />
      )}

      <section className="space-y-2">
        <h2 className="font-medium">What PayPal returned, in order</h2>
        <ol className="space-y-1 text-sm">
          {rec.chain.map(s => (
            <li key={s.at + s.via} className="grid grid-cols-[auto_1fr] gap-x-3">
              <span className="font-mono text-xs text-neutral-500 pt-0.5">{when(s.at)}</span>
              <span>{nice(s.stage)} · {nice(s.status)} <span className="text-neutral-500">({s.via}{s.debugId ? `, debug_id ${s.debugId}` : ""})</span></span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-neutral-500">Recorded from real sandbox responses and webhooks. Nothing here is simulated.</p>
      </section>
    </main>
  );
}
