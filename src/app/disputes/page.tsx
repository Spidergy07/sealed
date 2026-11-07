import Link from "next/link";
import { listDisputes } from "@/lib/disputes";

export const dynamic = "force-dynamic";

const nice = (s?: string) => s?.replaceAll("_", " ").toLowerCase() ?? "";

export default async function Disputes() {
  const { items, debugId } = await listDisputes().catch(() => ({ items: [], debugId: null }));
  return (
    <main className="mx-auto max-w-xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">Sealed</Link>
        <h1 className="text-2xl font-semibold">Cases</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Read live from PayPal Disputes (debug_id <span className="font-mono text-xs">{debugId}</span>). New cases can take up to an hour to show here in sandbox; the webhook records them sooner.</p>
      </div>
      {items.length === 0 ? <p>No cases.</p> : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map(d => (
            <li key={d.id}>
              <Link href={`/disputes/${d.id}`} className="flex items-center justify-between gap-3 py-3 hover:underline">
                <span><span className="font-mono text-sm">{d.id}</span><br /><span className="text-sm text-neutral-500">{nice(d.reason)}</span></span>
                <span className="text-right text-sm"><span className="tabular-nums">${d.amount}</span><br /><span className="text-neutral-500">{nice(d.stage)} · {nice(d.status)}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
