import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
export default async function StudentLayout({ children }) {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/");
  return children;
}
