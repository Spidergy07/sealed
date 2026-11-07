// Tiny key/value store: Supabase (PostgREST over fetch) when configured, else a JSON file for local dev.
// Supabase tables, both `id text primary key, data jsonb not null, created_at timestamptz default now()`: sales, events.
import { promises as fs } from "node:fs";
import path from "node:path";

type Table = "sales" | "events";
const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(method: string, q: string, body?: unknown) {
  const r = await fetch(`${SB}/rest/v1/${q}`, {
    method,
    headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${await r.text()}`);
  return method === "GET" ? r.json() : null;
}

// shortcut: file store is lost on Vercel (read-only fs), set the Supabase env vars before deploying.
const FILE = path.join(process.cwd(), ".data", "db.json");
async function readFile(): Promise<Record<Table, Record<string, any>>> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return { sales: {}, events: {} }; }
}

export async function put(table: Table, id: string, data: any) {
  if (SB && SB_KEY) return void (await sb("POST", table, { id, data }));
  const db = await readFile();
  db[table][id] = { ...data, _at: db[table][id]?._at ?? new Date().toISOString() };
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2));
}

export async function get<T = any>(table: Table, id: string): Promise<T | undefined> {
  if (SB && SB_KEY) return (await sb("GET", `${table}?id=eq.${encodeURIComponent(id)}&select=data`))[0]?.data;
  return (await readFile())[table][id];
}

export async function recent<T = any>(table: Table, limit = 20): Promise<T[]> {
  if (SB && SB_KEY) return (await sb("GET", `${table}?select=data&order=created_at.desc&limit=${limit}`)).map((r: any) => r.data);
  return Object.values((await readFile())[table]).sort((a: any, b: any) => (b._at > a._at ? 1 : -1)).slice(0, limit);
}
