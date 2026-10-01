import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireSession } from "@/lib/server-auth";

export const runtime = "nodejs";

const BUCKET = "pyq";
const MAX_PDF_SIZE = 20 * 1024 * 1024;
const SIGNED_URL_TTL = 60 * 15;

/* =========================================================
   COMMON HELPERS
========================================================= */

function cleanValue(value) {
  if (value === undefined || value === null) return null;

  const valueString = String(value).trim();
  return valueString === "" ? null : valueString;
}

function normalizeSubjectCode(value) {
  return cleanValue(value)?.toUpperCase() || null;
}

function normalizeYear(value) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return null;
  }

  return year;
}

function normalizeSerial(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const serial = Number(value);

  if (!Number.isInteger(serial) || serial < 1) {
    return null;
  }

  return serial;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function sanitizeFileName(name) {
  const original = cleanValue(name) || "question-paper.pdf";

  const safe = original
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);

  return safe || "question-paper.pdf";
}

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function requireAdmin() {
  const auth = await requireSession("admin");

  if (!auth.ok) {
    return {
      ok: false,
      response: json(
        {
          success: false,
          message: "Admin access required.",
        },
        auth.status || 403
      ),
    };
  }

  return {
    ok: true,
    session: auth.session,
  };
}

async function ensureBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);

  if (error || !data) {
    return {
      ok: false,
      message:
        error?.message ||
        `Supabase Storage bucket "${BUCKET}" is not available.`,
    };
  }

  return { ok: true };
}

async function createSignedUrl(filePath) {
  if (!filePath) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL);

  if (error) {
    console.error("PYQ SIGNED URL ERROR:", error.message);
    return null;
  }

  return data?.signedUrl || null;
}

async function removeStoragePaths(paths) {
  const cleanPaths = [...new Set((paths || []).filter(Boolean))];

  if (!cleanPaths.length) {
    return { ok: true };
  }

  for (let index = 0; index < cleanPaths.length; index += 100) {
    const chunk = cleanPaths.slice(index, index + 100);

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove(chunk);

    if (error) {
      console.error("PYQ STORAGE DELETE ERROR:", error.message);

      return {
        ok: false,
        message: error.message,
      };
    }
  }

  return { ok: true };
}

/* =========================================================
   GET HELPERS
========================================================= */

async function getSubjects() {
  const { data, error } = await supabaseAdmin
    .from("pyq_subjects")
    .select("id, subject_name, subject_code, created_at")
    .order("subject_code", { ascending: true })
    .order("subject_name", { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function getYears(subjectId) {
  if (!isUuid(subjectId)) {
    throw new Error("A valid subject_id is required.");
  }

  const { data, error } = await supabaseAdmin
    .from("pyq_years")
    .select("id, subject_id, year, created_at")
    .eq("subject_id", subjectId)
    .order("year", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function getPapers(yearId) {
  if (!isUuid(yearId)) {
    throw new Error("A valid year_id is required.");
  }

  const { data, error } = await supabaseAdmin
    .from("pyq_papers")
    .select(
      "id, year_id, title, serial_no, file_path, file_name, file_size, created_at"
    )
    .eq("year_id", yearId)
    .order("serial_no", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const papers = data || [];

  const signedPapers = await Promise.all(
    papers.map(async (paper) => ({
      ...paper,
      pdf_url: await createSignedUrl(paper.file_path),
    }))
  );

  return signedPapers;
}

/* =========================================================
   GET

   /api/pyq?view=subjects

   /api/pyq?view=years&subject_id=<uuid>

   /api/pyq?view=papers&year_id=<uuid>
========================================================= */

export async function GET(request) {
  try {
    const auth = await requireSession();

    if (!auth.ok) {
      return json(
        {
          success: false,
          message: "Unauthorized.",
        },
        auth.status || 401
      );
    }

    const url = new URL(request.url);
    const view = url.searchParams.get("view") || "subjects";

    if (view === "subjects") {
      return json({
        success: true,
        data: await getSubjects(),
      });
    }

    if (view === "years") {
      return json({
        success: true,
        data: await getYears(
          url.searchParams.get("subject_id")
        ),
      });
    }

    if (view === "papers") {
      return json({
        success: true,
        data: await getPapers(
          url.searchParams.get("year_id")
        ),
      });
    }

    return json(
      {
        success: false,
        message: "Invalid PYQ view.",
      },
      400
    );
  } catch (error) {
    console.error("GET /api/pyq ERROR:", error);

    return json(
      {
        success: false,
        message:
          error?.message || "Could not load PYQ data.",
      },
      500
    );
  }
}

/* =========================================================
   POST

   JSON:

   {
     action: "create-subject",
     subject_name,
     subject_code
   }

   {
     action: "create-year",
     subject_id,
     year
   }

   multipart/form-data:

   action=upload-paper
   year_id=<uuid>
   title=<text>
   serial_no=<number optional>
   pdf=<PDF>
========================================================= */

export async function POST(request) {
  try {
    const admin = await requireAdmin();

    if (!admin.ok) {
      return admin.response;
    }

    const contentType =
      request.headers.get("content-type") || "";

    /* =======================================================
       MULTIPART: UPLOAD QUESTION PAPER
    ======================================================= */

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      const action = cleanValue(
        formData.get("action")
      );

      if (action !== "upload-paper") {
        return json(
          {
            success: false,
            message: "Invalid multipart action.",
          },
          400
        );
      }

      const yearId = cleanValue(
        formData.get("year_id")
      );

      const title = cleanValue(
        formData.get("title")
      );

      const requestedSerial = normalizeSerial(
        formData.get("serial_no")
      );

      const pdf = formData.get("pdf");

      /* -----------------------------------------------------
         BASIC VALIDATION
      ----------------------------------------------------- */

      if (!isUuid(yearId)) {
        return json(
          {
            success: false,
            message: "A valid year_id is required.",
          },
          400
        );
      }

      if (!title) {
        return json(
          {
            success: false,
            message: "Question paper title is required.",
          },
          400
        );
      }

      if (
        formData.has("serial_no") &&
        formData.get("serial_no") !== "" &&
        !requestedSerial
      ) {
        return json(
          {
            success: false,
            message:
              "Serial number must be a positive integer.",
          },
          400
        );
      }

      if (!(pdf instanceof File)) {
        return json(
          {
            success: false,
            message:
              "Please select a PDF question paper.",
          },
          400
        );
      }

      if (pdf.type !== "application/pdf") {
        return json(
          {
            success: false,
            message:
              "Only PDF files are allowed.",
          },
          400
        );
      }

      if (pdf.size <= 0) {
        return json(
          {
            success: false,
            message:
              "The selected PDF is empty.",
          },
          400
        );
      }

      if (pdf.size > MAX_PDF_SIZE) {
        return json(
          {
            success: false,
            message:
              "PDF size must be less than 20 MB.",
          },
          400
        );
      }

      /* -----------------------------------------------------
         CHECK BUCKET
      ----------------------------------------------------- */

      const bucketCheck =
        await ensureBucket();

      if (!bucketCheck.ok) {
        return json(
          {
            success: false,
            message: bucketCheck.message,
          },
          500
        );
      }

      /* -----------------------------------------------------
         FIND YEAR
      ----------------------------------------------------- */

      const {
        data: yearRow,
        error: yearError,
      } = await supabaseAdmin
        .from("pyq_years")
        .select(
          "id, subject_id, year"
        )
        .eq("id", yearId)
        .maybeSingle();

      if (yearError) {
        return json(
          {
            success: false,
            message: yearError.message,
          },
          400
        );
      }

      if (!yearRow) {
        return json(
          {
            success: false,
            message:
              "The selected year folder was not found.",
          },
          404
        );
      }

      /* -----------------------------------------------------
         SERIAL NUMBER
      ----------------------------------------------------- */

      let serialNo = requestedSerial;

      if (!serialNo) {
        const {
          data: latestPaper,
          error: latestError,
        } = await supabaseAdmin
          .from("pyq_papers")
          .select("serial_no")
          .eq("year_id", yearId)
          .order("serial_no", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (latestError) {
          return json(
            {
              success: false,
              message: latestError.message,
            },
            400
          );
        }

        serialNo =
          Number(
            latestPaper?.serial_no || 0
          ) + 1;
      }

      /* -----------------------------------------------------
         SERIAL CONFLICT
      ----------------------------------------------------- */

      const {
        data: serialConflict,
        error: serialError,
      } = await supabaseAdmin
        .from("pyq_papers")
        .select("id")
        .eq("year_id", yearId)
        .eq("serial_no", serialNo)
        .limit(1);

      if (serialError) {
        return json(
          {
            success: false,
            message: serialError.message,
          },
          400
        );
      }

      if (serialConflict?.length) {
        return json(
          {
            success: false,
            message:
              `Serial number ${serialNo} is already used in this year folder.`,
          },
          409
        );
      }

      /* -----------------------------------------------------
         PREPARE FILE
      ----------------------------------------------------- */

      const buffer = Buffer.from(
        await pdf.arrayBuffer()
      );

      const hash = crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex");

      const safeName =
        sanitizeFileName(pdf.name);

      const filePath =
        `pyq/${yearRow.subject_id}/${yearRow.year}/${crypto.randomUUID()}-${hash.slice(
          0,
          12
        )}-${safeName}`;

      /* -----------------------------------------------------
         UPLOAD PDF
      ----------------------------------------------------- */

      const {
        error: uploadError,
      } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(
          filePath,
          buffer,
          {
            contentType:
              "application/pdf",
            cacheControl: "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "PYQ PDF UPLOAD ERROR:",
          uploadError
        );

        return json(
          {
            success: false,
            message:
              uploadError.message ||
              "Could not upload question paper.",
          },
          500
        );
      }

      /* -----------------------------------------------------
         DATABASE INSERT
      ----------------------------------------------------- */

      const {
        data: paper,
        error: insertError,
      } = await supabaseAdmin
        .from("pyq_papers")
        .insert({
          year_id: yearId,
          title,
          serial_no: serialNo,
          file_path: filePath,
          file_name: pdf.name,
          file_size: pdf.size,
        })
        .select(
          "id, year_id, title, serial_no, file_path, file_name, file_size, created_at"
        )
        .single();

      /* -----------------------------------------------------
         ROLLBACK STORAGE IF DB INSERT FAILS
      ----------------------------------------------------- */

      if (insertError) {
        await removeStoragePaths([
          filePath,
        ]);

        return json(
          {
            success: false,
            message:
              insertError.message,
          },
          400
        );
      }

      return json({
        success: true,
        message:
          "Question paper uploaded successfully.",
        data: {
          ...paper,
          pdf_url:
            await createSignedUrl(
              filePath
            ),
        },
      });
    }

    /* =======================================================
       JSON ACTIONS
    ======================================================= */

    let body;

    try {
      body =
        await request.json();
    } catch {
      return json(
        {
          success: false,
          message:
            "Invalid JSON request.",
        },
        400
      );
    }

    const action =
      cleanValue(body?.action);

    /* =======================================================
       CREATE SUBJECT
    ======================================================= */

    if (action === "create-subject") {
      const subjectName =
        cleanValue(
          body?.subject_name
        );

      const subjectCode =
        normalizeSubjectCode(
          body?.subject_code
        );

      if (
        !subjectName ||
        !subjectCode
      ) {
        return json(
          {
            success: false,
            message:
              "Subject name and subject code are required.",
          },
          400
        );
      }

      const {
        data: existing,
        error: existingError,
      } = await supabaseAdmin
        .from("pyq_subjects")
        .select("id")
        .ilike(
          "subject_code",
          subjectCode
        )
        .limit(1);

      if (existingError) {
        return json(
          {
            success: false,
            message:
              existingError.message,
          },
          400
        );
      }

      if (existing?.length) {
        return json(
          {
            success: false,
            message:
              `PYQ subject code ${subjectCode} already exists.`,
          },
          409
        );
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("pyq_subjects")
        .insert({
          subject_name:
            subjectName,
          subject_code:
            subjectCode,
        })
        .select(
          "id, subject_name, subject_code, created_at"
        )
        .single();

      if (error) {
        return json(
          {
            success: false,
            message:
              error.message,
          },
          400
        );
      }

      return json({
        success: true,
        message:
          "PYQ subject folder created successfully.",
        data,
      });
    }

    /* =======================================================
       CREATE YEAR
    ======================================================= */

    if (action === "create-year") {
      const subjectId =
        cleanValue(
          body?.subject_id
        );

      const year =
        normalizeYear(
          body?.year
        );

      if (!isUuid(subjectId)) {
        return json(
          {
            success: false,
            message:
              "A valid subject_id is required.",
          },
          400
        );
      }

      if (!year) {
        return json(
          {
            success: false,
            message:
              "Enter a valid year between 1900 and 2100.",
          },
          400
        );
      }

      const {
        data: subject,
        error: subjectError,
      } = await supabaseAdmin
        .from("pyq_subjects")
        .select("id")
        .eq("id", subjectId)
        .maybeSingle();

      if (subjectError) {
        return json(
          {
            success: false,
            message:
              subjectError.message,
          },
          400
        );
      }

      if (!subject) {
        return json(
          {
            success: false,
            message:
              "The selected PYQ subject was not found.",
          },
          404
        );
      }

      const {
        data: existing,
        error: existingError,
      } = await supabaseAdmin
        .from("pyq_years")
        .select("id")
        .eq(
          "subject_id",
          subjectId
        )
        .eq(
          "year",
          year
        )
        .limit(1);

      if (existingError) {
        return json(
          {
            success: false,
            message:
              existingError.message,
          },
          400
        );
      }

      if (existing?.length) {
        return json(
          {
            success: false,
            message:
              `${year} already exists for this subject.`,
          },
          409
        );
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("pyq_years")
        .insert({
          subject_id:
            subjectId,
          year,
        })
        .select(
          "id, subject_id, year, created_at"
        )
        .single();

      if (error) {
        return json(
          {
            success: false,
            message:
              error.message,
          },
          400
        );
      }

      return json({
        success: true,
        message:
          "PYQ year folder created successfully.",
        data,
      });
    }

    return json(
      {
        success: false,
        message:
          "Invalid PYQ action.",
      },
      400
    );
  } catch (error) {
    console.error(
      "POST /api/pyq ERROR:",
      error
    );

    return json(
      {
        success: false,
        message:
          error?.message ||
          "Could not save PYQ data.",
      },
      500
    );
  }
}

/* =========================================================
   DELETE

   {
     action: "delete-subject",
     id
   }

   {
     action: "delete-year",
     id
   }

   {
     action: "delete-paper",
     id
   }
========================================================= */

export async function DELETE(request) {
  try {
    const admin =
      await requireAdmin();

    if (!admin.ok) {
      return admin.response;
    }

    let body;

    try {
      body =
        await request.json();
    } catch {
      return json(
        {
          success: false,
          message:
            "Invalid JSON request.",
        },
        400
      );
    }

    const action =
      cleanValue(
        body?.action
      );

    const id =
      cleanValue(
        body?.id
      );

    if (
      !id ||
      !isUuid(id)
    ) {
      return json(
        {
          success: false,
          message:
            "A valid id is required.",
        },
        400
      );
    }

    /* =======================================================
       DELETE PAPER
    ======================================================= */

    if (
      action ===
      "delete-paper"
    ) {
      const {
        data: paper,
        error: paperError,
      } = await supabaseAdmin
        .from("pyq_papers")
        .select(
          "id, file_path"
        )
        .eq(
          "id",
          id
        )
        .maybeSingle();

      if (paperError) {
        return json(
          {
            success: false,
            message:
              paperError.message,
          },
          400
        );
      }

      if (!paper) {
        return json(
          {
            success: false,
            message:
              "Question paper not found.",
          },
          404
        );
      }

      const storageResult =
        await removeStoragePaths([
          paper.file_path,
        ]);

      if (
        !storageResult.ok
      ) {
        return json(
          {
            success: false,
            message:
              storageResult.message,
          },
          500
        );
      }

      const { error } =
        await supabaseAdmin
          .from("pyq_papers")
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {
        return json(
          {
            success: false,
            message:
              error.message,
          },
          400
        );
      }

      return json({
        success: true,
        message:
          "Question paper deleted successfully.",
      });
    }

    /* =======================================================
       DELETE YEAR
    ======================================================= */

    if (
      action ===
      "delete-year"
    ) {
      const {
        data: yearRow,
        error: yearError,
      } = await supabaseAdmin
        .from("pyq_years")
        .select("id")
        .eq(
          "id",
          id
        )
        .maybeSingle();

      if (yearError) {
        return json(
          {
            success: false,
            message:
              yearError.message,
          },
          400
        );
      }

      if (!yearRow) {
        return json(
          {
            success: false,
            message:
              "PYQ year folder not found.",
          },
          404
        );
      }

      const {
        data: papers,
        error: papersError,
      } = await supabaseAdmin
        .from("pyq_papers")
        .select(
          "id, file_path"
        )
        .eq(
          "year_id",
          id
        );

      if (papersError) {
        return json(
          {
            success: false,
            message:
              papersError.message,
          },
          400
        );
      }

      const storageResult =
        await removeStoragePaths(
          (papers || [])
            .map(
              (paper) =>
                paper.file_path
            )
        );

      if (
        !storageResult.ok
      ) {
        return json(
          {
            success: false,
            message:
              storageResult.message,
          },
          500
        );
      }

      const { error } =
        await supabaseAdmin
          .from("pyq_years")
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {
        return json(
          {
            success: false,
            message:
              error.message,
          },
          400
        );
      }

      return json({
        success: true,
        message:
          "PYQ year folder deleted successfully.",
      });
    }

    /* =======================================================
       DELETE SUBJECT
    ======================================================= */

    if (
      action ===
      "delete-subject"
    ) {
      const {
        data: subjectRow,
        error: subjectError,
      } = await supabaseAdmin
        .from("pyq_subjects")
        .select("id")
        .eq(
          "id",
          id
        )
        .maybeSingle();

      if (subjectError) {
        return json(
          {
            success: false,
            message:
              subjectError.message,
          },
          400
        );
      }

      if (!subjectRow) {
        return json(
          {
            success: false,
            message:
              "PYQ subject folder not found.",
          },
          404
        );
      }

      const {
        data: years,
        error: yearsError,
      } = await supabaseAdmin
        .from("pyq_years")
        .select("id")
        .eq(
          "subject_id",
          id
        );

      if (yearsError) {
        return json(
          {
            success: false,
            message:
              yearsError.message,
          },
          400
        );
      }

      const yearIds =
        (years || [])
          .map(
            (year) =>
              year.id
          );

      let storagePaths = [];

      if (yearIds.length) {
        const {
          data: papers,
          error: papersError,
        } = await supabaseAdmin
          .from("pyq_papers")
          .select(
            "file_path"
          )
          .in(
            "year_id",
            yearIds
          );

        if (papersError) {
          return json(
            {
              success: false,
              message:
                papersError.message,
            },
            400
          );
        }

        storagePaths =
          (papers || [])
            .map(
              (paper) =>
                paper.file_path
            );
      }

      const storageResult =
        await removeStoragePaths(
          storagePaths
        );

      if (
        !storageResult.ok
      ) {
        return json(
          {
            success: false,
            message:
              storageResult.message,
          },
          500
        );
      }

      const { error } =
        await supabaseAdmin
          .from(
            "pyq_subjects"
          )
          .delete()
          .eq(
            "id",
            id
          );

      if (error) {
        return json(
          {
            success: false,
            message:
              error.message,
          },
          400
        );
      }

      return json({
        success: true,
        message:
          "PYQ subject folder deleted successfully.",
      });
    }

    return json(
      {
        success: false,
        message:
          "Invalid delete action.",
      },
      400
    );
  } catch (error) {
    console.error(
      "DELETE /api/pyq ERROR:",
      error
    );

    return json(
      {
        success: false,
        message:
          error?.message ||
          "Could not delete PYQ data.",
      },
      500
    );
  }
}

/* =========================================================
   OPTIONS
========================================================= */

export async function OPTIONS() {
  return new NextResponse(
    null,
    {
      status: 204,
      headers: {
        Allow:
          "GET, POST, DELETE, OPTIONS",
      },
    }
  );
}