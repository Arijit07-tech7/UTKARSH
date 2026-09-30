import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createAuthToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();

    const digits = String(body?.phone || "").replace(/\D/g, "");
    const password = String(body?.password || "");

    // Validate input
    if (digits.length !== 10 || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter mobile number and password.",
        },
        { status: 400 }
      );
    }

    const phoneE164 = `+91${digits}`;

    // Find active admin
    const { data: admin, error } = await supabaseAdmin
      .from("admins")
      .select(
        "id, name, phone_e164, password_hash, active"
      )
      .eq("phone_e164", phoneE164)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("ADMIN SUPABASE ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message:
            "Database error while checking admin account.",
        },
        { status: 500 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin account not found.",
        },
        { status: 401 }
      );
    }

    // Check password hash
    if (!admin.password_hash) {
      console.error(
        "ADMIN PASSWORD HASH MISSING:",
        admin.id
      );

      return NextResponse.json(
        {
          success: false,
          message: "Admin account is not configured correctly.",
        },
        { status: 500 }
      );
    }

    const valid = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid admin credentials.",
        },
        { status: 401 }
      );
    }

    // Create authentication token
    let token;

    try {
      token = await createAuthToken({
        sub: admin.id,
        id: admin.id,
        role: "admin",
        name: admin.name,
        phone: admin.phone_e164,
      });
    } catch (tokenError) {
      console.error(
        "ADMIN TOKEN ERROR:",
        tokenError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Unable to create admin session.",
        },
        { status: 500 }
      );
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Admin login successful.",
      admin: {
        id: admin.id,
        name: admin.name,
        phone: admin.phone_e164,
      },
    });

    // Set secure session cookie
    response.cookies.set(
      "utkarsh_session",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return response;

  } catch (error) {
    console.error(
      "ADMIN LOGIN ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error.",
      },
      { status: 500 }
    );
  }
}