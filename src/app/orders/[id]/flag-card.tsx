import type { Flag } from "@/lib/rules";

const tone = {
  block: { box: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40", tag: "Not eligible" },
  warn: { box: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40", tag: "PayPal recommends against" },
  info: { box: "border-neutral-200 dark:border-neutral-800", tag: "Check" },
};

export function FlagCard({ flag: { rule, detail } }: { flag: Flag }) {
  const t = tone[rule.severity];
  return (
    <article className={`rounded-xl border p-4 space-y-2 ${t.box}`}>
      <p className="text-xs font-medium uppercase tracking-wide">{t.tag}</p>
      <h3 className="font-medium">{rule.title}</h3>
      <p className="text-sm">{detail}</p>
      <blockquote className="border-l-2 border-current/30 pl-3 text-sm italic text-neutral-700 dark:text-neutral-300">&ldquo;{rule.quote}&rdquo;</blockquote>
      <a href={rule.url} className="text-xs underline" target="_blank" rel="noreferrer">Source, version {rule.version}</a>
    </article>
  );
}
