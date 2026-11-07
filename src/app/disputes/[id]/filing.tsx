"use client";
import { useState, useTransition } from "react";
import { draftEvidence, fileWithPayPal, type FileResult } from "./actions";
import type { Filing as Filed } from "@/lib/disputes";

const btn = "w-full rounded-lg px-4 py-3 font-medium disabled:opacity-50";

export function Filing({ id, filed, canFile, path, initialNotes, initialBy, fallbackNotes }: {
  id: string; filed?: Filed; canFile: boolean; path: string; initialNotes: string; initialBy?: string; fallbackNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [by, setBy] = useState(initialBy);
  const [approved, setApproved] = useState(false);
  const [res, setRes] = useState<FileResult>();
  const [err, setErr] = useState<string>();
  const [pending, start] = useTransition();

  if (filed) return (
    <section className={`rounded-xl border p-4 space-y-2 ${filed.ok ? "border-green-700" : "border-red-400"}`}>
      <p className="font-medium">{filed.ok ? "Evidence filed with PayPal" : "PayPal refused the filing"}</p>
      <p className="text-sm">{filed.at.slice(0, 19).replace("T", " ")} UTC via {filed.path}, HTTP {filed.http}, debug_id <span className="font-mono text-xs">{filed.debugId}</span></p>
      <p className="text-sm whitespace-pre-wrap rounded-md bg-neutral-100 dark:bg-neutral-900 p-3">{filed.notes}</p>
      <a href={`/disputes/${id}/evidence.pdf`} target="_blank" rel="noreferrer" className="text-sm underline">Open the PDF PayPal received ({filed.pdfName})</a>
    </section>
  );

  if (res && "ok" in res) return (
    <section className={`rounded-xl border p-4 space-y-1 ${res.ok ? "border-green-700" : "border-red-400"}`} role="status">
      <p className="font-medium">{res.ok ? "Evidence filed with PayPal" : "PayPal refused the filing"}</p>
      <p className="text-sm">{res.path}, HTTP {res.http}, debug_id <span className="font-mono text-xs">{res.debugId}</span>. Case is now {res.stage.toLowerCase()} · {res.status.replaceAll("_", " ").toLowerCase()}.</p>
      {res.error && <p className="text-sm text-red-700 dark:text-red-400">{res.error}</p>}
      <a href={`/disputes/${id}`} className="text-sm underline">Refresh the case</a>
    </section>
  );

  const draft = () => start(async () => { setErr(undefined); const r = await draftEvidence(id); if ("error" in r) { setErr(r.error); setNotes(fallbackNotes); setBy("template"); } else { setNotes(r.notes); setBy(r.by); } });

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Evidence pack</h2>
      {!notes ? (
        <button disabled={pending} className={`${btn} bg-neutral-900 text-white dark:bg-white dark:text-neutral-900`}
          onClick={draft}>
          {pending ? "Writing the reviewer notes…" : "Draft the evidence pack"}
        </button>
      ) : (
        <>
          <label className="block space-y-1">
            <span className="text-sm">Notes PayPal&apos;s reviewer reads first ({notes.length}/2,000)</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={8} maxLength={2000}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent p-3 text-sm" />
          </label>
          <p className="text-xs text-neutral-500">Worded by {by}. Facts, timeline and PDF are built by code from PayPal&apos;s records. <button disabled={pending} onClick={draft} className="underline">{pending ? "Redrafting…" : "Redraft"}</button></p>
          <a href={`/disputes/${id}/evidence.pdf`} target="_blank" rel="noreferrer" className="block text-sm underline">Preview the one-page PDF</a>
          {canFile ? (
            <>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="mt-1" />
                I read the notes and the PDF. File them with PayPal ({path}).
              </label>
              <button disabled={pending || !approved} className={`${btn} bg-neutral-900 text-white dark:bg-white dark:text-neutral-900`}
                onClick={() => start(async () => { setErr(undefined); const r = await fileWithPayPal(id, notes, approved); if ("error" in r && !("ok" in r)) setErr(r.error); else setRes(r); })}>
                {pending ? "Filing…" : "File with PayPal"}
              </button>
            </>
          ) : <p className="text-sm">PayPal offers no evidence action on this case right now.</p>}
        </>
      )}
      {err && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{err}</p>}
    </section>
  );
}
