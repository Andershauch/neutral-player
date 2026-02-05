import { redirect } from "next/navigation";

export default function Home() {
  // Send brugeren direkte til admin login
  redirect("/admin/login");
}