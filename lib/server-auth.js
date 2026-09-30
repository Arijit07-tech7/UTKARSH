import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";

export async function getSession() {
  const store = await cookies();
  const token = store.get("utkarsh_session")?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function requireSession(role) {
  const session = await getSession();
  if (!session) return { ok: false, status: 401, session: null };
  if (role && session.role !== role) return { ok: false, status: 403, session };
  return { ok: true, status: 200, session };
}
