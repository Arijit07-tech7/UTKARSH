"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { Status } from "@/components/ui";

/* =========================================================
   HELPERS
========================================================= */

function normalizeStudent(record) {
  return {
    id: record?.id || "",

    name:
      record?.name ||
      "Unnamed Student",

    phone:
      record?.phone_e164 ||
      record?.phone ||
      record?.mobile ||
      "",

    rollNo:
      record?.roll_no ||
      record?.rollNo ||
      record?.roll ||
      "",
  };
}

/* =========================================================
   API
========================================================= */

async function fetchStudents() {
  const response = await fetch(
    "/api/data?resource=students",
    {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    }
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Invalid response while loading students."
    );
  }

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message ||
        "Could not load students."
    );
  }

  return Array.isArray(result.data)
    ? result.data.map(normalizeStudent)
    : [];
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    roll_no: "",
  });

  /* =======================================================
     LOAD
  ======================================================= */

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const data =
        await fetchStudents();

      setStudents(data);
    } catch (err) {
      console.error(
        "Student loading error:",
        err
      );

      setStudents([]);

      setError(
        err?.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredStudents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return students;
      }

      return students.filter(
        (student) =>
          [
            student.name,
            student.phone,
            student.rollNo,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query)
            )
      );
    }, [students, search]);

  /* =======================================================
     FORM
  ======================================================= */

  function openAddForm() {
    setEditingStudent(null);

    setForm({
      name: "",
      phone: "",
      roll_no: "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(student) {
    setEditingStudent(student);

    setForm({
      name: student.name || "",
      phone: student.phone || "",
      roll_no: student.rollNo || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingStudent(null);
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const phone =
      form.phone.replace(
        /\D/g,
        ""
      );

    const rollNo =
      form.roll_no.trim();

    if (!name) {
      setError(
        "Please enter the student's name."
      );
      return;
    }

    if (phone.length !== 10) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!rollNo) {
      setError(
        "Please enter the student's roll number."
      );
      return;
    }

    setSaving(true);

    try {
      const isEditing =
        Boolean(
          editingStudent?.id
        );

      const method =
        isEditing
          ? "PATCH"
          : "POST";

      /*
       * approved_students ONLY accepts:
       *
       * name
       * phone_e164
       * roll_no
       */

      const body = isEditing
        ? {
            resource: "students",

            id:
              editingStudent.id,

            name,

            phone_e164:
              `+91${phone}`,

            roll_no:
              rollNo,
          }
        : {
            resource: "students",

            action: "create",

            data: {
              name,

              phone_e164:
                `+91${phone}`,

              roll_no:
                rollNo,
            },
          };

      const response =
        await fetch(
          "/api/data",
          {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "same-origin",

            body:
              JSON.stringify(
                body
              ),
          }
        );

      let result;

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          "Invalid response from server."
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Could not save student."
        );
      }

      setSuccess(
        isEditing
          ? "Student updated successfully."
          : "Student added successfully."
      );

      setShowForm(false);
      setEditingStudent(null);

      await loadStudents();
    } catch (err) {
      console.error(
        "Student save error:",
        err
      );

      setError(
        err?.message ||
          "Unable to save student."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDelete(student) {
    const confirmed =
      window.confirm(
        `Remove ${student.name} from the student records?`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

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

            body:
              JSON.stringify({
                resource:
                  "students",

                id:
                  student.id,
              }),
          }
        );

      let result;

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          "Invalid response from server."
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Could not remove student."
        );
      }

      setSuccess(
        "Student removed successfully."
      );

      await loadStudents();
    } catch (err) {
      console.error(
        "Student delete error:",
        err
      );

      setError(
        err?.message ||
          "Unable to remove student."
      );
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AppShell
      role="admin"
      title="Students"
      subtitle="Student management"
    >
      <div className="dashboard-page admin-dashboard-page">

        {/* HEADER */}

        <section className="admin-welcome">
          <div>
            <span>
              ADMINISTRATION • STUDENTS
            </span>

            <h2>
              Student Management
            </h2>

            <p>
              Add, view and manage
              approved students in
              the UTKARSH academic
              workspace.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-retry-button"
            onClick={openAddForm}
          >
            <UserPlus size={17} />
            Add Student
          </button>
        </section>

        {/* ERROR */}

        {error && (
          <div
            className="status-banner"
            role="alert"
            style={{
              marginBottom: 16,
            }}
          >
            <span>
              <AlertCircle size={21} />
            </span>

            <div>
              <small>
                STUDENT MANAGEMENT
              </small>

              <b>{error}</b>
            </div>

            <button
              type="button"
              onClick={loadStudents}
              className="dashboard-retry-button"
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "dashboard-spin"
                    : ""
                }
              />

              Retry
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div
            className="status-banner"
            style={{
              marginBottom: 16,
            }}
          >
            <span>
              <CheckCircle2 size={21} />
            </span>

            <div>
              <small>
                SUCCESS
              </small>

              <b>{success}</b>
            </div>

            <Status tone="green">
              Completed
            </Status>
          </div>
        )}

        {/* STATS */}

        <div className="stats-grid">

          <div className="panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span className="activity-dot blue">
                <Users size={18} />
              </span>

              <div>
                <small>
                  TOTAL STUDENTS
                </small>

                <h3
                  style={{
                    margin:
                      "4px 0 0",
                  }}
                >
                  {loading
                    ? "…"
                    : students.length}
                </h3>
              </div>
            </div>
          </div>

          <div className="panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span className="activity-dot green">
                <CheckCircle2 size={18} />
              </span>

              <div>
                <small>
                  APPROVED
                </small>

                <h3
                  style={{
                    margin:
                      "4px 0 0",
                  }}
                >
                  {loading
                    ? "…"
                    : students.length}
                </h3>
              </div>
            </div>
          </div>

          <div className="panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span className="activity-dot violet">
                <ShieldCheck size={18} />
              </span>

              <div>
                <small>
                  ACCESS
                </small>

                <h3
                  style={{
                    margin:
                      "4px 0 0",
                  }}
                >
                  Student Login
                </h3>
              </div>
            </div>
          </div>

        </div>

        {/* STUDENT RECORDS */}

        <section className="panel">

          <div className="panel-title">

            <div>
              <span>
                STUDENT RECORDS
              </span>

              <h3>
                All Students
              </h3>
            </div>

            <button
              type="button"
              className="dashboard-retry-button"
              onClick={loadStudents}
              disabled={loading}
            >
              <RefreshCw
                size={15}
                className={
                  loading
                    ? "dashboard-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>

          {/* SEARCH */}

          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 18,
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex: 1,
                position: "relative",
              }}
            >
              <Search
                size={17}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  opacity: 0.55,
                }}
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, roll number or phone..."
                style={{
                  width: "100%",
                  padding:
                    "13px 15px 13px 42px",
                  borderRadius: 14,
                  border:
                    "1px solid rgba(15,23,42,.12)",
                  outline: "none",
                  background:
                    "rgba(255,255,255,.8)",
                }}
              />
            </div>

            <button
              type="button"
              className="dashboard-retry-button"
              onClick={openAddForm}
            >
              <Plus size={17} />
              Add Student
            </button>
          </div>

          {/* LIST */}

          {loading ? (
            <div className="dashboard-empty-state">
              <Loader2
                size={20}
                className="dashboard-spin"
              />

              <span>
                Loading student
                records...
              </span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="dashboard-empty-state">

              <Users size={24} />

              <span>
                {search
                  ? "No students match your search."
                  : "No students have been added yet."}
              </span>

              {!search && (
                <button
                  type="button"
                  className="dashboard-retry-button"
                  onClick={openAddForm}
                >
                  <Plus size={16} />
                  Add First Student
                </button>
              )}

            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: 650,
                }}
              >
                <thead>
                  <tr>

                    <th
                      style={{
                        textAlign: "left",
                        padding:
                          "13px 10px",
                      }}
                    >
                      Student
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding:
                          "13px 10px",
                      }}
                    >
                      Roll No.
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding:
                          "13px 10px",
                      }}
                    >
                      Phone
                    </th>

                    <th
                      style={{
                        textAlign: "left",
                        padding:
                          "13px 10px",
                      }}
                    >
                      Status
                    </th>

                    <th
                      style={{
                        textAlign: "right",
                        padding:
                          "13px 10px",
                      }}
                    >
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={
                          student.id ||
                          `${student.rollNo}-${student.phone}`
                        }
                        style={{
                          borderTop:
                            "1px solid rgba(15,23,42,.08)",
                        }}
                      >

                        <td
                          style={{
                            padding:
                              "15px 10px",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 10,
                            }}
                          >
                            <span className="activity-dot blue">
                              <Users size={15} />
                            </span>

                            <div>
                              <b>
                                {
                                  student.name
                                }
                              </b>

                              <small
                                style={{
                                  display:
                                    "block",
                                  opacity:
                                    0.6,
                                  marginTop: 3,
                                }}
                              >
                                Student
                              </small>
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 10px",
                          }}
                        >
                          {student.rollNo ||
                            "—"}
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 10px",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              gap: 6,
                            }}
                          >
                            <Phone size={14} />

                            {student.phone ||
                              "—"}
                          </span>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 10px",
                          }}
                        >
                          <Status tone="green">
                            Approved
                          </Status>
                        </td>

                        <td
                          style={{
                            padding:
                              "15px 10px",
                            textAlign:
                              "right",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "inline-flex",
                              gap: 7,
                            }}
                          >

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  student
                                )
                              }
                              aria-label="Edit student"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius:
                                  10,
                                border:
                                  "1px solid rgba(15,23,42,.1)",
                                background:
                                  "white",
                                cursor:
                                  "pointer",
                              }}
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  student
                                )
                              }
                              aria-label="Delete student"
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius:
                                  10,
                                border:
                                  "1px solid rgba(239,68,68,.16)",
                                background:
                                  "rgba(239,68,68,.06)",
                                color:
                                  "#dc2626",
                                cursor:
                                  "pointer",
                              }}
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>
            </div>
          )}

        </section>

        {/* ADD / EDIT MODAL */}

        {showForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              background:
                "rgba(2,6,23,.55)",
              backdropFilter:
                "blur(10px)",
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              style={{
                width:
                  "min(620px, 100%)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "white",
                borderRadius: 24,
                padding: 26,
                boxShadow:
                  "0 30px 80px rgba(0,0,0,.25)",
              }}
            >

              {/* MODAL HEADER */}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 15,
                  marginBottom: 22,
                }}
              >
                <div>

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing:
                        ".12em",
                      opacity: 0.6,
                    }}
                  >
                    {editingStudent
                      ? "EDIT STUDENT"
                      : "NEW STUDENT"}
                  </span>

                  <h3
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 24,
                    }}
                  >
                    {editingStudent
                      ? "Update student"
                      : "Add student"}
                  </h3>

                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border:
                      "1px solid rgba(15,23,42,.1)",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>

              </div>

              {/* FORM */}

              <form onSubmit={handleSubmit}>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: 16,
                  }}
                >

                  {/* NAME */}

                  <label>
                    <span
                      style={{
                        display:
                          "block",
                        marginBottom: 7,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Student Name
                    </span>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateForm(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Enter full name"
                      required
                      style={{
                        width: "100%",
                        padding:
                          "12px 13px",
                        borderRadius: 12,
                        border:
                          "1px solid rgba(15,23,42,.13)",
                        outline: "none",
                      }}
                    />
                  </label>

                  {/* PHONE */}

                  <label>
                    <span
                      style={{
                        display:
                          "block",
                        marginBottom: 7,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Mobile Number
                    </span>

                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateForm(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      style={{
                        width: "100%",
                        padding:
                          "12px 13px",
                        borderRadius: 12,
                        border:
                          "1px solid rgba(15,23,42,.13)",
                        outline: "none",
                      }}
                    />
                  </label>

                  {/* ROLL NUMBER */}

                  <label
                    style={{
                      gridColumn:
                        "1 / -1",
                    }}
                  >
                    <span
                      style={{
                        display:
                          "block",
                        marginBottom: 7,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Roll Number
                    </span>

                    <input
                      value={form.roll_no}
                      onChange={(event) =>
                        updateForm(
                          "roll_no",
                          event.target.value
                        )
                      }
                      placeholder="Example: 127251600181"
                      required
                      style={{
                        width: "100%",
                        padding:
                          "12px 13px",
                        borderRadius: 12,
                        border:
                          "1px solid rgba(15,23,42,.13)",
                        outline: "none",
                      }}
                    />
                  </label>

                </div>

                {/* FORM ERROR */}

                {error && (
                  <div
                    style={{
                      marginTop: 16,
                      padding:
                        "11px 13px",
                      borderRadius: 12,
                      background:
                        "rgba(239,68,68,.07)",
                      color: "#b91c1c",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* ACTIONS */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "flex-end",
                    gap: 10,
                    marginTop: 22,
                  }}
                >

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    style={{
                      padding:
                        "12px 18px",
                      borderRadius: 12,
                      border:
                        "1px solid rgba(15,23,42,.12)",
                      background: "white",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      gap: 8,
                      padding:
                        "12px 19px",
                      borderRadius: 12,
                      border: "none",
                      background:
                        "#111827",
                      color: "white",
                      cursor:
                        saving
                          ? "wait"
                          : "pointer",
                      fontWeight: 800,
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={16}
                          className="dashboard-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={16}
                        />

                        {editingStudent
                          ? "Update Student"
                          : "Add Student"}
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}