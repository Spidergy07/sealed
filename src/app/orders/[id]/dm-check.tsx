"use client";
import { useState, useTransition } from "react";
import { checkDm, type DmResult } from "@/app/actions";
import { FlagCard } from "./flag-card";

export function DmCheck({ orderId, sample }: { orderId: string; sample: string }) {
  const [text, setText] = useState("");
  const [res, setRes] = useState<DmResult>();
  const [pending, start] = useTransition();

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Check the buyer&apos;s messages</h2>
      <label className="block space-y-1">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Paste the chat from Reddit, Discord or Marketplace</span>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm" />
      </label>
      <div className="flex gap-3">
        <button disabled={pending} onClick={() => start(async () => setRes(await checkDm(orderId, text)))} className="rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 font-medium disabled:opacity-50">
          {pending ? "Reading…" : "Check messages"}
        </button>
        <button type="button" onClick={() => setText(sample)} className="text-sm underline">Use sample chat</button>
      </div>
      <div aria-live="polite" className="space-y-3">
        {res && "error" in res && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{res.error}</p>}
        {res && "flags" in res && (
          <>
            {res.flags.length === 0 && <p className="text-sm">Nothing in these messages affects Seller Protection.</p>}
            {res.flags.map(f => <FlagCard key={f.rule.id} flag={f} />)}
            {res.facts.quotes.length > 0 && (
              <details className="text-sm"><summary>Buyer quotes the check used</summary>
                <ul className="list-disc pl-5">{res.facts.quotes.map((q, i) => <li key={i}>{q}</li>)}</ul>
              </details>
            )}
            <p className="text-xs text-neutral-500">Read by {res.provider}/{res.model}. Rules are fixed text, the model only extracts facts.</p>
          </>
        )}
      </div>
    </section>
  );
}
