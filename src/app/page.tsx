import Link from "next/link";
import { createSale } from "./actions";
import { recent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sales = await recent("sales", 10);
  return (
    <main className="mx-auto max-w-xl px-4 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Sealed</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Check the box before you tape it. Sealed compares your shipping label and your buyer&apos;s messages with the
          PayPal order, so a used-gear sale stays eligible for Seller Protection.
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400">PayPal sandbox. No real money moves.</p>
      </header>

      <form action={createSale} className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
        <h2 className="font-medium">New sale</h2>
        <label className="block space-y-1">
          <span className="text-sm">Item</span>
          <input name="title" required defaultValue="Used RTX 4080 Founders Edition" className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-sm">Price (USD)</span>
            <input name="price" type="number" min="1" max="10000" step="0.01" required defaultValue="780" className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm">Serial number</span>
            <input name="serial" defaultValue="GPU-4080FE-2291" className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2" />
          </label>
        </div>
        <button className="w-full rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2.5 font-medium">
          Create PayPal checkout link
        </button>
      </form>

      {sales.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-medium">Recent sales</h2>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {sales.map((s: any) => (
              <li key={s.id}>
                <Link href={`/orders/${s.id}`} className="flex justify-between py-2.5 hover:underline">
                  <span>{s.title}</span>
                  <span className="tabular-nums text-neutral-500">${s.price}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
