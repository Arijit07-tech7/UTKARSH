import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/");
  return children;
}
