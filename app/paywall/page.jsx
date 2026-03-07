// Temporary redirect — paywall disabled (B2C2B model, March 2026)
// TODO: Replace with subscription paywall when ready
import { redirect } from "next/navigation";
export default function PaywallPage() {
  redirect("/onboarding");
}
