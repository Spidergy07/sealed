import { recent } from "@/lib/store";

// Daily Vercel cron: one read keeps the free Supabase project from pausing during judging (it pauses after 7 idle days).
export async function GET() {
  await recent("sales", 1);
  return Response.json({ ok: true });
}
