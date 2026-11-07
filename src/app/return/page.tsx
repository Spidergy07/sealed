import { redirect } from "next/navigation";

// PayPal sends the buyer back here with ?token=<order id>.
export default async function Return({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  redirect(token && /^[A-Z0-9]+$/.test(token) ? `/orders/${token}` : "/");
}
