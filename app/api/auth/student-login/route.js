import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createAuthToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const digits = String(body?.phone || "").replace(/\D/g, "");
    if (digits.length !== 10) return NextResponse.json({ success: false, message: "Enter a valid 10-digit mobile number." }, { status: 400 });

    const phoneE164 = `+91${digits}`;
    const { data: student, error } = await supabaseAdmin
      .from("approved_students")
      .select("id, name, roll_no, section, phone_e164")
      .eq("phone_e164", phoneE164)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("Student login error:", error);
      return NextResponse.json({ success: false, message: "Server error. Please try again." }, { status: 500 });
    }
    if (!student) return NextResponse.json({ success: false, message: "This mobile number is not registered." }, { status: 401 });

    const token = await createAuthToken({ sub: student.id, id: student.id, role: "student", name: student.name, phone: student.phone_e164, rollNo: student.roll_no, section: student.section });
    const response = NextResponse.json({ success: true, message: "Login successful.", student: { id: student.id, name: student.name, rollNo: student.roll_no, section: student.section } });
    response.cookies.set("utkarsh_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    console.error("STUDENT LOGIN ROUTE ERROR:", error);
    return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
  }
}
