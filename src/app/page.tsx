import { redirect } from "next/navigation";

// Root — redirect to public home
export default function RootPage() {
  redirect("/home");
}
