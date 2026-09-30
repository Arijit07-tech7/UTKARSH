"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Users,
  FileText,
  ClipboardCheck,
  CalendarDays,
  Layers3,
  Bell,
  MessageCircle,
  X,
  Upload,
  FileUp,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { PageHeader, Status, EmptyState } from "@/components/ui";

const configs = {
  students: [
    "Student Management",
    "Approve and manage registered student accounts.",
    Users,
  ],
  notes: [
    "Study Material",
    "Manage academic notes and study material.",
    FileText,
  ],
  assignments: [
    "Assignments",
    "Create and manage academic assignments.",
    ClipboardCheck,
  ],
  routine: [
    "Routine Management",
    "Edit the weekly class schedule.",
    CalendarDays,
  ],
  syllabus: [
    "Syllabus Management",
    "Manage subjects and academic units.",
    Layers3,
  ],
  notices: [
    "Notice Management",
    "Publish important college announcements.",
    Bell,
  ],
  queries: [
    "Student Queries",
    "Manage and respond to student questions.",
    MessageCircle,
  ],
};

const FORM_CONFIG = {
  students: [
    {
      name: "name",
      label: "Student Name",
      placeholder: "Enter student's full name",
      type: "text",
      required: true,
    },
    {
      name: "phone_e164",
      label: "Phone Number",
      placeholder: "+91XXXXXXXXXX",
      type: "tel",
      required: true,
    },
    {
      name: "roll_no",
      label: "Roll Number",
      placeholder: "e.g. 23IT009",
      type: "text",
      required: true,
    },
    {
      name: "section",
      label: "Section",
      placeholder: "e.g. IT-C",
      type: "text",
    },
  ],

  notes: [
    {
      name: "title",
      label: "Note Title",
      placeholder: "e.g. Python File Handling",
      type: "text",
      required: true,
    },
    {
      name: "subject",
      label: "Subject",
      placeholder: "e.g. Python Programming",
      type: "text",
      required: true,
    },
    {
      name: "subject_code",
      label: "Subject Code",
      placeholder: "e.g. IT392",
      type: "text",
    },
    {
      name: "date",
      label: "Date",
      type: "date",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Short description about this note",
      type: "textarea",
    },
    {
      name: "pdf",
      label: "PDF File",
      type: "file",
      accept: ".pdf,application/pdf",
      required: true,
    },
  ],

  assignments: [
    {
      name: "title",
      label: "Assignment Title",
      placeholder: "e.g. File Handling Assignment",
      type: "text",
      required: true,
    },
    {
      name: "subject",
      label: "Subject",
      placeholder: "e.g. Python Programming",
      type: "text",
      required: true,
    },
    {
      name: "subject_code",
      label: "Subject Code",
      placeholder: "e.g. IT392",
      type: "text",
      required: true,
    },
    {
      name: "due_date",
      label: "Deadline",
      type: "datetime-local",
      required: true,
    },
    {
      name: "instructions",
      label: "Instructions / What to Write",
      placeholder:
        "Write the assignment instructions, questions or submission requirements...",
      type: "textarea",
      required: true,
    },
  ],

  routine: [
    {
      name: "day",
      label: "Day",
      type: "select",
      options: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    {
      name: "subject",
      label: "Class / Subject",
      placeholder: "e.g. Python Programming",
      type: "text",
      required: true,
    },
    {
      name: "time",
      label: "Class Time",
      placeholder: "e.g. 10:00 AM - 11:00 AM",
      type: "text",
      required: true,
    },
    {
      name: "room",
      label: "Room / Lab",
      placeholder: "e.g. Lab 3",
      type: "text",
      required: true,
    },
  ],

  syllabus: [
    {
      name: "title",
      label: "Syllabus Title",
      placeholder: "e.g. Engineering Mathematics",
      type: "text",
      required: true,
    },
    {
      name: "code",
      label: "Subject Code",
      placeholder: "e.g. M201",
      type: "text",
    },
    {
      name: "semester",
      label: "Semester",
      placeholder: "e.g. 3rd Semester",
      type: "text",
    },
    {
      name: "description",
      label: "Description",
      placeholder: "Optional syllabus description",
      type: "textarea",
    },
    {
      name: "pdf",
      label: "Syllabus PDF",
      type: "file",
      accept: ".pdf,application/pdf",
      required: true,
    },
  ],

  notices: [
    {
      name: "title",
      label: "Notice Title",
      placeholder: "Enter important notice title",
      type: "text",
      required: true,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [
        "General",
        "Important",
        "Exam",
        "Academic",
        "Event",
      ],
      required: true,
    },
    {
      name: "date",
      label: "Notice Date",
      type: "date",
      required: true,
    },
    {
      name: "description",
      label: "Notice Details",
      placeholder: "Write the complete notice...",
      type: "textarea",
      required: true,
    },
  ],

  queries: [
    {
      name: "title",
      label: "Query Title",
      placeholder: "Enter query title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Query Details",
      placeholder: "Write the student's query...",
      type: "textarea",
      required: true,
    },
  ],
};

function getInitialForm(resource) {
  const fields = FORM_CONFIG[resource] || [];

  return fields.reduce((acc, field) => {
    acc[field.name] =
      field.type === "file" ? null : "";
    return acc;
  }, {});
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function uniqueRecords(records) {
  const seen = new Set();

  return records.filter((item) => {
    const key =
      item.id ||
      [
        item.title,
        item.subject,
        item.subject_code,
        item.date,
        item.due_date,
        item.day,
        item.time,
        item.room,
        item.pdf_hash,
      ]
        .map((value) =>
          String(value ?? "")
            .trim()
            .toLowerCase()
        )
        .join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export default function AdminResourcePage({ resource }) {
  const cfg =
    configs[resource] || configs.students;

  const Icon = cfg[2];

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() =>
    getInitialForm(resource)
  );

  const fields =
    FORM_CONFIG[resource] ||
    FORM_CONFIG.students;

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/data?resource=${encodeURIComponent(
          resource
        )}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            `Could not load ${resource}.`
        );
      }

      const data = Array.isArray(result.data)
        ? result.data
        : [];

      setItems(uniqueRecords(data));
    } catch (err) {
      console.error(
        `Failed to load ${resource}:`,
        err
      );

      /*
       * IMPORTANT:
       * Never show demo/sample data.
       */
      setItems([]);

      setError(
        err?.message ||
          `Could not load ${resource}.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setForm(getInitialForm(resource));
    setQ("");
    loadItems();
  }, [resource]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) return items;

    return items.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(search)
    );
  }, [items, q]);

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCreate() {
    setForm(getInitialForm(resource));
    setError("");
    setOpen(true);
  }

  function closeCreate() {
    if (saving) return;

    setOpen(false);
    setForm(getInitialForm(resource));
  }

  async function create() {
    const missing = fields.find((field) => {
      if (!field.required) return false;

      if (field.type === "file") {
        return !form[field.name];
      }

      return !String(
        form[field.name] || ""
      ).trim();
    });

    if (missing) {
      setError(
        `${missing.label} is required.`
      );
      return;
    }

    if (
      ["notes", "syllabus"].includes(resource)
    ) {
      if (!form.pdf) {
        setError("Please select a PDF file.");
        return;
      }

      if (
        form.pdf.type !==
        "application/pdf"
      ) {
        setError(
          "Only PDF files are allowed."
        );
        return;
      }

      if (
        form.pdf.size >
        20 * 1024 * 1024
      ) {
        setError(
          "PDF size must be less than 20 MB."
        );
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append(
        "resource",
        resource
      );

      Object.entries(form).forEach(
        ([key, value]) => {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (
            value !== null &&
            value !== undefined &&
            value !== ""
          ) {
            formData.append(
              key,
              String(value)
            );
          }
        }
      );

      const response = await fetch(
        "/api/data",
        {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            `Could not create ${resource}.`
        );
      }

      /*
       * Add only the real DB response.
       * Never add local/demo data.
       */
      if (result.data) {
        setItems((previous) =>
          uniqueRecords([
            result.data,
            ...previous,
          ])
        );
      }

      closeCreate();
    } catch (err) {
      console.error(
        `Create ${resource} error:`,
        err
      );

      setError(
        err?.message ||
          `Could not create ${resource}.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!id) {
      setError(
        "This record has no database ID and cannot be deleted."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        "/api/data",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            resource,
            id,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Could not delete this item."
        );
      }

      setItems((previous) =>
        previous.filter(
          (item) => item.id !== id
        )
      );
    } catch (err) {
      console.error(
        `Delete ${resource} error:`,
        err
      );

      setError(
        err?.message ||
          "Could not delete this item."
      );
    }
  }

  function renderField(field) {
    const value = form[field.name];

    if (field.type === "file") {
      return (
        <label
          className="resource-form-field"
          key={field.name}
        >
          <span>
            {field.label}
            {field.required && (
              <i> *</i>
            )}
          </span>

          <div className="pdf-upload-box">
            <input
              id={`file-${resource}-${field.name}`}
              type="file"
              accept={field.accept}
              onChange={(event) => {
                const file =
                  event.target.files?.[0] ||
                  null;

                updateField(
                  field.name,
                  file
                );
              }}
            />

            <label
              htmlFor={`file-${resource}-${field.name}`}
              className="pdf-upload-content"
            >
              <span className="pdf-upload-icon">
                <FileUp size={22} />
              </span>

              <span>
                <b>
                  {value?.name ||
                    "Choose PDF file"}
                </b>

                <small>
                  PDF only • Maximum 20 MB
                </small>
              </span>

              <Upload size={18} />
            </label>
          </div>

          {value?.name && (
            <small className="selected-file-name">
              Selected: {value.name}
            </small>
          )}
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label
          className="resource-form-field"
          key={field.name}
        >
          <span>
            {field.label}
            {field.required && (
              <i> *</i>
            )}
          </span>

          <textarea
            value={value || ""}
            onChange={(event) =>
              updateField(
                field.name,
                event.target.value
              )
            }
            placeholder={
              field.placeholder
            }
            rows={5}
          />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label
          className="resource-form-field"
          key={field.name}
        >
          <span>
            {field.label}
            {field.required && (
              <i> *</i>
            )}
          </span>

          <select
            value={value || ""}
            onChange={(event) =>
              updateField(
                field.name,
                event.target.value
              )
            }
          >
            <option value="">
              Select {field.label}
            </option>

            {field.options.map(
              (option) => (
                <option
                  value={option}
                  key={option}
                >
                  {option}
                </option>
              )
            )}
          </select>
        </label>
      );
    }

    return (
      <label
        className="resource-form-field"
        key={field.name}
      >
        <span>
          {field.label}
          {field.required && (
            <i> *</i>
          )}
        </span>

        <input
          type={field.type || "text"}
          value={value || ""}
          onChange={(event) =>
            updateField(
              field.name,
              event.target.value
            )
          }
          placeholder={
            field.placeholder
          }
        />
      </label>
    );
  }

  function getMainTitle(item) {
    if (resource === "students") {
      return (
        item.name ||
        "Unnamed Student"
      );
    }

    return (
      item.title ||
      item.subject ||
      item.name ||
      "Untitled"
    );
  }

  function getDetails(item) {
    if (resource === "students") {
      return [
        item.roll_no,
        item.phone_e164,
        item.section,
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (resource === "assignments") {
      return [
        item.subject,
        item.subject_code,
        item.due_date
          ? `Deadline: ${formatDateTime(
              item.due_date
            )}`
          : "",
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (resource === "notes") {
      return [
        item.subject,
        item.subject_code,
        item.date
          ? formatDate(item.date)
          : "",
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (resource === "routine") {
      return [
        item.day,
        item.time,
        item.room,
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (resource === "syllabus") {
      return [
        item.code,
        item.semester,
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (resource === "notices") {
      return [
        item.category,
        item.date
          ? formatDate(item.date)
          : "",
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (resource === "queries") {
      return (
        item.created_at
          ? formatDateTime(
              item.created_at
            )
          : "Student query"
      );
    }

    return (
      item.subject ||
      item.code ||
      item.date ||
      item.created_at ||
      "—"
    );
  }

  function getStatus(item) {
    if (item.active === false) {
      return {
        text: "Inactive",
        tone: "pink",
      };
    }

    if (item.status) {
      const status = String(
        item.status
      );

      return {
        text: status,
        tone:
          status.toLowerCase() ===
          "published"
            ? "green"
            : status.toLowerCase() ===
                "open"
              ? "orange"
              : "blue",
      };
    }

    if (item.category) {
      return {
        text: item.category,
        tone: "blue",
      };
    }

    return {
      text: "Active",
      tone: "green",
    };
  }

  const actionLabel =
    resource === "students"
      ? "Add Student"
      : resource === "notes"
        ? "Upload Note"
        : resource === "assignments"
          ? "Add Assignment"
          : resource === "routine"
            ? "Add Routine"
            : resource === "syllabus"
              ? "Upload Syllabus"
              : resource === "notices"
                ? "Post Notice"
                : resource === "queries"
                  ? "Create Query"
                  : "Add New";

  const modalTitle =
    resource === "students"
      ? "Add Student"
      : resource === "notes"
        ? "Upload Note"
        : resource === "assignments"
          ? "Create Assignment"
          : resource === "routine"
            ? "Add Routine"
            : resource === "syllabus"
              ? "Upload Syllabus"
              : resource === "notices"
                ? "Post Notice"
                : resource === "queries"
                  ? "Create Query"
                  : "Create New Item";

  const saveLabel =
    resource === "assignments"
      ? "Publish Assignment"
      : resource === "notes"
        ? "Upload & Save Note"
        : resource === "syllabus"
          ? "Upload Syllabus"
          : resource === "notices"
            ? "Publish Notice"
            : resource === "students"
              ? "Add Student"
              : "Create";

  return (
    <AppShell
      role="admin"
      title={cfg[0]}
      subtitle="Administration"
    >
      <div className="page-wrap">
        <PageHeader
          eyebrow="ADMIN CONTROL CENTER"
          title={cfg[0]}
          description={cfg[1]}
          action={openCreate}
          actionLabel={actionLabel}
        />

        {error && (
          <div
            className="status-banner"
            style={{
              marginBottom: 16,
            }}
          >
            <span>
              <MessageCircle size={19} />
            </span>

            <div>
              <small>
                DATA CONNECTION
              </small>

              <b>{error}</b>
            </div>
          </div>
        )}

        <div className="resource-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={q}
              onChange={(event) =>
                setQ(event.target.value)
              }
              placeholder={`Search ${resource}...`}
            />
          </div>

          <button
            type="button"
            className="soft-button"
            onClick={loadItems}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "dashboard-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map((item) => (
              <div
                className="skeleton-card"
                key={item}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Icon}
            title={`No ${resource} available`}
            text={
              resource === "notes"
                ? "No study material has been uploaded by admin yet."
                : resource === "assignments"
                  ? "No assignment has been published yet."
                  : resource === "routine"
                    ? "No routine has been published yet."
                    : resource ===
                        "syllabus"
                      ? "No syllabus has been uploaded yet."
                      : resource ===
                          "notices"
                        ? "No notice has been published yet."
                        : resource ===
                            "queries"
                          ? "No student queries are available yet."
                          : "No records are available yet."
            }
          />
        ) : (
          <div className="admin-table-card">
            <div className="table-head">
              <span>Item</span>
              <span>Details</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {filtered.map((item) => {
              const status =
                getStatus(item);

              return (
                <div
                  className="table-row"
                  key={
                    item.id ||
                    `${resource}-${JSON.stringify(
                      item
                    )}`
                  }
                >
                  <div className="table-main">
                    <span className="table-icon">
                      <Icon size={17} />
                    </span>

                    <b>
                      {getMainTitle(item)}
                    </b>
                  </div>

                  <span>
                    {getDetails(item) ||
                      "—"}
                  </span>

                  <Status
                    tone={status.tone}
                  >
                    {status.text}
                  </Status>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      remove(item.id)
                    }
                    aria-label="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {open && (
          <div
            className="modal-backdrop"
            onMouseDown={closeCreate}
          >
            <div
              className="modal resource-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="modal-head">
                <div>
                  <span>
                    ADMIN ACTION
                  </span>

                  <h3>{modalTitle}</h3>
                </div>

                <button
                  type="button"
                  onClick={closeCreate}
                  aria-label="Close"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="resource-form">
                {fields.map(renderField)}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="soft-button"
                  onClick={closeCreate}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={create}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="dashboard-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {saveLabel}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}