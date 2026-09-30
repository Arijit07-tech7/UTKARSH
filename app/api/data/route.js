import { NextResponse } from "next/server";
import crypto from "crypto";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireSession } from "@/lib/server-auth";

/* =========================================================
   CONFIG
========================================================= */

const ALLOWED = [
  "subjects",
  "notes",
  "assignments",
  "routine",
  "syllabus",
  "notices",
  "query",
  "queries",
  "notifications",
  "students",
];

const TABLE = {
  subjects: "subjects",
  query: "queries",
  students: "approved_students",
};

const ADMIN_ONLY = [
  "students",
];

const PDF_RESOURCES = [
  "notes",
  "syllabus",
];

const PDF_BUCKET = {
  notes: "notes",
  syllabus: "academic-pdfs",
};

const MAX_PDF_SIZE =
  20 * 1024 * 1024;

/* =========================================================
   BASIC HELPERS
========================================================= */

function getTable(resource) {
  return TABLE[resource] || resource;
}

function isPdfResource(resource) {
  return PDF_RESOURCES.includes(resource);
}

function getPdfBucket(resource) {
  return (
    PDF_BUCKET[resource] ||
    "academic-pdfs"
  );
}

function cleanValue(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const valueString =
    String(value).trim();

  return valueString === ""
    ? null
    : valueString;
}

/* =========================================================
   PHONE
========================================================= */

function normalizePhone(value) {
  const cleaned = cleanValue(value);

  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  const digits =
    cleaned.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return cleaned;
}

/* =========================================================
   STUDENT
========================================================= */

function buildStudentRecord(
  source = {}
) {
  return {
    name: cleanValue(source.name),

    phone_e164: normalizePhone(
      source.phone_e164 ||
        source.phone ||
        source.mobile
    ),

    roll_no: cleanValue(
      source.roll_no ||
        source.rollNo ||
        source.roll
    ),
  };
}

/* =========================================================
   SUBJECT
========================================================= */

function buildSubjectRecord(
  source = {}
) {
  return {
    subject_code: cleanValue(
      source.subject_code ||
        source.subjectCode ||
        source.code
    ),

    subject_name: cleanValue(
      source.subject_name ||
        source.subjectName ||
        source.name ||
        source.title
    ),
  };
}

/* =========================================================
   FORM DATA
========================================================= */

function buildRecordFromFormData(
  formData
) {
  const record = {};

  for (const [key, value] of formData.entries()) {
    if (
      key === "resource" ||
      key === "pdf"
    ) {
      continue;
    }

    if (value instanceof File) {
      continue;
    }

    const cleaned =
      cleanValue(value);

    if (cleaned !== null) {
      record[key] = cleaned;
    }
  }

  return record;
}

/* =========================================================
   NOTES
========================================================= */

function buildNotesRecord(
  source = {}
) {
  return {
    title: cleanValue(
      source.title
    ),

    subject: cleanValue(
      source.subject
    ),

    description: cleanValue(
      source.description ||
        source.details ||
        source.content
    ),

    subject_id:
      cleanValue(
        source.subject_id ||
          source.subjectId
      ),
  };
}

/* =========================================================
   STORAGE BUCKET CHECK
========================================================= */

async function verifyBucket(
  bucketName
) {
  try {
    const {
      data,
      error,
    } =
      await supabaseAdmin.storage.getBucket(
        bucketName
      );

    if (error) {
      console.error(
        `Storage bucket "${bucketName}" error:`,
        error.message
      );

      return {
        exists: false,
        error: error.message,
      };
    }

    return {
      exists: Boolean(data),
      error: null,
    };
  } catch (error) {
    console.error(
      `Storage bucket "${bucketName}" exception:`,
      error
    );

    return {
      exists: false,
      error:
        error?.message ||
        "Storage error",
    };
  }
}

/* =========================================================
   PDF UPLOAD
========================================================= */

async function uploadPdf(
  file,
  resource,
  subjectId = null
) {
  if (!(file instanceof File)) {
    return {
      ok: false,
      message:
        "PDF file is required.",
    };
  }

  if (
    file.type !==
    "application/pdf"
  ) {
    return {
      ok: false,
      message:
        "Only PDF files are allowed.",
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      message:
        "The selected PDF is empty.",
    };
  }

  if (
    file.size >
    MAX_PDF_SIZE
  ) {
    return {
      ok: false,
      message:
        "PDF size must be less than 20 MB.",
    };
  }

  const bucket =
    getPdfBucket(resource);

  console.log(
    `[PDF] Resource: ${resource}`
  );

  console.log(
    `[PDF] Bucket: ${bucket}`
  );

  const bucketCheck =
    await verifyBucket(bucket);

  if (!bucketCheck.exists) {
    return {
      ok: false,
      message:
        `Storage bucket "${bucket}" is not available. ` +
        `${bucketCheck.error || ""}`,
    };
  }

  const buffer =
    Buffer.from(
      await file.arrayBuffer()
    );

  const hash =
    crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

  const year =
    new Date().getFullYear();

  /*
   * Notes are stored inside
   * their own subject folder.
   *
   * Example:
   *
   * notes/subjects/
   *   SUBJECT_UUID/
   *     2026/
   *       HASH.pdf
   *
   * Syllabus keeps the
   * existing storage structure.
   */
  const filePath =
    resource === "notes" && subjectId
      ? `notes/subjects/${subjectId}/${year}/${hash}.pdf`
      : `${resource}/${year}/${hash}.pdf`;

  /*
   * Duplicate PDF check.
   *
   * For notes:
   * same hash + same subject_id
   * = duplicate.
   *
   * Same PDF in another subject
   * is therefore allowed.
   *
   * For syllabus:
   * existing global hash
   * behaviour remains unchanged.
   */
  let duplicateQuery =
    supabaseAdmin
      .from(resource)
      .select("id")
      .eq("pdf_hash", hash);

  if (
    resource === "notes" &&
    subjectId
  ) {
    duplicateQuery =
      duplicateQuery.eq(
        "subject_id",
        subjectId
      );
  }

  const {
    data: existing,
    error: duplicateError,
  } =
    await duplicateQuery.limit(1);

  if (duplicateError) {
    console.error(
      "PDF duplicate check error:",
      duplicateError.message
    );

    return {
      ok: false,
      message:
        duplicateError.message,
    };
  }

  if (
    existing &&
    existing.length > 0
  ) {
    return {
      ok: false,
      duplicate: true,
      message:
        "This PDF has already been uploaded.",
    };
  }

  const {
    error: uploadError,
  } =
    await supabaseAdmin.storage
      .from(bucket)
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
      "========== PDF UPLOAD ERROR =========="
    );

    console.error(
      "Resource:",
      resource
    );

    console.error(
      "Bucket:",
      bucket
    );

    console.error(
      "Path:",
      filePath
    );

    console.error(
      "Error:",
      uploadError
    );

    console.error(
      "======================================="
    );

    return {
      ok: false,
      message:
        uploadError.message ||
        "Could not upload PDF.",
    };
  }

  const {
    data: publicUrlData,
  } =
    supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(
        filePath
      );

  return {
    ok: true,

    hash,

    path: filePath,

    bucket,

    url:
      publicUrlData?.publicUrl ||
      null,

    fileName: file.name,
  };
}

/* =========================================================
   DELETE PDF
========================================================= */

async function deletePdf(
  filePath,
  resource
) {
  if (!filePath) {
    return;
  }

  const bucket =
    getPdfBucket(resource);

  const { error } =
    await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

  if (error) {
    console.error(
      `Could not delete PDF from ${bucket}:`,
      error.message
    );
  }
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request
) {
  try {
    const auth =
      await requireSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized",
        },
        {
          status:
            auth.status || 401,
        }
      );
    }

    const url =
      new URL(request.url);

    const resource =
      url.searchParams.get(
        "resource"
      );

    if (
      !ALLOWED.includes(resource)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid resource",
          data: [],
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       ADMIN RESOURCE
    ------------------------------------------------------- */

    if (
      ADMIN_ONLY.includes(
        resource
      )
    ) {
      const adminAuth =
        await requireSession(
          "admin"
        );

      if (!adminAuth.ok) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Admin access required",
          },
          {
            status:
              adminAuth.status ||
              403,
          }
        );
      }
    }

    /* -------------------------------------------------------
       SUBJECTS
    ------------------------------------------------------- */

    if (
      resource === "subjects"
    ) {
      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from("subjects")
          .select(
            "id, subject_code, subject_name, created_by, created_at"
          )
          .order(
            "subject_code",
            {
              ascending: true,
            }
          )
          .limit(200);

      if (error) {
        console.error(
          "GET SUBJECTS:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
            data: [],
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    /* -------------------------------------------------------
       STUDENTS
    ------------------------------------------------------- */

    if (
      resource === "students"
    ) {
      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "approved_students"
          )
          .select(
            "id, phone_e164, name, roll_no"
          )
          .order("name", {
            ascending: true,
          })
          .limit(200);

      if (error) {
        console.error(
          "GET STUDENTS:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
            data: [],
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    /* -------------------------------------------------------
       NOTES
    ------------------------------------------------------- */

    if (
      resource === "notes"
    ) {
      const subjectId =
        url.searchParams.get(
          "subject_id"
        );

      let query =
        supabaseAdmin
          .from("notes")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(200);

      if (subjectId) {
        query = query.eq(
          "subject_id",
          subjectId
        );
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        console.error(
          "GET NOTES:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
            data: [],
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    /* -------------------------------------------------------
       OTHER RESOURCES
    ------------------------------------------------------- */

    const table =
      getTable(resource);

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(table)
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(200);

    if (error) {
      console.error(
        `GET ${resource}:`,
        error.message
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
          data: [],
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error(
      "GET /api/data ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Server error.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request
) {
  try {
    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    let resource = null;
    let record = {};
    let pdfFile = null;

    /* =====================================================
       MULTIPART / PDF
    ===================================================== */

    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const auth =
        await requireSession(
          "admin"
        );

      if (!auth.ok) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Admin access required",
          },
          {
            status:
              auth.status || 403,
          }
        );
      }

      const formData =
        await request.formData();

      const resourceValue =
        formData.get(
          "resource"
        );

      if (
        typeof resourceValue !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Resource is required",
          },
          {
            status: 400,
          }
        );
      }

      resource =
        resourceValue;

      record =
        buildRecordFromFormData(
          formData
        );

      const file =
        formData.get("pdf");

      if (
        file instanceof File
      ) {
        pdfFile = file;
      }
    }

    /* =====================================================
       JSON
    ===================================================== */

    else {
      let body;

      try {
        body =
          await request.json();
      } catch {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid JSON request",
          },
          {
            status: 400,
          }
        );
      }

      resource =
        body?.resource;

      if (
        typeof resource !==
        "string"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Resource is required",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         QUERY
      --------------------------------------------------- */

      if (
        resource === "query"
      ) {
        const auth =
          await requireSession();

        if (!auth.ok) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Unauthorized",
            },
            {
              status:
                auth.status || 401,
            }
          );
        }
      }

      /* ---------------------------------------------------
         ADMIN
      --------------------------------------------------- */

      else {
        const auth =
          await requireSession(
            "admin"
          );

        if (!auth.ok) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Admin access required",
            },
            {
              status:
                auth.status || 403,
            }
          );
        }
      }

      if (
        body?.data &&
        typeof body.data ===
          "object" &&
        !Array.isArray(
          body.data
        )
      ) {
        record =
          body.data;
      } else {
        const {
          resource:
            ignoredResource,
          action:
            ignoredAction,
          ...rest
        } = body;

        record = rest;
      }
    }

    /* =====================================================
       RESOURCE VALIDATION
    ===================================================== */

    if (
      !ALLOWED.includes(
        resource
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid resource",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SUBJECTS
    ===================================================== */

    if (
      resource === "subjects"
    ) {
      const subject =
        buildSubjectRecord(
          record
        );

      if (!subject.subject_code) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Subject code is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!subject.subject_name) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Subject name is required.",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         DUPLICATE SUBJECT CODE
      --------------------------------------------------- */

      const {
        data: existingCode,
        error: duplicateError,
      } =
        await supabaseAdmin
          .from("subjects")
          .select("id")
          .ilike(
            "subject_code",
            subject.subject_code
          )
          .limit(1);

      if (duplicateError) {
        return NextResponse.json(
          {
            success: false,
            message:
              duplicateError.message,
          },
          {
            status: 400,
          }
        );
      }

      if (
        existingCode &&
        existingCode.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A subject with this code already exists.",
          },
          {
            status: 409,
          }
        );
      }

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from("subjects")
          .insert({
            subject_code:
              subject.subject_code,
            subject_name:
              subject.subject_name,
          })
          .select()
          .single();

      if (error) {
        console.error(
          "POST SUBJECTS:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data,
        },
        {
          status: 201,
        }
      );
    }

    /* =====================================================
       STUDENTS
    ===================================================== */

    if (
      resource === "students"
    ) {
      const student =
        buildStudentRecord(
          record
        );

      if (!student.name) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !student.phone_e164
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student phone number is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!student.roll_no) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student roll number is required.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: existingPhone,
        error: phoneError,
      } =
        await supabaseAdmin
          .from(
            "approved_students"
          )
          .select("id")
          .eq(
            "phone_e164",
            student.phone_e164
          )
          .limit(1);

      if (phoneError) {
        return NextResponse.json(
          {
            success: false,
            message:
              phoneError.message,
          },
          {
            status: 400,
          }
        );
      }

      if (
        existingPhone &&
        existingPhone.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A student with this phone number already exists.",
          },
          {
            status: 409,
          }
        );
      }

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "approved_students"
          )
          .insert(student)
          .select(
            "id, phone_e164, name, roll_no"
          )
          .single();

      if (error) {
        console.error(
          "POST STUDENTS:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data,
        },
        {
          status: 201,
        }
      );
    }

    /* =====================================================
       NOTES
    ===================================================== */

    if (
      resource === "notes"
    ) {
      record =
        buildNotesRecord(
          record
        );

      if (!record.title) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Note title is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!record.subject) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Note subject is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!record.subject_id) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Subject folder is required.",
          },
          {
            status: 400,
          }
        );
      }

      /* ---------------------------------------------------
         VERIFY SUBJECT
      --------------------------------------------------- */

      const {
        data: subject,
        error: subjectError,
      } =
        await supabaseAdmin
          .from("subjects")
          .select(
            "id, subject_code, subject_name"
          )
          .eq(
            "id",
            record.subject_id
          )
          .maybeSingle();

      if (subjectError) {
        return NextResponse.json(
          {
            success: false,
            message:
              subjectError.message,
          },
          {
            status: 400,
          }
        );
      }

      if (!subject) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected subject folder does not exist.",
          },
          {
            status: 404,
          }
        );
      }

      record.subject =
        subject.subject_name;
    }

    /* =====================================================
       PDF
    ===================================================== */

    if (
      isPdfResource(resource)
    ) {
      if (!pdfFile) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please select a PDF file.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        resource === "notes"
      ) {
        record =
          buildNotesRecord(
            record
          );

        if (
          !record.subject_id
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Subject folder is required.",
            },
            {
              status: 400,
            }
          );
        }

        const {
          data: subject,
          error: subjectError,
        } =
          await supabaseAdmin
            .from("subjects")
            .select(
              "id, subject_code, subject_name"
            )
            .eq(
              "id",
              record.subject_id
            )
            .maybeSingle();

        if (subjectError) {
          return NextResponse.json(
            {
              success: false,
              message:
                subjectError.message,
            },
            {
              status: 400,
            }
          );
        }

        if (!subject) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Selected subject folder does not exist.",
            },
            {
              status: 404,
            }
          );
        }

        record.subject =
          subject.subject_name;
      }

      const upload =
        await uploadPdf(
          pdfFile,
          resource,
          resource === "notes"
            ? record.subject_id
            : null
        );

      if (!upload.ok) {
        return NextResponse.json(
          {
            success: false,
            duplicate:
              Boolean(
                upload.duplicate
              ),
            message:
              upload.message,
          },
          {
            status:
              upload.duplicate
                ? 409
                : 400,
          }
        );
      }

      /* ---------------------------------------------------
         DUPLICATE TITLE + SUBJECT
      --------------------------------------------------- */

      if (
        record.title &&
        record.subject
      ) {
        const {
          data: existing,
          error:
            duplicateError,
        } =
          await supabaseAdmin
            .from(resource)
            .select("id")
            .eq(
              "title",
              record.title
            )
            .eq(
              "subject",
              record.subject
            )
            .limit(1);

        if (duplicateError) {
          await deletePdf(
            upload.path,
            resource
          );

          return NextResponse.json(
            {
              success: false,
              message:
                duplicateError.message,
            },
            {
              status: 400,
            }
          );
        }

        if (
          existing &&
          existing.length > 0
        ) {
          await deletePdf(
            upload.path,
            resource
          );

          return NextResponse.json(
            {
              success: false,
              duplicate: true,
              message:
                "A matching record already exists.",
            },
            {
              status: 409,
            }
          );
        }
      }

      record.file_name =
        upload.fileName;

      record.file_path =
        upload.path;

      record.pdf_url =
        upload.url;

      record.pdf_hash =
        upload.hash;
    }

    /* =====================================================
       DATABASE INSERT
    ===================================================== */

    const table =
      getTable(resource);

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(table)
        .insert(record)
        .select()
        .single();

    if (error) {
      if (
        isPdfResource(
          resource
        ) &&
        record.file_path
      ) {
        await deletePdf(
          record.file_path,
          resource
        );
      }

      console.error(
        `POST ${resource}:`,
        error.message
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/data ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Server error.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(
  request
) {
  try {
    const auth =
      await requireSession(
        "admin"
      );

    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin access required",
        },
        {
          status:
            auth.status || 403,
        }
      );
    }

    let body;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request",
        },
        {
          status: 400,
        }
      );
    }

    const {
      resource,
      id,
      data,
      ...flatUpdates
    } = body || {};

    if (
      !ALLOWED.includes(
        resource
      ) ||
      !id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resource and id are required",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SUBJECTS
    ===================================================== */

    if (
      resource === "subjects"
    ) {
      const incoming =
        data &&
        typeof data ===
          "object" &&
        !Array.isArray(data)
          ? data
          : flatUpdates;

      const subject =
        buildSubjectRecord(
          incoming
        );

      if (
        !subject.subject_code
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Subject code is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !subject.subject_name
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Subject name is required.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: duplicate,
        error:
          duplicateError,
      } =
        await supabaseAdmin
          .from("subjects")
          .select("id")
          .ilike(
            "subject_code",
            subject.subject_code
          )
          .neq("id", id)
          .limit(1);

      if (duplicateError) {
        return NextResponse.json(
          {
            success: false,
            message:
              duplicateError.message,
          },
          {
            status: 400,
          }
        );
      }

      if (
        duplicate &&
        duplicate.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A subject with this code already exists.",
          },
          {
            status: 409,
          }
        );
      }

      const {
        data: updatedData,
        error,
      } =
        await supabaseAdmin
          .from("subjects")
          .update({
            subject_code:
              subject.subject_code,
            subject_name:
              subject.subject_name,
          })
          .eq("id", id)
          .select()
          .single();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          {
            status: 400,
          }
        );
      }

      await supabaseAdmin
        .from("notes")
        .update({
          subject:
            subject.subject_name,
        })
        .eq(
          "subject_id",
          id
        );

      return NextResponse.json({
        success: true,
        data: updatedData,
      });
    }

    /* =====================================================
       STUDENTS
    ===================================================== */

    if (
      resource === "students"
    ) {
      const incoming =
        data &&
        typeof data ===
          "object" &&
        !Array.isArray(data)
          ? data
          : flatUpdates;

      const student =
        buildStudentRecord(
          incoming
        );

      if (!student.name) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student name is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !student.phone_e164
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student phone number is required.",
          },
          {
            status: 400,
          }
        );
      }

      if (!student.roll_no) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Student roll number is required.",
          },
          {
            status: 400,
          }
        );
      }

      const {
        data: duplicatePhone,
        error:
          duplicateError,
      } =
        await supabaseAdmin
          .from(
            "approved_students"
          )
          .select("id")
          .eq(
            "phone_e164",
            student.phone_e164
          )
          .neq("id", id)
          .limit(1);

      if (duplicateError) {
        return NextResponse.json(
          {
            success: false,
            message:
              duplicateError.message,
          },
          {
            status: 400,
          }
        );
      }

      if (
        duplicatePhone &&
        duplicatePhone.length > 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another student already uses this phone number.",
          },
          {
            status: 409,
          }
        );
      }

      const {
        data: updatedData,
        error,
      } =
        await supabaseAdmin
          .from(
            "approved_students"
          )
          .update(student)
          .eq("id", id)
          .select(
            "id, phone_e164, name, roll_no"
          )
          .single();

      if (error) {
        console.error(
          "PATCH STUDENTS:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedData,
      });
    }

    /* =====================================================
       NOTES
    ===================================================== */

    if (
      resource === "notes"
    ) {
      const incoming =
        data &&
        typeof data ===
          "object" &&
        !Array.isArray(data)
          ? data
          : flatUpdates;

      const note =
        buildNotesRecord(
          incoming
        );

      const updatePayload = {
        title: note.title,
        subject: note.subject,
        description:
          note.description,
      };

      if (
        note.subject_id
      ) {
        const {
          data: subject,
          error:
            subjectError,
        } =
          await supabaseAdmin
            .from("subjects")
            .select(
              "id, subject_name"
            )
            .eq(
              "id",
              note.subject_id
            )
            .maybeSingle();

        if (subjectError) {
          return NextResponse.json(
            {
              success: false,
              message:
                subjectError.message,
            },
            {
              status: 400,
            }
          );
        }

        if (!subject) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Subject folder does not exist.",
            },
            {
              status: 404,
            }
          );
        }

        updatePayload.subject_id =
          note.subject_id;

        updatePayload.subject =
          subject.subject_name;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          incoming,
          "file_name"
        )
      ) {
        updatePayload.file_name =
          cleanValue(
            incoming.file_name
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          incoming,
          "file_path"
        )
      ) {
        updatePayload.file_path =
          cleanValue(
            incoming.file_path
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          incoming,
          "pdf_url"
        )
      ) {
        updatePayload.pdf_url =
          cleanValue(
            incoming.pdf_url
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          incoming,
          "pdf_hash"
        )
      ) {
        updatePayload.pdf_hash =
          cleanValue(
            incoming.pdf_hash
          );
      }

      const {
        data: updatedData,
        error,
      } =
        await supabaseAdmin
          .from("notes")
          .update(
            updatePayload
          )
          .eq("id", id)
          .select()
          .single();

      if (error) {
        console.error(
          "PATCH NOTES:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedData,
      });
    }

    /* =====================================================
       NORMAL PATCH
    ===================================================== */

    const table =
      getTable(resource);

    const updateData =
      data &&
      typeof data ===
        "object" &&
      !Array.isArray(data)
        ? data
        : flatUpdates;

    const safeUpdates = {
      ...updateData,
    };

    delete safeUpdates.date;

    const {
      data: updatedData,
      error,
    } =
      await supabaseAdmin
        .from(table)
        .update(
          safeUpdates
        )
        .eq("id", id)
        .select()
        .single();

    if (error) {
      console.error(
        `PATCH ${resource}:`,
        error.message
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedData,
    });
  } catch (error) {
    console.error(
      "PATCH /api/data ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Server error.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  request
) {
  try {
    const auth =
      await requireSession(
        "admin"
      );

    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin access required",
        },
        {
          status:
            auth.status || 403,
        }
      );
    }

    let body;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request",
        },
        {
          status: 400,
        }
      );
    }

    const {
      resource,
      id,
    } = body || {};

    if (
      !ALLOWED.includes(
        resource
      ) ||
      !id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Resource and id are required",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SUBJECTS
    ===================================================== */

    if (
      resource === "subjects"
    ) {
      const {
        count,
        error:
          countError,
      } =
        await supabaseAdmin
          .from("notes")
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "subject_id",
            id
          );

      if (countError) {
        return NextResponse.json(
          {
            success: false,
            message:
              countError.message,
          },
          {
            status: 400,
          }
        );
      }

      if (
        count &&
        count > 0
      ) {
        const {
          data: linkedNotes,
          error:
            linkedNotesError,
        } =
          await supabaseAdmin
            .from("notes")
            .select(
              "file_path"
            )
            .eq(
              "subject_id",
              id
            );

        if (linkedNotesError) {
          return NextResponse.json(
            {
              success: false,
              message:
                linkedNotesError.message,
            },
            {
              status: 400,
            }
          );
        }

        for (
          const note
          of linkedNotes || []
        ) {
          if (
            note?.file_path
          ) {
            await deletePdf(
              note.file_path,
              "notes"
            );
          }
        }
      }

      const {
        error,
      } =
        await supabaseAdmin
          .from("subjects")
          .delete()
          .eq("id", id);

      if (error) {
        console.error(
          "DELETE SUBJECT:",
          error.message
        );

        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json({
        success: true,
      });
    }

    const table =
      getTable(resource);

    let filePath = null;

    /* -------------------------------------------------------
       FIND PDF
    ------------------------------------------------------- */

    if (
      isPdfResource(resource)
    ) {
      const {
        data: existing,
        error,
      } =
        await supabaseAdmin
          .from(table)
          .select(
            "file_path"
          )
          .eq("id", id)
          .maybeSingle();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            message:
              error.message,
          },
          {
            status: 400,
          }
        );
      }

      filePath =
        existing?.file_path ||
        null;
    }

    /* -------------------------------------------------------
       DELETE DATABASE RECORD
    ------------------------------------------------------- */

    const { error } =
      await supabaseAdmin
        .from(table)
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        `DELETE ${resource}:`,
        error.message
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       DELETE STORAGE FILE
    ------------------------------------------------------- */

    if (
      isPdfResource(
        resource
      ) &&
      filePath
    ) {
      await deletePdf(
        filePath,
        resource
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE /api/data ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Server error.",
      },
      {
        status: 500,
      }
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
          "GET, POST, PATCH, DELETE, OPTIONS",
      },
    }
  );
}