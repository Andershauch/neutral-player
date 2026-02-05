import { redirect } from "next/navigation";

export default function Home() {
  // Sender brugeren direkte til login-siden (Server Side Redirect)
  redirect("/admin/login");
}