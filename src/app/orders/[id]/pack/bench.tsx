"use client";
import { useState, useTransition } from "react";
import { checkLabel, pushTracking, reprintToPayPalAddress, type LabelResult, type ReprintResult, type TrackResult } from "./actions";
import { FlagCard } from "../flag-card";
import type { Carrier } from "@/lib/label";

// EasyPost test labels print VOID and all-zero tracking, so the samples carry their real test tracking codes.
const SAMPLES = [
  { file: "/samples/label-wrong-address.png", label: "Label to the buyer's new address", tracking: "9405500208192110884478" },
  { file: "/samples/label-right-address.png", label: "Label to the PayPal address", tracking: "9405500208192110884461" },
];

async function sha256(buf: ArrayBuffer) {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function toJpegDataUrl(blob: Blob) {
  const img = await createImageBitmap(blob);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

async function decodeBarcode(url: string) {
  try {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    return (await new BrowserMultiFormatReader().decodeFromImageUrl(url)).getText();
  } catch {
    return null; // no readable barcode (VOID test labels, glare): the model's reading and check digit decide
  }
}

const btn = "w-full rounded-lg px-4 py-3 font-medium disabled:opacity-50";
const primary = `${btn} bg-neutral-900 text-white dark:bg-white dark:text-neutral-900`;
const secondary = `${btn} border border-neutral-300 dark:border-neutral-700`;

export function PackBench({ orderId, amount, paid }: { orderId: string; amount: string; paid: boolean }) {
  const [preview, setPreview] = useState<string>();
  const [hash, setHash] = useState<string>();
  const [res, setRes] = useState<LabelResult>();
  const [reprint, setReprint] = useState<ReprintResult>();
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState<Carrier>("USPS");
  const [track, setTrack] = useState<TrackResult>();
  const [pending, start] = useTransition();
  const [step, setStep] = useState("");

  function run(blob: Blob, sampleTracking?: string) {
    setRes(undefined); setReprint(undefined); setTrack(undefined);
    start(async () => {
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setStep("Hashing the photo and looking for a barcode…");
      const [h, barcode, dataUrl] = await Promise.all([sha256(await blob.arrayBuffer()), decodeBarcode(url), toJpegDataUrl(blob)]);
      setHash(h);
      setStep("Reading the label…");
      const r = await checkLabel(orderId, dataUrl, h, barcode);
      setRes(r);
      if ("tracking" in r) {
        const t = r.tracking ?? (sampleTracking ? { number: sampleTracking, carrier: "USPS" as Carrier } : null);
        setTracking(t?.number ?? "");
        if (t) setCarrier(t.carrier);
      }
      setStep("");
    });
  }

  async function loadSample(s: (typeof SAMPLES)[number]) {
    run(await (await fetch(s.file)).blob(), s.tracking);
  }

  const read = res && "read" in res ? res : undefined;
  const blocked = read && read.flags.some(f => f.rule.severity === "block");
  const matched = read && read.compare.match;
  const canTrack = matched || (reprint && "trackingCode" in reprint);

  if (!paid) return <p role="alert" className="rounded-xl border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-4">Payment is not COMPLETED on PayPal. Do not pack yet.</p>;

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <label className={`${primary} block text-center cursor-pointer`}>
          Photograph the shipping label
          <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={pending}
            onChange={e => { const f = e.target.files?.[0]; if (f) run(f); e.target.value = ""; }} />
        </label>
        <details className="text-sm">
          <summary className="cursor-pointer text-neutral-600 dark:text-neutral-400">No label handy? Use an EasyPost test label</summary>
          <div className="mt-2 grid gap-2">
            {SAMPLES.map(s => <button key={s.file} disabled={pending} onClick={() => loadSample(s)} className={secondary}>{s.label}</button>)}
          </div>
        </details>
      </section>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Label photo" className="max-h-64 mx-auto rounded-lg border border-neutral-200 dark:border-neutral-800" />
      )}
      <p aria-live="polite" className="text-sm text-neutral-600 dark:text-neutral-400">{step}</p>

      {res && "error" in res && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{res.error}</p>}

      {read && (
        <section className="space-y-3">
          {blocked ? (
            <div className="rounded-xl bg-red-600 text-white p-4 space-y-1">
              <p className="text-lg font-semibold">Stop. Don&apos;t tape this box.</p>
              <p>Shipped with this label, the ${read.amount ?? amount} sale is not eligible for PayPal Seller Protection.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-green-700 text-white p-4">
              <p className="text-lg font-semibold">Label matches the PayPal ship-to.</p>
            </div>
          )}
          {read.read.zip && (
            <p className="text-sm">Label reads: {read.read.name}, {read.read.street1}{read.read.street2 ? ` ${read.read.street2}` : ""}, {read.read.city} {read.read.state} <strong className="tabular-nums">{read.read.zip}</strong></p>
          )}
          {blocked && read.read.zip && !reprint && (
            <div className="grid gap-2">
              <button disabled={pending} className={primary}
                onClick={() => start(async () => { const r = await reprintToPayPalAddress(orderId); setReprint(r); if ("trackingCode" in r) { setTracking(r.trackingCode); setCarrier("USPS"); } })}>
                Reprint to the address PayPal has on file
              </button>
              <details className={`${secondary} text-left`}>
                <summary className="cursor-pointer">Buyer insists: refund and re-bill</summary>
                <p className="mt-2 text-sm font-normal">Refund this payment, then send a new PayPal checkout so the buyer pays with the new address on file. This is the fix PayPal suggests in the quote below.</p>
              </details>
            </div>
          )}
          {read.flags.map(f => <FlagCard key={f.rule.id} flag={f} />)}
          <p className="text-xs text-neutral-500">Read by {read.by}. The address comparison is plain code, not the model.</p>
        </section>
      )}

      {reprint && "error" in reprint && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{reprint.error}</p>}
      {reprint && "trackingCode" in reprint && (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
          <p className="font-medium">New label to ZIP {reprint.toZip} ({reprint.service}, EasyPost test mode)</p>
          <a href={reprint.labelUrl} target="_blank" rel="noreferrer" className="underline text-sm">Open label to print</a>
        </section>
      )}

      {canTrack && !(track && "ok" in track && track.ok) && (
        <section className="space-y-3">
          <h2 className="font-medium">Put tracking on the PayPal order</h2>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <label className="block"><span className="sr-only">Tracking number</span>
              <input value={tracking} onChange={e => setTracking(e.target.value)} inputMode="text" placeholder="Tracking number"
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-3 font-mono text-sm" />
            </label>
            <label className="block"><span className="sr-only">Carrier</span>
              <select value={carrier} onChange={e => setCarrier(e.target.value as Carrier)} className="h-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2">
                {["USPS", "UPS", "FEDEX", "DHL"].map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <button disabled={pending || !tracking} className={primary} onClick={() => start(async () => setTrack(await pushTracking(orderId, tracking, carrier)))}>
            Add tracking to PayPal
          </button>
          {track && "error" in track && track.error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{track.error}</p>}
        </section>
      )}

      {track && "ok" in track && track.ok && (
        <section className="rounded-xl border border-green-700 p-4 space-y-3">
          <p className="font-medium">PayPal now shows tracking on this payment</p>
          <ul className="text-sm space-y-1">
            {track.onPayPal.map(t => <li key={t.number} className="font-mono">{t.carrier} {t.number} · {t.status}</li>)}
          </ul>
          <p className="text-xs text-neutral-500">Pushed with Orders v2 /track (debug_id {track.pushDebugId}), read back from PayPal&apos;s tracker list (debug_id {track.readBackDebugId}).</p>
          <ul className="text-sm space-y-1">
            <li>✓ Payment COMPLETED on PayPal</li>
            <li>✓ Label goes to the Transaction Details address</li>
            <li>✓ Tracking is on the PayPal transaction</li>
            <li>✓ Packing photo recorded <span className="font-mono text-xs break-all">sha256 {hash?.slice(0, 16)}…</span></li>
          </ul>
        </section>
      )}
    </div>
  );
}
