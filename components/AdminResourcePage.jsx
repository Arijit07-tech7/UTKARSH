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
  Folder,
  FolderOpen,
  ArrowLeft,
  BookOpen,
  ExternalLink,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import {
  PageHeader,
  Status,
  EmptyState,
} from "@/components/ui";

/* =========================================================
   PAGE CONFIG
========================================================= */

const configs = {
  students: [
    "Student Management",
    "Approve and manage registered student accounts.",
    Users,
  ],

  notes: [
    "Study Material",
    "Organize academic material subject-wise.",
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

/* =========================================================
   NORMAL FORM CONFIG
   Notes is intentionally NOT here.
   Notes has its own folder/workspace flow.
========================================================= */

const FORM_CONFIG = {
  students: [
    {
      name: "name",
      label: "Student Name",
      placeholder:
        "Enter student's full name",
      type: "text",
      required: true,
    },
    {
      name: "phone_e164",
      label: "Phone Number",
      placeholder:
        "+91XXXXXXXXXX",
      type: "tel",
      required: true,
    },
    {
      name: "roll_no",
      label: "Roll Number",
      placeholder:
        "e.g. 23IT009",
      type: "text",
      required: true,
    },
    {
      name: "section",
      label: "Section",
      placeholder:
        "e.g. IT-C",
      type: "text",
    },
  ],

  assignments: [
    {
      name: "title",
      label: "Assignment Title",
      placeholder:
        "e.g. File Handling Assignment",
      type: "text",
      required: true,
    },
    {
      name: "subject",
      label: "Subject",
      placeholder:
        "e.g. Python Programming",
      type: "text",
      required: true,
    },
    {
      name: "subject_code",
      label: "Subject Code",
      placeholder:
        "e.g. IT392",
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
      label:
        "Instructions / What to Write",
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
      placeholder:
        "e.g. Python Programming",
      type: "text",
      required: true,
    },
    {
      name: "time",
      label: "Class Time",
      placeholder:
        "e.g. 10:00 AM - 11:00 AM",
      type: "text",
      required: true,
    },
    {
      name: "room",
      label: "Room / Lab",
      placeholder:
        "e.g. Lab 3",
      type: "text",
      required: true,
    },
  ],

  syllabus: [
    {
      name: "title",
      label: "Syllabus Title",
      placeholder:
        "e.g. Engineering Mathematics",
      type: "text",
      required: true,
    },
    {
      name: "code",
      label: "Subject Code",
      placeholder:
        "e.g. M201",
      type: "text",
    },
    {
      name: "semester",
      label: "Semester",
      placeholder:
        "e.g. 3rd Semester",
      type: "text",
    },
    {
      name: "description",
      label: "Description",
      placeholder:
        "Optional syllabus description",
      type: "textarea",
    },
    {
      name: "pdf",
      label: "Syllabus PDF",
      type: "file",
      accept:
        ".pdf,application/pdf",
      required: true,
    },
  ],

  notices: [
    {
      name: "title",
      label: "Notice Title",
      placeholder:
        "Enter important notice title",
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
      placeholder:
        "Write the complete notice...",
      type: "textarea",
      required: true,
    },
  ],

  queries: [
    {
      name: "title",
      label: "Query Title",
      placeholder:
        "Enter query title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Query Details",
      placeholder:
        "Write the student's query...",
      type: "textarea",
      required: true,
    },
  ],
};

/* =========================================================
   HELPERS
========================================================= */

function getInitialForm(resource) {
  const fields =
    FORM_CONFIG[resource] || [];

  return fields.reduce(
    (acc, field) => {
      acc[field.name] =
        field.type === "file"
          ? null
          : "";

      return acc;
    },
    {}
  );
}

function getInitialSubjectForm() {
  return {
    subject_code: "",
    subject_name: "",
  };
}

function formatDate(value) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatDateTime(value) {
  if (!value) return "";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function uniqueRecords(records) {
  const seen = new Set();

  return records.filter(
    (item) => {
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
    }
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminResourcePage({
  resource,
}) {
  const cfg =
    configs[resource] ||
    configs.students;

  const Icon = cfg[2];

  /* =======================================================
     NORMAL RESOURCE STATE
  ======================================================= */

  const [items, setItems] =
    useState([]);

  const [q, setQ] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [open, setOpen] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState(() =>
      getInitialForm(
        resource
      )
    );

  /* =======================================================
     NOTES SUBJECT STATE
  ======================================================= */

  const [subjects, setSubjects] =
    useState([]);

  const [
    subjectsLoading,
    setSubjectsLoading,
  ] = useState(false);

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState(null);

  const [
    subjectModalOpen,
    setSubjectModalOpen,
  ] = useState(false);

  const [
    subjectSaving,
    setSubjectSaving,
  ] = useState(false);

  const [
    subjectForm,
    setSubjectForm,
  ] = useState(
    getInitialSubjectForm()
  );

  const [
    subjectNotes,
    setSubjectNotes,
  ] = useState([]);

  const [
    notesLoading,
    setNotesLoading,
  ] = useState(false);

  /* =======================================================
     NORMAL RESOURCE FIELDS
  ======================================================= */

  const fields =
    FORM_CONFIG[resource] ||
    FORM_CONFIG.students;

  /* =======================================================
     LOAD NORMAL RESOURCE
  ======================================================= */

  async function loadItems() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/data?resource=${encodeURIComponent(
            resource
          )}`,
          {
            method: "GET",
            cache: "no-store",
            credentials:
              "same-origin",
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
            `Could not load ${resource}.`
        );
      }

      const data =
        Array.isArray(
          result.data
        )
          ? result.data
          : [];

      setItems(
        uniqueRecords(data)
      );
    } catch (err) {
      console.error(
        `Failed to load ${resource}:`,
        err
      );

      setItems([]);

      setError(
        err?.message ||
          `Could not load ${resource}.`
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD SUBJECTS
  ======================================================= */

  async function loadSubjects() {
    setSubjectsLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/data?resource=subjects",
          {
            method: "GET",
            cache: "no-store",
            credentials:
              "same-origin",
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
            "Could not load subject folders."
        );
      }

      const data =
        Array.isArray(
          result.data
        )
          ? result.data
          : [];

      setSubjects(uniqueRecords(data));
    } catch (err) {
      console.error(
        "Failed to load subjects:",
        err
      );

      setSubjects([]);

      setError(
        err?.message ||
          "Could not load subject folders."
      );
    } finally {
      setSubjectsLoading(
        false
      );
    }
  }

  /* =======================================================
     LOAD SUBJECT NOTES
  ======================================================= */

  async function loadSubjectNotes(
    subjectId
  ) {
    if (!subjectId) {
      setSubjectNotes([]);
      return;
    }

    setNotesLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/data?resource=notes&subject_id=${encodeURIComponent(
            subjectId
          )}`,
          {
            method: "GET",
            cache: "no-store",
            credentials:
              "same-origin",
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
            "Could not load study material."
        );
      }

      const data =
        Array.isArray(
          result.data
        )
          ? result.data
          : [];

      setSubjectNotes(
        uniqueRecords(data)
      );
    } catch (err) {
      console.error(
        "Failed to load subject notes:",
        err
      );

      setSubjectNotes([]);

      setError(
        err?.message ||
          "Could not load study material."
      );
    } finally {
      setNotesLoading(
        false
      );
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setForm(
      getInitialForm(
        resource
      )
    );

    setQ("");
    setError("");

    setSelectedSubject(null);
    setSubjectNotes([]);

    if (resource === "notes") {
      loadSubjects();
    } else {
      loadItems();
    }
  }, [resource]);

  /* =======================================================
     NORMAL FILTER
  ======================================================= */

  const filtered =
    useMemo(() => {
      const search =
        q.trim().toLowerCase();

      if (!search) {
        return items;
      }

      return items.filter(
        (item) =>
          JSON.stringify(
            item
          )
            .toLowerCase()
            .includes(search)
      );
    }, [items, q]);

  /* =======================================================
     SUBJECT FILTER
  ======================================================= */

  const filteredSubjects =
    useMemo(() => {
      const search =
        q.trim().toLowerCase();

      if (!search) {
        return subjects;
      }

      return subjects.filter(
        (subject) =>
          `${subject.subject_code || ""} ${
            subject.subject_name || ""
          }`
            .toLowerCase()
            .includes(search)
      );
    }, [subjects, q]);

  /* =======================================================
     FORM HELPERS
  ======================================================= */

  function updateField(
    name,
    value
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }

  function openCreate() {
    setForm(
      getInitialForm(
        resource
      )
    );

    setError("");
    setOpen(true);
  }

  function closeCreate() {
    if (saving) return;

    setOpen(false);

    setForm(
      getInitialForm(
        resource
      )
    );
  }

  /* =======================================================
     CREATE NORMAL RESOURCE
  ======================================================= */

  async function create() {
    if (resource === "notes") {
      if (!selectedSubject?.id) {
        setError("Choose a subject folder before uploading material.");
        return;
      }

      if (!String(form.title || "").trim()) {
        setError("Material title is required.");
        return;
      }

      if (!form.pdf) {
        setError("Please select a PDF file.");
        return;
      }
    } else {
      const missing = fields.find((field) => {
        if (!field.required) return false;
        if (field.type === "file") return !form[field.name];
        return !String(form[field.name] || "").trim();
      });

      if (missing) {
        setError(`${missing.label} is required.`);
        return;
      }
    }

    if (["notes", "syllabus"].includes(resource) && form.pdf) {
      const isPdf =
        form.pdf.type === "application/pdf" ||
        form.pdf.name?.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setError("Only PDF files are allowed.");
        return;
      }

      if (form.pdf.size > 20 * 1024 * 1024) {
        setError("PDF size must be less than 20 MB.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "resource",
        resource
      );

      if (resource === "notes") {
        formData.append("subject_id", selectedSubject.id);
        formData.append("subject", selectedSubject.subject_name);
        formData.append("subject_code", selectedSubject.subject_code);
      }

      Object.entries(
        form
      ).forEach(
        ([key, value]) => {
          if (
            value instanceof
            File
          ) {
            formData.append(
              key,
              value
            );
          } else if (
            value !== null &&
            value !==
              undefined &&
            value !== ""
          ) {
            formData.append(
              key,
              String(value)
            );
          }
        }
      );

      const response =
        await fetch(
          "/api/data",
          {
            method: "POST",
            credentials:
              "same-origin",
            body: formData,
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
            `Could not create ${resource}.`
        );
      }

      if (result.data) {
        setItems(
          (previous) =>
            uniqueRecords([
              result.data,
              ...previous,
            ])
        );

        if (
          resource === "notes" &&
          selectedSubject?.id &&
          String(result.data?.subject_id || "") ===
            String(selectedSubject.id)
        ) {
          setSubjectNotes(
            (previous) =>
              uniqueRecords([
                result.data,
                ...previous,
              ])
          );
        }
      }

      setOpen(false);
      setForm(
        getInitialForm(resource)
      );
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

  /* =======================================================
     CREATE SUBJECT FOLDER
  ======================================================= */

  function openSubjectCreate() {
    setSubjectForm(
      getInitialSubjectForm()
    );

    setError("");
    setSubjectModalOpen(
      true
    );
  }

  function closeSubjectCreate() {
    if (subjectSaving) return;

    setSubjectModalOpen(
      false
    );

    setSubjectForm(
      getInitialSubjectForm()
    );
  }

  async function createSubject() {
    if (
      !subjectForm.subject_code.trim()
    ) {
      setError(
        "Subject code is required."
      );
      return;
    }

    if (
      !subjectForm.subject_name.trim()
    ) {
      setError(
        "Subject name is required."
      );
      return;
    }

    setSubjectSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/data",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "same-origin",
            body: JSON.stringify({
              resource:
                "subjects",
              data: {
                subject_code:
                  subjectForm.subject_code.trim(),
                subject_name:
                  subjectForm.subject_name.trim(),
              },
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
            "Could not create subject folder."
        );
      }

      if (result.data) {
        setSubjects(
          (previous) =>
            uniqueRecords([
              result.data,
              ...previous,
            ])
        );
      }

      setSubjectModalOpen(false);
      setSubjectForm(
        getInitialSubjectForm()
      );
    } catch (err) {
      console.error(
        "Create subject error:",
        err
      );

      setError(
        err?.message ||
          "Could not create subject folder."
      );
    } finally {
      setSubjectSaving(
        false
      );
    }
  }

  /* =======================================================
     OPEN SUBJECT
  ======================================================= */

  function openSubject(
    subject
  ) {
    setSelectedSubject(
      subject
    );

    setQ("");
    setError("");

    loadSubjectNotes(
      subject.id
    );
  }

  function closeSubject() {
    setSelectedSubject(
      null
    );

    setSubjectNotes([]);
    setQ("");
    setError("");

    loadSubjects();
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function remove(id) {
    if (!id) {
      setError(
        "This record has no database ID and cannot be deleted."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this item?"
      );

    if (!confirmed) return;

    setError("");

    try {
      const response =
        await fetch(
          "/api/data",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "same-origin",
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

      setItems(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== id
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

  /* =======================================================
     DELETE NOTE INSIDE SUBJECT
  ======================================================= */

  async function removeSubjectNote(
    id
  ) {
    if (!id) {
      setError(
        "This material has no database ID."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this study material?"
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response =
        await fetch(
          "/api/data",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials:
              "same-origin",
            body: JSON.stringify({
              resource:
                "notes",
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
            "Could not delete material."
        );
      }

      setSubjectNotes(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== id
          )
      );
    } catch (err) {
      console.error(
        "Delete note error:",
        err
      );

      setError(
        err?.message ||
          "Could not delete material."
      );
    }
  }

  /* =======================================================
     RENDER NORMAL FORM FIELD
  ======================================================= */

  function renderField(field) {
    const value =
      form[field.name];

    if (
      field.type ===
      "file"
    ) {
      return (
        <div
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
              accept={
                field.accept
              }
              onChange={(
                event
              ) => {
                const file =
                  event.target
                    .files?.[0] ||
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
                <FileUp
                  size={22}
                />
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

              <Upload
                size={18}
              />
            </label>
          </div>

          {value?.name && (
            <small className="selected-file-name">
              Selected:{" "}
              {value.name}
            </small>
          )}
        </div>
      );
    }

    if (
      field.type ===
      "textarea"
    ) {
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
            value={
              value || ""
            }
            onChange={(
              event
            ) =>
              updateField(
                field.name,
                event.target
                  .value
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

    if (
      field.type ===
      "select"
    ) {
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
            value={
              value || ""
            }
            onChange={(
              event
            ) =>
              updateField(
                field.name,
                event.target
                  .value
              )
            }
          >
            <option value="">
              Select{" "}
              {field.label}
            </option>

            {field.options.map(
              (
                option
              ) => (
                <option
                  value={
                    option
                  }
                  key={
                    option
                  }
                >
                  {
                    option
                  }
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
          type={
            field.type ||
            "text"
          }
          value={
            value || ""
          }
          onChange={(
            event
          ) =>
            updateField(
              field.name,
              event.target
                .value
            )
          }
          placeholder={
            field.placeholder
          }
        />
      </label>
    );
  }

  /* =======================================================
     NORMAL RESOURCE HELPERS
  ======================================================= */

  function getMainTitle(item) {
    if (
      resource ===
      "students"
    ) {
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
    if (
      resource ===
      "students"
    ) {
      return [
        item.roll_no,
        item.phone_e164,
        item.section,
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (
      resource ===
      "assignments"
    ) {
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

    if (
      resource ===
      "routine"
    ) {
      return [
        item.day,
        item.time,
        item.room,
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (
      resource ===
      "syllabus"
    ) {
      return [
        item.code,
        item.semester,
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (
      resource ===
      "notices"
    ) {
      return [
        item.category,
        item.date
          ? formatDate(
              item.date
            )
          : "",
      ]
        .filter(Boolean)
        .join(" • ");
    }

    if (
      resource ===
      "queries"
    ) {
      return item.created_at
        ? formatDateTime(
            item.created_at
          )
        : "Student query";
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
    if (
      item.active ===
      false
    ) {
      return {
        text: "Inactive",
        tone: "pink",
      };
    }

    if (item.status) {
      const status =
        String(
          item.status
        );

      return {
        text: status,
        tone:
          status
            .toLowerCase() ===
          "published"
            ? "green"
            : status
                  .toLowerCase() ===
                "open"
              ? "orange"
              : "blue",
      };
    }

    if (
      item.category
    ) {
      return {
        text:
          item.category,
        tone: "blue",
      };
    }

    return {
      text: "Active",
      tone: "green",
    };
  }

  /* =======================================================
     ACTION LABELS
  ======================================================= */

  const actionLabel =
    resource ===
    "students"
      ? "Add Student"
      : resource ===
          "notes"
        ? "Create Subject Folder"
        : resource ===
            "assignments"
          ? "Add Assignment"
          : resource ===
              "routine"
            ? "Add Routine"
            : resource ===
                "syllabus"
              ? "Upload Syllabus"
              : resource ===
                  "notices"
                ? "Post Notice"
                : resource ===
                    "queries"
                  ? "Create Query"
                  : "Add New";

  const modalTitle =
    resource ===
    "students"
      ? "Add Student"
      : resource ===
          "assignments"
        ? "Create Assignment"
        : resource ===
            "routine"
          ? "Add Routine"
          : resource ===
              "syllabus"
            ? "Upload Syllabus"
            : resource ===
                "notices"
              ? "Post Notice"
              : resource ===
                  "queries"
                ? "Create Query"
                : "Create New Item";

  const saveLabel =
    resource ===
    "assignments"
      ? "Publish Assignment"
      : resource ===
          "syllabus"
        ? "Upload Syllabus"
        : resource ===
            "notices"
          ? "Publish Notice"
          : resource ===
              "students"
            ? "Add Student"
            : "Create";

  /* =======================================================
     NOTES SUBJECT WORKSPACE
  ======================================================= */

  function renderNotesPage() {
    /* -------------------------------------------------------
       SELECTED SUBJECT
    ------------------------------------------------------- */

    if (selectedSubject) {
      const visibleNotes =
        subjectNotes.filter(
          (note) => {
            const search =
              q.trim().toLowerCase();

            if (!search) {
              return true;
            }

            return JSON.stringify(
              note
            )
              .toLowerCase()
              .includes(search);
          }
        );

      return (
        <>
          <div className="subject-workspace-header">
            <button
              type="button"
              className="soft-button"
              onClick={
                closeSubject
              }
            >
              <ArrowLeft
                size={17}
              />
              Back to Subjects
            </button>

            <div className="subject-workspace-title">
              <div className="subject-folder-large">
                <FolderOpen
                  size={25}
                />
              </div>

              <div>
                <span>
                  SUBJECT WORKSPACE
                </span>

                <h2>
                  {
                    selectedSubject.subject_code
                  }
                </h2>

                <p>
                  {
                    selectedSubject.subject_name
                  }
                </p>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={
                openCreate
              }
            >
              <Upload
                size={17}
              />
              Upload Material
            </button>
          </div>

          <div className="resource-toolbar">
            <div className="search-box">
              <Search
                size={17}
              />

              <input
                value={q}
                onChange={(
                  event
                ) =>
                  setQ(
                    event.target
                      .value
                  )
                }
                placeholder="Search study material..."
              />
            </div>

            <button
              type="button"
              className="soft-button"
              onClick={() =>
                loadSubjectNotes(
                  selectedSubject.id
                )
              }
              disabled={
                notesLoading
              }
            >
              <RefreshCw
                size={16}
                className={
                  notesLoading
                    ? "dashboard-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {notesLoading ? (
            <div className="skeleton-grid">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    className="skeleton-card"
                    key={item}
                  />
                )
              )}
            </div>
          ) : visibleNotes.length ===
            0 ? (
            <div className="subject-empty-state">
              <div>
                <BookOpen
                  size={28}
                />
              </div>

              <h3>
                No study material yet
              </h3>

              <p>
                Upload the first PDF
                for{" "}
                {
                  selectedSubject.subject_name
                }.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={
                  openCreate
                }
              >
                <Plus
                  size={17}
                />
                Upload Material
              </button>
            </div>
          ) : (
            <div className="admin-table-card">
              <div className="table-head">
                <span>
                  Material
                </span>

                <span>
                  Details
                </span>

                <span>
                  Status
                </span>

                <span>
                  Action
                </span>
              </div>

              {visibleNotes.map(
                (item) => (
                  <div
                    className="table-row"
                    key={
                      item.id
                    }
                  >
                    <div className="table-main">
                      <span className="table-icon">
                        <FileText
                          size={17}
                        />
                      </span>

                      <div>
                        <b>
                          {item.title ||
                            "Untitled Material"}
                        </b>

                        {item.file_name && (
                          <small>
                            {
                              item.file_name
                            }
                          </small>
                        )}
                      </div>
                    </div>

                    <span>
                      {[
                        item.date
                          ? formatDate(
                              item.date
                            )
                          : "",
                        item.description,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " • "
                        ) ||
                        "Study material"}
                    </span>

                    <Status tone="green">
                      PDF
                    </Status>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 8,
                      }}
                    >
                      {(item.pdf_url ||
                        item.pdf_path) && (
                        <a
                          href={
                            item.pdf_url ||
                            item.pdf_path
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="soft-button"
                          aria-label="Open PDF"
                          title="Open PDF"
                          style={{
                            minHeight: 36,
                            padding: "0 11px",
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={15} />
                          View
                        </a>
                      )}

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          removeSubjectNote(
                            item.id
                          )
                        }
                        aria-label="Delete material"
                      >
                        <Trash2
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {open && (
            <div
              className="modal-backdrop"
              onMouseDown={
                closeCreate
              }
            >
              <div
                className="modal resource-modal"
                onMouseDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                <div className="modal-head">
                  <div>
                    <span>
                      STUDY MATERIAL
                    </span>

                    <h3>
                      Upload Material
                    </h3>

                    <small>
                      {
                        selectedSubject.subject_code
                      }{" "}
                      •{" "}
                      {
                        selectedSubject.subject_name
                      }
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={
                      closeCreate
                    }
                    aria-label="Close"
                  >
                    <X
                      size={19}
                    />
                  </button>
                </div>

                <div className="resource-form">
                  {/* TITLE */}
                  <label className="resource-form-field">
                    <span>
                      Material Title
                      <i> *</i>
                    </span>

                    <input
                      type="text"
                      value={
                        form.title ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "title",
                          event.target
                            .value
                        )
                      }
                      placeholder="e.g. Introduction to Automata"
                    />
                  </label>

                  {/* DATE */}
                  <label className="resource-form-field">
                    <span>
                      Date
                    </span>

                    <input
                      type="date"
                      value={
                        form.date ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "date",
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  {/* DESCRIPTION */}
                  <label className="resource-form-field">
                    <span>
                      Description
                    </span>

                    <textarea
                      value={
                        form.description ||
                        ""
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "description",
                          event.target
                            .value
                        )
                      }
                      placeholder="Short description about this study material..."
                      rows={5}
                    />
                  </label>

                  {/* PDF */}
                  <div className="resource-form-field">
                    <span>
                      PDF File
                      <i> *</i>
                    </span>

                    <div className="pdf-upload-box">
                      <input
                        id="notes-subject-pdf"
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(
                          event
                        ) => {
                          const file =
                            event
                              .target
                              .files?.[0] ||
                            null;

                          updateField(
                            "pdf",
                            file
                          );
                        }}
                      />

                      <label
                        htmlFor="notes-subject-pdf"
                        className="pdf-upload-content"
                      >
                        <span className="pdf-upload-icon">
                          <FileUp
                            size={
                              22
                            }
                          />
                        </span>

                        <span>
                          <b>
                            {form
                              .pdf
                              ?.name ||
                              "Choose PDF file"}
                          </b>

                          <small>
                            PDF only • Maximum 20 MB
                          </small>
                        </span>

                        <Upload
                          size={
                            18
                          }
                        />
                      </label>
                    </div>

                    {form.pdf
                      ?.name && (
                      <small className="selected-file-name">
                        Selected:{" "}
                        {
                          form.pdf
                            .name
                        }
                      </small>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="soft-button"
                    onClick={
                      closeCreate
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      create
                    }
                    disabled={
                      saving
                    }
                  >
                    {saving ? (
                      <>
                        <RefreshCw
                          size={
                            17
                          }
                          className="dashboard-spin"
                        />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload
                          size={
                            17
                          }
                        />
                        Upload & Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    }

    /* -------------------------------------------------------
       SUBJECT FOLDER LIST
    ------------------------------------------------------- */

    return (
      <>
        <div className="subject-library-header">
          <div>
            <span>
              ACADEMIC LIBRARY
            </span>

            <h2>
              Subject Folders
            </h2>

            <p>
              Create and manage study
              material subject-wise.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={
              openSubjectCreate
            }
          >
            <Plus
              size={17}
            />
            Create Subject Folder
          </button>
        </div>

        <div className="resource-toolbar">
          <div className="search-box">
            <Search
              size={17}
            />

            <input
              value={q}
              onChange={(
                event
              ) =>
                setQ(
                  event.target
                    .value
                )
              }
              placeholder="Search subject code or subject name..."
            />
          </div>

          <button
            type="button"
            className="soft-button"
            onClick={
              loadSubjects
            }
            disabled={
              subjectsLoading
            }
          >
            <RefreshCw
              size={16}
              className={
                subjectsLoading
                  ? "dashboard-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {subjectsLoading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map(
              (item) => (
                <div
                  className="skeleton-card"
                  key={item}
                />
              )
            )}
          </div>
        ) : filteredSubjects.length ===
          0 ? (
          <div className="subject-empty-state">
            <div>
              <Folder
                size={30}
              />
            </div>

            <h3>
              No subject folders yet
            </h3>

            <p>
              Create a subject folder
              before uploading study
              material.
            </p>


          </div>
        ) : (
          <div className="subject-folder-grid">
            {filteredSubjects.map(
              (subject) => (
                <button
                  type="button"
                  className="subject-folder-card"
                  key={
                    subject.id
                  }
                  onClick={() =>
                    openSubject(
                      subject
                    )
                  }
                >
                  <div className="subject-folder-card-top">
                    <span className="subject-folder-icon">
                      <Folder
                        size={28}
                      />
                    </span>

                    <span className="subject-folder-arrow">
                      →
                    </span>
                  </div>

                  <div className="subject-folder-code">
                    {
                      subject.subject_code
                    }
                  </div>

                  <h3>
                    {
                      subject.subject_name
                    }
                  </h3>

                  <p>
                    Open subject
                    workspace
                  </p>
                </button>
              )
            )}
          </div>
        )}

        {/* CREATE SUBJECT MODAL */}
        {subjectModalOpen && (
          <div
            className="modal-backdrop"
            onMouseDown={
              closeSubjectCreate
            }
          >
            <div
              className="modal resource-modal"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="modal-head">
                <div>
                  <span>
                    ACADEMIC LIBRARY
                  </span>

                  <h3>
                    Create Subject Folder
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={
                    closeSubjectCreate
                  }
                  aria-label="Close"
                >
                  <X
                    size={19}
                  />
                </button>
              </div>

              <div className="resource-form">
                <label className="resource-form-field">
                  <span>
                    Subject Code
                    <i> *</i>
                  </span>

                  <input
                    type="text"
                    value={
                      subjectForm.subject_code
                    }
                    onChange={(
                      event
                    ) =>
                      setSubjectForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          subject_code:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. IT302"
                    autoComplete="off"
                  />
                </label>

                <label className="resource-form-field">
                  <span>
                    Subject Name
                    <i> *</i>
                  </span>

                  <input
                    type="text"
                    value={
                      subjectForm.subject_name
                    }
                    onChange={(
                      event
                    ) =>
                      setSubjectForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          subject_name:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. Formal Language and Automata Theory"
                    autoComplete="off"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="soft-button"
                  onClick={
                    closeSubjectCreate
                  }
                  disabled={
                    subjectSaving
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    createSubject
                  }
                  disabled={
                    subjectSaving
                  }
                >
                  {subjectSaving ? (
                    <>
                      <RefreshCw
                        size={
                          17
                        }
                        className="dashboard-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Folder
                        size={
                          17
                        }
                      />
                      Create Folder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* =======================================================
     MAIN RENDER
  ======================================================= */

  return (
    <AppShell
      role="admin"
      title={cfg[0]}
      subtitle="Administration"
    >
      <div className={`page-wrap ${resource === "notes" ? "admin-notes-page" : ""}`}>
        <PageHeader
          eyebrow="ADMIN CONTROL CENTER"
          title={
            selectedSubject
              ? selectedSubject.subject_code
              : cfg[0]
          }
          description={
            selectedSubject
              ? selectedSubject.subject_name
              : cfg[1]
          }
          action={
            resource === "notes"
              ? undefined
              : openCreate
          }
          actionLabel={
            resource === "notes"
              ? undefined
              : actionLabel
          }
        />

        {error && (
          <div
            className="status-banner"
            style={{
              marginBottom: 16,
            }}
          >
            <span>
              <MessageCircle
                size={19}
              />
            </span>

            <div>
              <small>
                DATA CONNECTION
              </small>

              <b>
                {error}
              </b>
            </div>
          </div>
        )}

        {resource ===
        "notes" ? (
          renderNotesPage()
        ) : (
          <>
            {/* =================================================
                NORMAL RESOURCES
            ================================================= */}

            <div className="resource-toolbar">
              <div className="search-box">
                <Search
                  size={17}
                />

                <input
                  value={q}
                  onChange={(
                    event
                  ) =>
                    setQ(
                      event.target
                        .value
                    )
                  }
                  placeholder={`Search ${resource}...`}
                />
              </div>

              <button
                type="button"
                className="soft-button"
                onClick={
                  loadItems
                }
                disabled={
                  loading
                }
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
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      className="skeleton-card"
                      key={
                        item
                      }
                    />
                  )
                )}
              </div>
            ) : filtered.length ===
              0 ? (
              <EmptyState
                icon={Icon}
                title={`No ${resource} available`}
                text={
                  resource ===
                  "assignments"
                    ? "No assignment has been published yet."
                    : resource ===
                        "routine"
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
                  <span>
                    Item
                  </span>

                  <span>
                    Details
                  </span>

                  <span>
                    Status
                  </span>

                  <span>
                    Action
                  </span>
                </div>

                {filtered.map(
                  (item) => {
                    const status =
                      getStatus(
                        item
                      );

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
                            <Icon
                              size={
                                17
                              }
                            />
                          </span>

                          <b>
                            {getMainTitle(
                              item
                            )}
                          </b>
                        </div>

                        <span>
                          {getDetails(
                            item
                          ) ||
                            "—"}
                        </span>

                        <Status
                          tone={
                            status.tone
                          }
                        >
                          {
                            status.text
                          }
                        </Status>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            remove(
                              item.id
                            )
                          }
                          aria-label="Delete item"
                        >
                          <Trash2
                            size={
                              16
                            }
                          />
                        </button>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* =================================================
                NORMAL RESOURCE CREATE MODAL
            ================================================= */}

            {open && (
              <div
                className="modal-backdrop"
                onMouseDown={
                  closeCreate
                }
              >
                <div
                  className="modal resource-modal"
                  onMouseDown={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                >
                  <div className="modal-head">
                    <div>
                      <span>
                        ADMIN ACTION
                      </span>

                      <h3>
                        {
                          modalTitle
                        }
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={
                        closeCreate
                      }
                      aria-label="Close"
                    >
                      <X
                        size={
                          19
                        }
                      />
                    </button>
                  </div>

                  <div className="resource-form">
                    {fields.map(
                      renderField
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="soft-button"
                      onClick={
                        closeCreate
                      }
                      disabled={
                        saving
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        create
                      }
                      disabled={
                        saving
                      }
                    >
                      {saving ? (
                        <>
                          <RefreshCw
                            size={
                              17
                            }
                            className="dashboard-spin"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus
                            size={
                              17
                            }
                          />
                          {
                            saveLabel
                          }
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}