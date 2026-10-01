"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { EmptyState, PageHeader } from "@/components/ui";

const GROUPS = ["CX", "CY"];

const EMPTY_SUBJECT = {
  subject_code: "",
  subject_name: "",
};

const EMPTY_ASSIGNMENT = {
  title: "",
  due_date: "",
  instructions: "",
};

function formatDate(value) {
  if (!value) return "Deadline not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || "Request failed.");
  }
  return result;
}

export default function AdminAssignmentsWorkspace() {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT);
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT);

  /* =======================================================
     LOAD DATABASE DATA
  ======================================================= */

  async function loadWorkspace() {
    setLoading(true);
    setError("");

    try {
      const [subjectResponse, assignmentResponse] = await Promise.all([
        fetch("/api/assignments?view=subjects", {
          cache: "no-store",
          credentials: "same-origin",
        }),
        fetch("/api/assignments?view=admin", {
          cache: "no-store",
          credentials: "same-origin",
        }),
      ]);

      const [subjectResult, assignmentResult] = await Promise.all([
        readResponse(subjectResponse),
        readResponse(assignmentResponse),
      ]);

      setSubjects(
        Array.isArray(subjectResult.data) ? subjectResult.data : []
      );
      setAssignments(
        Array.isArray(assignmentResult.data)
          ? assignmentResult.data
          : []
      );
    } catch (err) {
      console.error("LOAD ASSIGNMENTS WORKSPACE:", err);
      setError(err?.message || "Could not load assignment data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  /* =======================================================
     FILTERED SUBJECTS
  ======================================================= */

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return subjects;

    return subjects.filter((subject) =>
      `${subject.subject_code || ""} ${subject.subject_name || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [subjects, search]);

  const currentAssignments = useMemo(() => {
    if (!selectedGroup || !selectedSubject) return [];

    const query = search.trim().toLowerCase();

    return assignments.filter((item) => {
      const matchesGroup =
        String(item.section || "").toUpperCase() === selectedGroup;
      const matchesSubject =
        item.subject_id === selectedSubject.id;
      const matchesSearch =
        !query || JSON.stringify(item).toLowerCase().includes(query);

      return matchesGroup && matchesSubject && matchesSearch;
    });
  }, [assignments, selectedGroup, selectedSubject, search]);

  function countGroup(group) {
    return assignments.filter(
      (item) => String(item.section || "").toUpperCase() === group
    ).length;
  }

  function countSubject(group, subjectId) {
    return assignments.filter(
      (item) =>
        String(item.section || "").toUpperCase() === group &&
        item.subject_id === subjectId
    ).length;
  }

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function openGroup(group) {
    setSelectedGroup(group);
    setSelectedSubject(null);
    setSearch("");
    setError("");
    setNotice("");
  }

  function openSubject(subject) {
    setSelectedSubject(subject);
    setSearch("");
    setError("");
    setNotice("");
  }

  function backToGroups() {
    setSelectedGroup("");
    setSelectedSubject(null);
    setSearch("");
    setError("");
    setNotice("");
  }

  function backToSubjects() {
    setSelectedSubject(null);
    setSearch("");
    setError("");
    setNotice("");
  }

  /* =======================================================
     CREATE SUBJECT FOLDER
  ======================================================= */

  async function createSubject(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await readResponse(
        await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            action: "create-subject",
            subject_code: subjectForm.subject_code.trim(),
            subject_name: subjectForm.subject_name.trim(),
          }),
        })
      );

      setSubjectForm(EMPTY_SUBJECT);
      setShowSubjectModal(false);
      setNotice("Subject folder created.");
      await loadWorkspace();

      // Keep the successful-save message visible after the reload.
      setNotice(result.message || "Subject folder created.");
    } catch (err) {
      console.error("CREATE SUBJECT:", err);
      setError(err?.message || "Could not create subject.");
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CREATE ASSIGNMENT AND VERIFY IT APPEARS
  ======================================================= */

  async function createAssignment(event) {
    event.preventDefault();

    if (!selectedGroup || !selectedSubject?.id) {
      setError("Select a group and subject first.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await readResponse(
        await fetch("/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            action: "create-assignment",
            title: assignmentForm.title.trim(),
            subject_id: selectedSubject.id,
            section: selectedGroup,
            due_date: assignmentForm.due_date,
            instructions: assignmentForm.instructions.trim(),
            status: "published",
          }),
        })
      );

      setAssignmentForm(EMPTY_ASSIGNMENT);
      setShowAssignmentModal(false);

      // Reload from Supabase after the insert succeeds.
      await loadWorkspace();

      setNotice(
        result.message ||
          `Assignment saved under ${selectedGroup}.`
      );
    } catch (err) {
      console.error("SAVE ASSIGNMENT:", err);
      setError(err?.message || "Could not save assignment.");
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE ASSIGNMENT
  ======================================================= */

  async function deleteAssignment(id) {
    if (!id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );
    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      const result = await readResponse(
        await fetch("/api/assignments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ id }),
        })
      );

      await loadWorkspace();
      setNotice(result.message || "Assignment deleted.");
    } catch (err) {
      console.error("DELETE ASSIGNMENT:", err);
      setError(err?.message || "Could not delete assignment.");
    }
  }

  /* =======================================================
     PAGE HEADING
  ======================================================= */

  const heading = !selectedGroup
    ? "Assignments"
    : !selectedSubject
      ? `${selectedGroup} Assignments`
      : selectedSubject.subject_code || "Assignments";

  const description = !selectedGroup
    ? "Organize assignments into CX and CY folders."
    : !selectedSubject
      ? `Manage ${selectedGroup} assignments by subject.`
      : `${selectedSubject.subject_name} · ${selectedGroup}`;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AppShell role="admin" title="Assignments" subtitle="Administration">
      <div className="page-wrap">
        <PageHeader
          eyebrow="ADMIN CONTROL CENTER"
          title={heading}
          description={description}
          action={
            !selectedGroup
              ? () => setShowSubjectModal(true)
              : selectedSubject
                ? () => {
                    setAssignmentForm(EMPTY_ASSIGNMENT);
                    setShowAssignmentModal(true);
                  }
                : undefined
          }
          actionLabel={
            !selectedGroup
              ? "Create Subject"
              : selectedSubject
                ? "Add Assignment"
                : undefined
          }
        />

        {error && (
          <div className="status-banner" style={{ marginBottom: 16 }}>
            <div>
              <small>ERROR</small>
              <b>{error}</b>
            </div>
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              border: "1px solid #b8dec3",
              borderRadius: 13,
              background: "#f2fbf4",
              color: "#24613a",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {notice}
          </div>
        )}

        {/* GROUP FOLDERS */}
        {!selectedGroup && (
          <>
            <div style={toolbarStyle}>
              <div style={{ color: "#68776e", fontSize: 13 }}>
                Select a group to manage its assignment folders.
              </div>
              <button
                type="button"
                className="soft-button"
                onClick={loadWorkspace}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "dashboard-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="skeleton-grid">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            ) : (
              <div className="assignment-group-grid">
                {GROUPS.map((group) => (
                  <button
                    type="button"
                    key={group}
                    className="assignment-group-card"
                    onClick={() => openGroup(group)}
                  >
                    <div className="assignment-tricolour" />
                    <div className="assignment-group-icon">
                      <Users size={26} />
                    </div>
                    <span className="assignment-kicker">GROUP FOLDER</span>
                    <h2>{group}</h2>
                    <p>Manage {group} assignments subject-wise.</p>
                    <div className="assignment-card-foot">
                      <span>
                        {countGroup(group)} assignments
                      </span>
                      <FolderOpen size={16} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* SUBJECT FOLDERS INSIDE CX OR CY */}
        {selectedGroup && !selectedSubject && (
          <>
            <div className="subject-workspace-header">
              <button
                type="button"
                className="soft-button"
                onClick={backToGroups}
              >
                <ArrowLeft size={17} />
                Back to Groups
              </button>

              <div className="subject-workspace-title">
                <div className="subject-folder-large">
                  <FolderOpen size={25} />
                </div>
                <div>
                  <span>{selectedGroup} ASSIGNMENTS</span>
                  <h2>Subject Folders</h2>
                  <p>Choose a subject to view or add assignments.</p>
                </div>
              </div>
            </div>

            <div className="resource-toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${selectedGroup} subjects...`}
                />
              </div>

              <button
                type="button"
                className="soft-button"
                onClick={loadWorkspace}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "dashboard-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="skeleton-grid">
                {[1, 2, 3].map((n) => (
                  <div className="skeleton-card" key={n} />
                ))}
              </div>
            ) : filteredSubjects.length === 0 ? (
              <EmptyState
                title="No subject folders"
                description="Create a subject folder first."
              />
            ) : (
              <div className="subject-folder-grid">
                {filteredSubjects.map((subject) => (
                  <button
                    type="button"
                    className="subject-folder-card"
                    key={subject.id}
                    onClick={() => openSubject(subject)}
                  >
                    <div className="subject-folder-card-icon">
                      <Folder size={24} />
                    </div>
                    <div>
                      <span>{subject.subject_code}</span>
                      <h3>{subject.subject_name}</h3>
                    </div>
                    <div className="assignment-card-foot">
                      <span>
                        {countSubject(selectedGroup, subject.id)} assignments
                      </span>
                      <FolderOpen size={15} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ASSIGNMENTS INSIDE A SUBJECT */}
        {selectedGroup && selectedSubject && (
          <>
            <div className="subject-workspace-header">
              <button
                type="button"
                className="soft-button"
                onClick={backToSubjects}
              >
                <ArrowLeft size={17} />
                Back to {selectedGroup}
              </button>

              <div className="subject-workspace-title">
                <div className="subject-folder-large">
                  <FolderOpen size={25} />
                </div>
                <div>
                  <span>{selectedGroup} · SUBJECT</span>
                  <h2>{selectedSubject.subject_name}</h2>
                  <p>{selectedSubject.subject_code}</p>
                </div>
              </div>
            </div>

            <div className="resource-toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search assignments..."
                />
              </div>
              <button
                type="button"
                className="soft-button"
                onClick={loadWorkspace}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "dashboard-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="skeleton-grid">
                {[1, 2, 3].map((n) => (
                  <div className="skeleton-card" key={n} />
                ))}
              </div>
            ) : currentAssignments.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                description={`Add the first ${selectedGroup} assignment for this subject.`}
              />
            ) : (
              <div className="resource-grid">
                {currentAssignments.map((item) => (
                  <article className="resource-card" key={item.id}>
                    <div className="resource-card-top">
                      <div className="resource-icon">
                        <ClipboardCheck size={22} />
                      </div>
                      <span className="status-badge">
                        {item.status || "Published"}
                      </span>
                    </div>

                    <h3>{item.title}</h3>

                    <div className="assignment-deadline">
                      <CalendarDays size={15} />
                      Deadline: {formatDate(item.due_date)}
                    </div>

                    <p className="assignment-instructions">
                      {item.instructions || "No instructions provided."}
                    </p>

                    <button
                      type="button"
                      className="soft-button assignment-delete"
                      onClick={() => deleteAssignment(item.id)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE SUBJECT MODAL */}
      {showSubjectModal && (
        <div
          className="assignment-modal-backdrop"
          onMouseDown={() => !saving && setShowSubjectModal(false)}
        >
          <form
            className="assignment-modal"
            onSubmit={createSubject}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="assignment-modal-header">
              <div>
                <span>CREATE SUBJECT</span>
                <h2>New Subject Folder</h2>
              </div>
              <button
                type="button"
                className="assignment-close"
                onClick={() => setShowSubjectModal(false)}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="assignment-form-fields">
              <div className="assignment-field">
                <label htmlFor="subject-code">Subject Code</label>
                <input
                  id="subject-code"
                  value={subjectForm.subject_code}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({
                      ...prev,
                      subject_code: event.target.value,
                    }))
                  }
                  placeholder="e.g. IT392"
                  required
                />
              </div>

              <div className="assignment-field">
                <label htmlFor="subject-name">Subject Name</label>
                <input
                  id="subject-name"
                  value={subjectForm.subject_name}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({
                      ...prev,
                      subject_name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Python Programming"
                  required
                />
              </div>
            </div>

            <div className="assignment-modal-actions">
              <button
                type="button"
                className="soft-button"
                onClick={() => setShowSubjectModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Create Subject"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showAssignmentModal && selectedGroup && selectedSubject && (
        <div
          className="assignment-modal-backdrop"
          onMouseDown={() =>
            !saving && setShowAssignmentModal(false)
          }
        >
          <form
            className="assignment-modal"
            onSubmit={createAssignment}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="assignment-modal-header">
              <div>
                <span>ADD ASSIGNMENT · {selectedGroup}</span>
                <h2>{selectedSubject.subject_name}</h2>
                <p>
                  Group: <strong>{selectedGroup}</strong>
                </p>
              </div>
              <button
                type="button"
                className="assignment-close"
                onClick={() => setShowAssignmentModal(false)}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="assignment-form-fields">
              <div className="assignment-field">
                <label htmlFor="assignment-title">Assignment Title</label>
                <input
                  id="assignment-title"
                  value={assignmentForm.title}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div className="assignment-field">
                <label htmlFor="assignment-deadline">Deadline</label>
                <input
                  id="assignment-deadline"
                  type="date"
                  value={assignmentForm.due_date}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      due_date: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="assignment-field">
                <label htmlFor="assignment-instructions">
                  Instructions / What to Write
                </label>
                <textarea
                  id="assignment-instructions"
                  rows={6}
                  value={assignmentForm.instructions}
                  onChange={(event) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      instructions: event.target.value,
                    }))
                  }
                  placeholder="Write assignment questions, instructions and submission details..."
                  required
                />
              </div>
            </div>

            <div className="assignment-modal-actions">
              <button
                type="button"
                className="soft-button"
                onClick={() => setShowAssignmentModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="dashboard-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={16} />
                    Publish {selectedGroup} Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}

const toolbarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 22,
  flexWrap: "wrap",
};