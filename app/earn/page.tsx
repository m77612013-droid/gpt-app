/**
 * /earn — alias for /offers
 * Redirects to the full offers page to support both URL patterns.
 */
import { redirect } from "next/navigation";

export default function EarnPage() {
  redirect("/offers");
}
