import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireSession } from "@/lib/server-auth";

const GROUPS = ["CX", "CY"];

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function fail(message, status = 500) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: [],
    },
    { status }
  );
}

async function requireAdmin() {
  const auth = await requireSession("admin");

  if (!auth.ok) {
    return {
      ok: false,
      response: fail(
        "Admin access required.",
        auth.status || 403
      ),
    };
  }

  return {
    ok: true,
    auth,
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const view =
      clean(url.searchParams.get("view")) || "student";

    const group = clean(
      url.searchParams.get("group")
    ).toUpperCase();

    const subjectId = clean(
      url.searchParams.get("subject_id")
    );

    /*
      STUDENT VIEW

      All signed-in students can view assignments
      from both CX and CY.

      There is NO group_code lookup and
      NO group-based access restriction.
    */
    if (view === "student") {
      const auth = await requireSession();

      if (!auth.ok) {
        return fail(
          "Please sign in to view assignments.",
          auth.status || 401
        );
      }

      const { data, error } = await supabaseAdmin
        .from("assignments")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(500);

      if (error) {
        console.error(
          "GET STUDENT ASSIGNMENTS:",
          error
        );

        return fail(error.message, 500);
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    /*
      ADMIN SUBJECT LIST
    */
    if (view === "subjects") {
      const admin = await requireAdmin();

      if (!admin.ok) {
        return admin.response;
      }

      const { data, error } = await supabaseAdmin
        .from("subjects")
        .select(
          "id, subject_code, subject_name, created_by, created_at"
        )
        .order("subject_code", {
          ascending: true,
        })
        .limit(300);

      if (error) {
        console.error(
          "GET ASSIGNMENT SUBJECTS:",
          error
        );

        return fail(error.message, 500);
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    /*
      ADMIN ASSIGNMENT LIST

      Without a group filter -> return all assignments.
      With group -> only CX or CY assignments.
      With subject_id -> only that subject's assignments.
    */
    if (view === "admin") {
      const admin = await requireAdmin();

      if (!admin.ok) {
        return admin.response;
      }

      if (group && !GROUPS.includes(group)) {
        return fail(
          "Group must be CX or CY.",
          400
        );
      }

      let query = supabaseAdmin
        .from("assignments")
        .select("*")
        .order("created_at", {
          ascending: false,
        })
        .limit(500);

      if (group) {
        query = query.eq("section", group);
      }

      if (subjectId) {
        query = query.eq(
          "subject_id",
          subjectId
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "GET ADMIN ASSIGNMENTS:",
          error
        );

        return fail(error.message, 500);
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    return fail(
      "Invalid assignments view.",
      400
    );
  } catch (error) {
    console.error(
      "GET /api/assignments:",
      error
    );

    return fail(
      error?.message ||
        "Could not load assignments.",
      500
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(request) {
  try {
    const admin = await requireAdmin();

    if (!admin.ok) {
      return admin.response;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return fail(
        "Invalid JSON request.",
        400
      );
    }

    const action = clean(body?.action);

    /*
      CREATE SUBJECT
    */
    if (action === "create-subject") {
      const subjectCode = clean(
        body?.subject_code
      );

      const subjectName = clean(
        body?.subject_name
      );

      if (!subjectCode || !subjectName) {
        return fail(
          "Subject code and name are required.",
          400
        );
      }

      const { data, error } =
        await supabaseAdmin
          .from("subjects")
          .insert({
            subject_code: subjectCode,
            subject_name: subjectName,
          })
          .select(
            "id, subject_code, subject_name, created_by, created_at"
          )
          .single();

      if (error) {
        console.error(
          "CREATE ASSIGNMENT SUBJECT:",
          error
        );

        return fail(
          error.message,
          400
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Subject folder created.",
          data,
        },
        {
          status: 201,
        }
      );
    }

    /*
      CREATE ASSIGNMENT

      Assignment belongs to:
      - one subject
      - one group (CX or CY)
    */
    if (action === "create-assignment") {
      const title = clean(body?.title);

      const subjectId = clean(
        body?.subject_id
      );

      const section = clean(
        body?.section || body?.group
      ).toUpperCase();

      const dueDate = clean(
        body?.due_date
      );

      const instructions = clean(
        body?.instructions
      );

      if (!title) {
        return fail(
          "Assignment title is required.",
          400
        );
      }

      if (!subjectId) {
        return fail(
          "Select a subject.",
          400
        );
      }

      if (!GROUPS.includes(section)) {
        return fail(
          "Select CX or CY.",
          400
        );
      }

      if (!dueDate) {
        return fail(
          "Deadline is required.",
          400
        );
      }

      if (!instructions) {
        return fail(
          "Instructions are required.",
          400
        );
      }

      /*
        Validate selected subject
        before inserting the assignment.
      */
      const {
        data: subject,
        error: subjectError,
      } = await supabaseAdmin
        .from("subjects")
        .select(
          "id, subject_code, subject_name"
        )
        .eq("id", subjectId)
        .maybeSingle();

      if (subjectError) {
        console.error(
          "FIND ASSIGNMENT SUBJECT:",
          subjectError
        );

        return fail(
          subjectError.message,
          500
        );
      }

      if (!subject) {
        return fail(
          "Selected subject was not found.",
          404
        );
      }

      /*
        assignments.due_date is a DATE column.

        Accept:
        YYYY-MM-DD
        or
        YYYY-MM-DDTHH:mm

        Store only:
        YYYY-MM-DD
      */
      const dateOnly = dueDate.slice(0, 10);

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          dateOnly
        )
      ) {
        return fail(
          "Enter a valid deadline date.",
          400
        );
      }

      const record = {
        title,
        subject: subject.subject_name,
        subject_code:
          subject.subject_code,
        subject_id: subject.id,
        due_date: dateOnly,
        instructions,
        section,
        status:
          clean(body?.status) ||
          "published",
      };

      const { data, error } =
        await supabaseAdmin
          .from("assignments")
          .insert(record)
          .select("*")
          .single();

      if (error) {
        console.error(
          "SAVE ASSIGNMENT:",
          error
        );

        return fail(
          error.message,
          400
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Assignment saved and published.",
          data,
        },
        {
          status: 201,
        }
      );
    }

    return fail(
      "Invalid assignment action.",
      400
    );
  } catch (error) {
    console.error(
      "POST /api/assignments:",
      error
    );

    return fail(
      error?.message ||
        "Could not save assignment.",
      500
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(request) {
  try {
    const admin = await requireAdmin();

    if (!admin.ok) {
      return admin.response;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return fail(
        "Invalid JSON request.",
        400
      );
    }

    const id = clean(body?.id);

    if (!id) {
      return fail(
        "Assignment ID is required.",
        400
      );
    }

    const { error } =
      await supabaseAdmin
        .from("assignments")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "DELETE ASSIGNMENT:",
        error
      );

      return fail(
        error.message,
        400
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assignment deleted.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/assignments:",
      error
    );

    return fail(
      error?.message ||
        "Could not delete assignment.",
      500
    );
  }
}