"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  FolderOpen,
  RefreshCw,
  Search,
  X,
  Clock3,
  FileText,
  BookOpen,
  Sparkles,
  Layers3,
} from "lucide-react";

import AppShell from "@/components/AppShell";

/* =========================================================
   CONFIGURATION
========================================================= */

const GROUPS = ["CX", "CY"];

/* =========================================================
   DATA HELPERS
========================================================= */

function uniqueAssignments(items) {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter(
    (item, index) => {
      const key =
        item?.id ||
        [
          item?.title,
          item?.subject,
          item?.subject_code,
          item?.section,
          item?.due_date,
          index,
        ]
          .filter(Boolean)
          .join("|");

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    }
  );
}

function formatDate(value) {
  if (!value) return "Deadline not set";

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

function getAssignmentSection(item) {
  const value = String(
    item?.section ||
      item?.group_code ||
      ""
  )
    .trim()
    .toUpperCase();

  if (value === "CX" || value === "CY") {
    return value;
  }

  return "GENERAL";
}

function getSubjectName(item) {
  return (
    item?.subject_name ||
    item?.subjects?.subject_name ||
    item?.subject ||
    item?.name ||
    "General Subject"
  );
}

function getSubjectCode(item) {
  return (
    item?.subject_code ||
    item?.subjects?.subject_code ||
    item?.code ||
    ""
  );
}

function getSubjectKey(item) {
  return (
    item?.subject_id ||
    item?.subjects?.id ||
    `${getSubjectCode(item)}::${getSubjectName(item)}`
  );
}

function getInstructions(item) {
  return (
    item?.instructions ||
    item?.description ||
    "No additional instructions have been provided."
  );
}

function isOverdue(value) {
  if (!value) return false;

  const due = new Date(value);

  if (Number.isNaN(due.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return due < today;
}

function getAssignmentTitle(item) {
  return item?.title || "Untitled Assignment";
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AssignmentsResourcePage() {
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState(null);

  /* =======================================================
     LOAD ASSIGNMENTS
  ======================================================= */

  const loadAssignments = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/assignments?view=student",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json().catch(
          () => null
        );

        if (!response.ok) {
          throw new Error(
            result?.message ||
              "Failed to load assignments."
          );
        }

        if (result?.success === false) {
          throw new Error(
            result?.message ||
              "Failed to load assignments."
          );
        }

        const rows =
          result?.data ||
          result?.assignments ||
          [];

        setAssignments(
          uniqueAssignments(rows)
        );
      } catch (err) {
        console.error(
          "AssignmentsResourcePage:",
          err
        );

        setAssignments([]);

        setError(
          err?.message ||
            "Unable to load assignments."
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadAssignments({
        silent: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const filteredAssignments = useMemo(() => {
    if (!normalizedSearch) {
      return assignments;
    }

    return assignments.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [
    assignments,
    normalizedSearch,
  ]);

  /* =======================================================
     GROUP DATA
  ======================================================= */

  const groups = useMemo(() => {
    const result = {
      CX: [],
      CY: [],
      GENERAL: [],
    };

    filteredAssignments.forEach((item) => {
      const group =
        getAssignmentSection(item);

      if (!result[group]) {
        result[group] = [];
      }

      result[group].push(item);
    });

    Object.keys(result).forEach((key) => {
      result[key].sort((a, b) => {
        const first = a?.due_date
          ? new Date(a.due_date).getTime()
          : Number.MAX_SAFE_INTEGER;

        const second = b?.due_date
          ? new Date(b.due_date).getTime()
          : Number.MAX_SAFE_INTEGER;

        return first - second;
      });
    });

    return result;
  }, [filteredAssignments]);

  const currentGroupAssignments = useMemo(() => {
    if (!selectedGroup) return [];

    return groups[selectedGroup] || [];
  }, [groups, selectedGroup]);

  /* =======================================================
     SUBJECT FOLDERS
  ======================================================= */

  const subjectFolders = useMemo(() => {
    if (!selectedGroup) return [];

    const map = new Map();

    currentGroupAssignments.forEach((assignment) => {
      const key = String(
        getSubjectKey(assignment)
      );

      if (!map.has(key)) {
        map.set(key, {
          key,
          subject_id:
            assignment?.subject_id ||
            assignment?.subjects?.id ||
            null,
          code: getSubjectCode(assignment),
          name: getSubjectName(assignment),
          assignments: [],
        });
      }

      map
        .get(key)
        .assignments.push(assignment);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        `${a.code} ${a.name}`.localeCompare(
          `${b.code} ${b.name}`
        )
    );
  }, [
    selectedGroup,
    currentGroupAssignments,
  ]);

  /* =======================================================
     SUBJECT ASSIGNMENTS
  ======================================================= */

  const selectedSubjectAssignments =
    useMemo(() => {
      if (!selectedSubject) return [];

      return (
        selectedSubject.assignments || []
      ).filter((assignment) => {
        if (!normalizedSearch) {
          return true;
        }

        return JSON.stringify(assignment)
          .toLowerCase()
          .includes(normalizedSearch);
      });
    }, [
      selectedSubject,
      normalizedSearch,
    ]);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const resetNavigation = () => {
    setSelectedGroup(null);
    setSelectedSubject(null);
    setSelectedAssignment(null);
    setSearch("");
  };

  const openGroup = (group) => {
    setSelectedGroup(group);
    setSelectedSubject(null);
    setSelectedAssignment(null);
    setSearch("");
  };

  const openSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedAssignment(null);
    setSearch("");
  };

  const visibleGroups =
    groups.GENERAL.length > 0
      ? [...GROUPS, "GENERAL"]
      : GROUPS;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <AppShell
      role="student"
      title="Assignments"
      subtitle="Academic assignment workspace"
    >
      <div className="page-wrap assignments-premium">

        {/* ================================================
            PREMIUM PAGE HERO
        ================================================= */}

        <section className="ap-hero">
          <div className="ap-hero-content">
            <div className="ap-eyebrow">
              <span className="ap-eyebrow-dot" />
              ACADEMIC WORKSPACE
            </div>

            <h1>
              Assignments
              <span className="ap-title-mark">.</span>
            </h1>

            <p>
              Organise your academic tasks, explore
              subject-wise assignments, and stay
              informed about upcoming deadlines.
            </p>

            <div className="ap-hero-pills">
              <span>
                <ClipboardCheck size={14} />
                Assignment Hub
              </span>

              <span>
                <Layers3 size={14} />
                {assignments.length}{" "}
                {assignments.length === 1
                  ? "Assignment"
                  : "Assignments"}
              </span>

              <span>
                <Sparkles size={14} />
                Student Workspace
              </span>
            </div>
          </div>

          <div
            className="ap-hero-visual"
            aria-hidden="true"
          >
            <div className="ap-hero-orbit ap-orbit-a" />
            <div className="ap-hero-orbit ap-orbit-b" />
            <div className="ap-hero-orbit ap-orbit-c" />

            <div className="ap-hero-emblem">
              <div className="ap-emblem-ring">
                <ClipboardCheck size={38} />
              </div>
              <span>YOUR TASKS</span>
            </div>

            <div className="ap-floating-dot ap-dot-a" />
            <div className="ap-floating-dot ap-dot-b" />
            <div className="ap-floating-dot ap-dot-c" />
          </div>

          <div className="ap-hero-tricolour" />
        </section>

        {/* ================================================
            SEARCH + REFRESH
        ================================================= */}

        <section
          className="ap-toolbar"
          aria-label="Assignment controls"
        >
          <label className="ap-search">
            <Search
              size={18}
              aria-hidden="true"
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                selectedGroup
                  ? "Search assignments..."
                  : "Search your assignments..."
              }
              aria-label="Search assignments"
            />

            {search && (
              <button
                type="button"
                className="ap-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <button
            type="button"
            className="ap-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "ap-spin" : ""
              }
              aria-hidden="true"
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>
        </section>

        {/* ================================================
            GUIDANCE BANNER
        ================================================= */}

        <section className="ap-guidance">
          <div className="ap-guidance-icon">
            <BookOpen size={22} />
          </div>

          <div className="ap-guidance-copy">
            <span className="ap-mini-label">
              ASSIGNMENT GROUPS
            </span>

            <strong>
              CX and CY folders are available
              to all students.
            </strong>

            <p>
              Open a group, choose a subject, and
              view its published assignments.
            </p>
          </div>

          <div className="ap-guidance-badge">
            <span className="ap-guidance-badge-dot" />
            Organised by subject
          </div>
        </section>

        {/* ================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="ap-error"
            role="alert"
          >
            <div className="ap-error-icon">
              <RefreshCw size={17} />
            </div>

            <div className="ap-error-copy">
              <strong>
                Unable to load assignments
              </strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              className="ap-retry"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={
                  refreshing ? "ap-spin" : ""
                }
              />
              Try Again
            </button>
          </div>
        )}

        {/* ================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="ap-loading-grid">
            {[1, 2, 3, 4].map((item) => (
              <div
                className="ap-loading-card"
                key={item}
              >
                <div className="ap-loading-icon" />
                <span className="ap-loading-line line-one" />
                <span className="ap-loading-line line-two" />
                <span className="ap-loading-line line-three" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ============================================
                LEVEL 1 — GROUP FOLDERS
            ============================================ */}

            {!selectedGroup && (
              <>
                <div className="ap-breadcrumb">
                  <span className="ap-breadcrumb-current">
                    <FolderOpen size={15} />
                    Assignment Groups
                  </span>
                </div>

                <div className="ap-section-heading">
                  <div>
                    <span className="ap-section-kicker">
                      SELECT YOUR GROUP
                    </span>

                    <h2>
                      Explore assignments
                    </h2>

                    <p>
                      Choose your academic group to
                      continue to its subjects.
                    </p>
                  </div>

                  <div className="ap-heading-decoration">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className="ap-group-grid">
                  {visibleGroups.map((group) => {
                    const groupAssignments =
                      groups[group] || [];

                    const isGeneral =
                      group === "GENERAL";

                    return (
                      <button
                        type="button"
                        className={`ap-group-card ap-group-${group.toLowerCase()}`}
                        key={group}
                        onClick={() => openGroup(group)}
                      >
                        <span className="ap-card-top-accent" />

                        <div className="ap-group-card-head">
                          <div className="ap-group-icon">
                            <FolderOpen size={25} />
                          </div>

                          <span className="ap-group-open-icon">
                            <ArrowUpRight size={17} />
                          </span>
                        </div>

                        <div className="ap-group-copy">
                          <span className="ap-mini-label">
                            {isGeneral
                              ? "OTHER ASSIGNMENTS"
                              : "ACADEMIC GROUP"}
                          </span>

                          <h3>{group}</h3>

                          <p>
                            {isGeneral
                              ? "Assignments without a specific group."
                              : `Access ${group} assignments, organised by subject.`}
                          </p>
                        </div>

                        <div className="ap-group-footer">
                          <span className="ap-group-count">
                            <ClipboardCheck size={14} />
                            {groupAssignments.length}{" "}
                            {groupAssignments.length === 1
                              ? "assignment"
                              : "assignments"}
                          </span>

                          <span className="ap-group-cta">
                            Explore
                            <ArrowUpRight size={15} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ============================================
                LEVEL 2 — SUBJECT FOLDERS
            ============================================ */}

            {selectedGroup && !selectedSubject && (
              <>
                <nav
                  className="ap-breadcrumb"
                  aria-label="Breadcrumb"
                >
                  <button
                    type="button"
                    onClick={resetNavigation}
                  >
                    <ArrowLeft size={15} />
                    <span>Assignment Groups</span>
                  </button>

                  <span className="ap-breadcrumb-separator">
                    /
                  </span>

                  <span className="ap-breadcrumb-current">
                    {selectedGroup}
                  </span>
                </nav>

                <div className="ap-section-heading ap-level-heading">
                  <div>
                    <span className="ap-section-kicker">
                      {selectedGroup === "GENERAL"
                        ? "OTHER ASSIGNMENTS"
                        : `${selectedGroup} GROUP`}
                    </span>

                    <h2>
                      {selectedGroup} Subjects
                    </h2>

                    <p>
                      Select a subject folder to view
                      its assignment details.
                    </p>
                  </div>

                  <span className="ap-count-pill">
                    <ClipboardCheck size={14} />
                    {currentGroupAssignments.length}{" "}
                    {currentGroupAssignments.length === 1
                      ? "assignment"
                      : "assignments"}
                  </span>
                </div>

                {subjectFolders.length === 0 ? (
                  <div className="ap-empty">
                    <div className="ap-empty-icon">
                      <FolderOpen size={26} />
                    </div>

                    <h3>
                      {normalizedSearch
                        ? "No matching subjects"
                        : "No assignments yet"}
                    </h3>

                    <p>
                      {normalizedSearch
                        ? "Try another search term."
                        : "No published assignments are available in this group yet."}
                    </p>

                    {normalizedSearch && (
                      <button
                        type="button"
                        className="ap-empty-action"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="ap-subject-grid">
                    {subjectFolders.map(
                      (subject, index) => (
                        <button
                          type="button"
                          className={`ap-subject-card ap-subject-tone-${index % 3}`}
                          key={subject.key}
                          onClick={() =>
                            openSubject(subject)
                          }
                        >
                          <div className="ap-subject-top">
                            <div className="ap-subject-icon">
                              <FolderOpen size={23} />
                            </div>

                            <span className="ap-subject-arrow">
                              <ArrowUpRight size={17} />
                            </span>
                          </div>

                          <div className="ap-subject-copy">
                            <span className="ap-subject-code">
                              {subject.code || "SUBJECT"}
                            </span>

                            <h3>{subject.name}</h3>

                            <span className="ap-subject-material-count">
                              {subject.assignments.length}{" "}
                              {subject.assignments.length === 1
                                ? "assignment"
                                : "assignments"}
                            </span>
                          </div>

                          <div className="ap-subject-footer">
                            <span>Open subject</span>
                            <ArrowUpRight size={15} />
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
            )}

            {/* ============================================
                LEVEL 3 — ASSIGNMENT LIST
            ============================================ */}

            {selectedGroup && selectedSubject && (
              <>
                <nav
                  className="ap-breadcrumb"
                  aria-label="Breadcrumb"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openGroup(selectedGroup)
                    }
                  >
                    <ArrowLeft size={15} />
                    <span>{selectedGroup}</span>
                  </button>

                  <span className="ap-breadcrumb-separator">
                    /
                  </span>

                  <span className="ap-breadcrumb-current">
                    {selectedSubject.name}
                  </span>
                </nav>

                <div className="ap-section-heading ap-level-heading">
                  <div>
                    <span className="ap-section-kicker">
                      {selectedSubject.code || "SUBJECT"}
                    </span>

                    <h2>
                      {selectedSubject.name}
                    </h2>

                    <p>
                      Review assignment instructions
                      and submission deadlines.
                    </p>
                  </div>

                  <span className="ap-count-pill">
                    <ClipboardCheck size={14} />
                    {selectedSubjectAssignments.length}{" "}
                    {selectedSubjectAssignments.length === 1
                      ? "assignment"
                      : "assignments"}
                  </span>
                </div>

                {selectedSubjectAssignments.length === 0 ? (
                  <div className="ap-empty">
                    <div className="ap-empty-icon">
                      <ClipboardCheck size={26} />
                    </div>

                    <h3>No assignments found</h3>

                    <p>
                      {normalizedSearch
                        ? "Try another search term."
                        : "There are no published assignments in this subject yet."}
                    </p>

                    {normalizedSearch && (
                      <button
                        type="button"
                        className="ap-empty-action"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="ap-assignment-list">
                    {selectedSubjectAssignments.map(
                      (assignment, index) => {
                        const overdue = isOverdue(
                          assignment?.due_date
                        );

                        const assignmentTitle =
                          getAssignmentTitle(assignment);

                        const statusText = overdue
                          ? "Overdue"
                          : assignment?.status || "Published";

                        return (
                          <button
                            type="button"
                            className="ap-assignment-card"
                            key={
                              assignment?.id ||
                              `${assignmentTitle}-${index}`
                            }
                            onClick={() =>
                              setSelectedAssignment(
                                assignment
                              )
                            }
                            aria-label={`View assignment: ${assignmentTitle}`}
                          >
                            <div className="ap-assignment-file-icon">
                              <FileText size={22} />
                            </div>

                            <div className="ap-assignment-main">
                              <div className="ap-assignment-topline">
                                <span className="ap-assignment-code">
                                  {getSubjectCode(assignment) ||
                                    selectedSubject.code ||
                                    selectedGroup}
                                </span>

                                <span
                                  className={`ap-status ${
                                    overdue
                                      ? "ap-status-overdue"
                                      : "ap-status-published"
                                  }`}
                                >
                                  <span className="ap-status-dot" />
                                  {statusText}
                                </span>
                              </div>

                              <h3>
                                {assignmentTitle}
                              </h3>

                              <p>
                                {getInstructions(assignment)}
                              </p>

                              <div className="ap-assignment-bottom">
                                <span className="ap-due-date">
                                  <CalendarDays size={15} />

                                  <span>
                                    {assignment?.due_date
                                      ? `Due ${formatDate(
                                          assignment.due_date
                                        )}`
                                      : "No deadline"}
                                  </span>
                                </span>

                                <span className="ap-assignment-view">
                                  View details
                                  <ArrowUpRight size={16} />
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ================================================
            ASSIGNMENT DETAILS MODAL
        ================================================= */}

        {selectedAssignment && (
          <div
            className="ap-modal-backdrop"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                setSelectedAssignment(null);
              }
            }}
          >
            <section
              className="ap-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ap-modal-title"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="ap-modal-accent" />

              <div className="ap-modal-header">
                <div className="ap-modal-title-wrap">
                  <span className="ap-modal-kicker">
                    <ClipboardCheck size={14} />
                    ASSIGNMENT DETAILS
                  </span>

                  <h2 id="ap-modal-title">
                    {getAssignmentTitle(
                      selectedAssignment
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  className="ap-modal-x"
                  onClick={() =>
                    setSelectedAssignment(null)
                  }
                  aria-label="Close assignment details"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="ap-modal-info">
                <div className="ap-modal-info-item">
                  <span>Group</span>
                  <strong>
                    {getAssignmentSection(
                      selectedAssignment
                    )}
                  </strong>
                </div>

                <div className="ap-modal-info-item">
                  <span>Subject</span>
                  <strong>
                    {getSubjectCode(
                      selectedAssignment
                    ) ||
                      getSubjectName(
                        selectedAssignment
                      )}
                  </strong>
                </div>

                <div className="ap-modal-info-item">
                  <span>Deadline</span>
                  <strong>
                    {selectedAssignment?.due_date
                      ? formatDate(
                          selectedAssignment.due_date
                        )
                      : "Not set"}
                  </strong>
                </div>

                <div className="ap-modal-info-item">
                  <span>Status</span>
                  <strong>
                    {isOverdue(
                      selectedAssignment?.due_date
                    )
                      ? "Overdue"
                      : selectedAssignment?.status ||
                        "Published"}
                  </strong>
                </div>
              </div>

              <div className="ap-modal-instructions">
                <div className="ap-modal-instructions-title">
                  <Clock3 size={17} />
                  <h3>Instructions</h3>
                </div>

                <p>
                  {getInstructions(
                    selectedAssignment
                  )}
                </p>
              </div>

              <div className="ap-modal-actions">
                <button
                  type="button"
                  className="ap-modal-close"
                  onClick={() =>
                    setSelectedAssignment(null)
                  }
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ================================================
            ALL STYLES IN THIS JSX FILE
        ================================================= */}

        <style jsx>{`
          .assignments-premium {
            --ap-ink: #17251f;
            --ap-muted: #6c7971;
            --ap-border: #dfe8e1;
            --ap-green: #138808;
            --ap-green-dark: #0d6238;
            --ap-green-soft: #edf7ef;
            --ap-saffron: #f28b2d;
            --ap-blue: #284e88;
            min-width: 0;
            padding-bottom: 38px;
            color: var(--ap-ink);
          }

          .assignments-premium,
          .assignments-premium * {
            box-sizing: border-box;
          }

          /* =========================================
             HERO
          ========================================= */

          .ap-hero {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 270px;
            min-height: 252px;
            overflow: hidden;
            border: 1px solid rgba(17, 90, 51, .13);
            border-radius: 24px;
            background:
              radial-gradient(
                circle at 85% 15%,
                rgba(255, 153, 51, .13),
                transparent 25%
              ),
              radial-gradient(
                circle at 18% 110%,
                rgba(19, 136, 8, .06),
                transparent 30%
              ),
              #ffffff;
            box-shadow: 0 13px 34px rgba(19, 65, 38, .055);
          }

          .ap-hero-content {
            position: relative;
            z-index: 2;
            align-self: center;
            padding: 32px 38px;
          }

          .ap-eyebrow {
            display: flex;
            align-items: center;
            gap: 9px;
            color: #16813e;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: .15em;
          }

          .ap-eyebrow-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--ap-saffron);
            box-shadow: 0 0 0 4px rgba(242, 139, 45, .12);
          }

          .ap-hero h1 {
            margin: 15px 0 10px;
            color: var(--ap-ink);
            font-size: clamp(32px, 3vw, 43px);
            font-weight: 820;
            letter-spacing: -.055em;
            line-height: 1.08;
          }

          .ap-title-mark {
            color: var(--ap-saffron);
          }

          .ap-hero-content > p {
            max-width: 610px;
            margin: 0;
            color: var(--ap-muted);
            font-size: 13px;
            line-height: 1.75;
          }

          .ap-hero-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 20px;
          }

          .ap-hero-pills span {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 31px;
            padding: 0 11px;
            border: 1px solid #e2ebe3;
            border-radius: 999px;
            background: #f8fbf8;
            color: #53665a;
            font-size: 10px;
            font-weight: 750;
          }

          .ap-hero-pills span svg {
            color: var(--ap-green);
          }

          .ap-hero-visual {
            position: relative;
            min-height: 252px;
            overflow: hidden;
          }

          .ap-hero-orbit {
            position: absolute;
            border: 1px solid rgba(19, 136, 8, .12);
            border-radius: 50%;
          }

          .ap-orbit-a {
            top: -52px;
            right: -68px;
            width: 310px;
            height: 310px;
          }

          .ap-orbit-b {
            top: -13px;
            right: -30px;
            width: 232px;
            height: 232px;
            border-color: rgba(242, 139, 45, .20);
          }

          .ap-orbit-c {
            top: 25px;
            right: 9px;
            width: 155px;
            height: 155px;
            border-color: rgba(40, 78, 136, .16);
          }

          .ap-hero-emblem {
            position: absolute;
            top: 50%;
            right: 34px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 11px;
            width: 176px;
            height: 160px;
            border: 1px solid #e4ece5;
            border-radius: 21px;
            background: rgba(255, 255, 255, .86);
            box-shadow:
              0 18px 42px rgba(18, 68, 38, .09),
              inset 0 1px 0 rgba(255, 255, 255, .95);
            transform: translateY(-50%);
            backdrop-filter: blur(14px);
          }

          .ap-emblem-ring {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 67px;
            height: 67px;
            border: 1px solid #dce8de;
            border-radius: 20px;
            background: linear-gradient(145deg, #fff2e4, #f1f8f2);
            color: var(--ap-green);
            box-shadow: 0 8px 19px rgba(19, 136, 8, .07);
          }

          .ap-hero-emblem > span {
            color: #718077;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: .15em;
          }

          .ap-floating-dot {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .ap-dot-a {
            top: 27px;
            right: 72px;
            background: var(--ap-saffron);
            box-shadow: 0 0 0 6px rgba(242, 139, 45, .10);
          }

          .ap-dot-b {
            right: 217px;
            bottom: 36px;
            width: 8px;
            height: 8px;
            background: var(--ap-green);
            box-shadow: 0 0 0 5px rgba(19, 136, 8, .09);
          }

          .ap-dot-c {
            top: 70px;
            right: 15px;
            width: 6px;
            height: 6px;
            background: var(--ap-blue);
            box-shadow: 0 0 0 5px rgba(40, 78, 136, .08);
          }

          .ap-hero-tricolour {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(
              90deg,
              #ff9933 0%,
              #ffffff 50%,
              #138808 100%
            );
          }

          /* =========================================
             SHARED PREMIUM BUTTON FEEL
          ========================================= */

          .assignments-premium button {
            font-family: inherit;
          }

          .assignments-premium button:focus-visible {
            outline: 3px solid rgba(40, 78, 136, .32);
            outline-offset: 3px;
          }

          /* =========================================
             TOOLBAR
          ========================================= */

          .ap-toolbar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            min-width: 0;
            margin: 18px 0 17px;
            padding: 11px;
            border: 1px solid var(--ap-border);
            border-radius: 17px;
            background: #ffffff;
            box-shadow: 0 8px 24px rgba(20, 55, 34, .04);
          }

          .ap-search {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            min-height: 47px;
            padding: 0 13px;
            border: 1px solid #e1e9e2;
            border-radius: 12px;
            background: #f8faf8;
            color: #78867d;
            transition: border-color .18s ease, box-shadow .18s ease;
          }

          .ap-search:focus-within {
            border-color: #83b894;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(19, 136, 8, .08);
          }

          .ap-search > svg {
            flex: 0 0 auto;
            color: #75837a;
          }

          .ap-search input {
            flex: 1 1 auto;
            width: 100%;
            min-width: 0;
            height: 45px;
            padding: 0;
            border: 0;
            border-radius: 0;
            outline: none;
            appearance: none;
            background: transparent;
            color: var(--ap-ink);
            box-shadow: none;
            font: inherit;
            font-size: 13px;
          }

          .ap-search input::placeholder {
            color: #98a39b;
            opacity: 1;
          }

          .ap-search input::-webkit-search-cancel-button {
            display: none;
          }

          .ap-clear-search {
            display: inline-flex;
            flex: 0 0 28px;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: #edf4ee;
            color: #5d7063;
            cursor: pointer;
            transition: background .18s ease, color .18s ease;
          }

          .ap-clear-search:hover {
            background: #e0efe3;
            color: var(--ap-green-dark);
          }

          .ap-refresh {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            min-width: 115px;
            min-height: 47px;
            padding: 0 16px;
            border: 1px solid #cfe0d2;
            border-radius: 12px;
            background: #ffffff;
            color: #176d37;
            font-size: 12px;
            font-weight: 800;
            white-space: nowrap;
            cursor: pointer;
            transition:
              background .18s ease,
              border-color .18s ease,
              box-shadow .18s ease,
              transform .18s ease;
          }

          .ap-refresh svg {
            flex: 0 0 auto;
            color: var(--ap-green);
          }

          .ap-refresh:hover:not(:disabled) {
            transform: translateY(-1px);
            border-color: #a9cdb1;
            background: #f2f9f3;
            box-shadow: 0 8px 18px rgba(18, 91, 47, .08);
          }

          .ap-refresh:disabled {
            opacity: .65;
            cursor: wait;
          }

          .ap-spin {
            animation: ap-spin .85s linear infinite;
          }

          @keyframes ap-spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* =========================================
             GUIDANCE BANNER
          ========================================= */

          .ap-guidance {
            position: relative;
            display: flex;
            align-items: center;
            gap: 15px;
            min-width: 0;
            overflow: hidden;
            margin: 0 0 24px;
            padding: 17px 19px;
            border: 1px solid #dfe9e1;
            border-radius: 16px;
            background:
              linear-gradient(
                105deg,
                rgba(255, 153, 51, .055),
                transparent 40%,
                rgba(19, 136, 8, .045)
              ),
              #ffffff;
          }

          .ap-guidance::before {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 3px;
            content: "";
            background: linear-gradient(
              180deg,
              #ff9933,
              #ffffff 50%,
              #138808
            );
          }

          .ap-guidance-icon {
            display: flex;
            flex: 0 0 45px;
            align-items: center;
            justify-content: center;
            width: 45px;
            height: 45px;
            border: 1px solid #dce8de;
            border-radius: 13px;
            background: linear-gradient(145deg, #fff1e1, #edf7ef);
            color: var(--ap-green);
          }

          .ap-guidance-copy {
            flex: 1 1 auto;
            min-width: 0;
          }

          .ap-mini-label {
            display: block;
            color: #14823d;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: .14em;
          }

          .ap-guidance-copy strong {
            display: block;
            margin-top: 5px;
            color: var(--ap-ink);
            font-size: 13px;
            font-weight: 780;
            line-height: 1.5;
          }

          .ap-guidance-copy p {
            margin: 3px 0 0;
            color: var(--ap-muted);
            font-size: 11px;
            line-height: 1.55;
          }

          .ap-guidance-badge {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            gap: 7px;
            padding: 9px 11px;
            border: 1px solid #dce8de;
            border-radius: 999px;
            background: #f8fbf8;
            color: #5c7062;
            font-size: 10px;
            font-weight: 750;
            white-space: nowrap;
          }

          .ap-guidance-badge-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--ap-green);
            box-shadow: 0 0 0 4px rgba(19, 136, 8, .08);
          }

          /* =========================================
             ERROR
          ========================================= */

          .ap-error {
            display: flex;
            align-items: center;
            gap: 13px;
            justify-content: space-between;
            margin: 0 0 22px;
            padding: 14px 16px;
            border: 1px solid #f0d8c3;
            border-radius: 14px;
            background: #fff8f2;
          }

          .ap-error-icon {
            display: flex;
            flex: 0 0 36px;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: 1px solid #f0d8c3;
            border-radius: 11px;
            background: #ffffff;
            color: #a05c2e;
          }

          .ap-error-copy {
            flex: 1 1 auto;
            min-width: 0;
          }

          .ap-error-copy strong,
          .ap-error-copy span {
            display: block;
          }

          .ap-error-copy strong {
            color: #99501f;
            font-size: 12px;
          }

          .ap-error-copy span {
            margin-top: 4px;
            color: #846e5e;
            font-size: 11px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .ap-retry {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 37px;
            padding: 0 12px;
            border: 1px solid #ead3bf;
            border-radius: 10px;
            background: #ffffff;
            color: #8b4d26;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: background .18s ease, border-color .18s ease;
          }

          .ap-retry:hover:not(:disabled) {
            border-color: #d9b89b;
            background: #fffdfb;
          }

          .ap-retry:disabled {
            opacity: .6;
            cursor: wait;
          }

          /* =========================================
             BREADCRUMB
          ========================================= */

          .ap-breadcrumb {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 9px;
            min-height: 34px;
            margin: 0 0 20px;
            color: #8a978e;
            font-size: 11px;
          }

          .ap-breadcrumb button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 33px;
            padding: 0 11px;
            border: 1px solid #dfe8e1;
            border-radius: 9px;
            background: #ffffff;
            color: #5b6e61;
            font-size: 11px;
            font-weight: 750;
            cursor: pointer;
            transition: background .18s ease, border-color .18s ease, color .18s ease;
          }

          .ap-breadcrumb button:hover {
            border-color: #b7d4bd;
            background: #f2f8f3;
            color: var(--ap-green-dark);
          }

          .ap-breadcrumb-current {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-width: 0;
            color: var(--ap-green-dark);
            font-weight: 800;
            overflow-wrap: anywhere;
          }

          .ap-breadcrumb-separator {
            color: #b0bbb3;
          }

          /* =========================================
             SECTION HEADINGS
          ========================================= */

          .ap-section-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin: 0 0 17px;
          }

          .ap-section-kicker {
            display: block;
            color: #8a978e;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: .15em;
          }

          .ap-section-heading h2 {
            margin: 5px 0 4px;
            color: var(--ap-ink);
            font-size: clamp(20px, 2vw, 24px);
            font-weight: 820;
            letter-spacing: -.045em;
            line-height: 1.25;
          }

          .ap-section-heading p {
            margin: 0;
            color: var(--ap-muted);
            font-size: 11px;
            line-height: 1.6;
          }

          .ap-heading-decoration {
            display: flex;
            align-items: center;
            gap: 4px;
            padding-bottom: 5px;
          }

          .ap-heading-decoration span {
            display: block;
            width: 16px;
            height: 5px;
            border-radius: 999px;
          }

          .ap-heading-decoration span:nth-child(1) {
            background: #ff9933;
          }

          .ap-heading-decoration span:nth-child(2) {
            background: #f5f7f5;
            border: 1px solid #e4e9e5;
          }

          .ap-heading-decoration span:nth-child(3) {
            background: #138808;
          }

          .ap-level-heading {
            align-items: center;
          }

          .ap-count-pill {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 34px;
            padding: 0 12px;
            border: 1px solid #dce8de;
            border-radius: 999px;
            background: #f4faf5;
            color: #27713e;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          /* =========================================
             GROUP FOLDER CARDS
          ========================================= */

          .ap-group-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
            align-items: stretch;
            gap: 17px;
            min-width: 0;
          }

          .ap-group-card {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 268px;
            overflow: hidden;
            padding: 21px;
            border: 1px solid #dfe8e1;
            border-radius: 20px;
            background:
              radial-gradient(
                circle at 100% 0%,
                rgba(19, 136, 8, .055),
                transparent 30%
              ),
              #ffffff;
            color: var(--ap-ink);
            text-align: left;
            cursor: pointer;
            box-shadow: 0 9px 25px rgba(20, 55, 34, .04);
            transition:
              transform .22s ease,
              border-color .22s ease,
              box-shadow .22s ease;
          }

          .ap-group-card:hover {
            transform: translateY(-4px);
            border-color: #b9d3bf;
            box-shadow: 0 18px 38px rgba(20, 65, 36, .09);
          }

          .ap-card-top-accent {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff9933, #ffffff 50%, #138808);
          }

          .ap-group-cx .ap-group-icon {
            background: linear-gradient(145deg, #fff0df, #fff9f3);
            border-color: #f3dfcd;
            color: #d87925;
          }

          .ap-group-cy .ap-group-icon {
            background: linear-gradient(145deg, #eaf7ed, #f7fbf7);
            border-color: #d5e8d9;
            color: #138808;
          }

          .ap-group-general .ap-group-icon {
            background: linear-gradient(145deg, #eef3fb, #f8faff);
            border-color: #dbe5f3;
            color: #315d9d;
          }

          .ap-group-card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .ap-group-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 53px;
            height: 53px;
            border: 1px solid #dfe8e1;
            border-radius: 16px;
            transition: transform .2s ease;
          }

          .ap-group-card:hover .ap-group-icon {
            transform: translateY(-2px) scale(1.035);
          }

          .ap-group-open-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border: 1px solid #e2eae3;
            border-radius: 50%;
            background: #f8faf8;
            color: #6d7c72;
            transition: transform .2s ease, background .2s ease;
          }

          .ap-group-card:hover .ap-group-open-icon {
            transform: translate(2px, -2px);
            background: #eef7ef;
          }

          .ap-group-copy {
            min-width: 0;
            padding: 20px 0 20px;
          }

          .ap-group-copy .ap-mini-label {
            color: #8a978e;
          }

          .ap-group-copy h3 {
            margin: 5px 0 7px;
            color: var(--ap-ink);
            font-size: 27px;
            font-weight: 850;
            letter-spacing: -.045em;
            line-height: 1.2;
          }

          .ap-group-copy p {
            max-width: 330px;
            margin: 0;
            color: var(--ap-muted);
            font-size: 12px;
            line-height: 1.65;
          }

          .ap-group-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: auto;
            padding-top: 14px;
            border-top: 1px solid #edf1ee;
          }

          .ap-group-count {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-width: 0;
            color: #78867d;
            font-size: 10px;
            font-weight: 700;
          }

          .ap-group-count svg {
            flex: 0 0 auto;
            color: var(--ap-green);
          }

          .ap-group-cta {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            gap: 6px;
            color: #18713a;
            font-size: 10px;
            font-weight: 850;
          }

          /* =========================================
             SUBJECT CARDS
          ========================================= */

          .ap-subject-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
            align-items: stretch;
            gap: 15px;
            min-width: 0;
          }

          .ap-subject-card {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 216px;
            overflow: hidden;
            padding: 18px;
            border: 1px solid #dfe8e1;
            border-radius: 18px;
            background: #ffffff;
            color: var(--ap-ink);
            text-align: left;
            cursor: pointer;
            box-shadow: 0 7px 20px rgba(20, 55, 34, .035);
            transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          }

          .ap-subject-card::before {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            height: 3px;
            content: "";
            background: linear-gradient(90deg, #ff9933, #ffffff 50%, #138808);
          }

          .ap-subject-card:hover {
            transform: translateY(-3px);
            border-color: #b9d3bf;
            box-shadow: 0 15px 31px rgba(20, 65, 36, .075);
          }

          .ap-subject-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .ap-subject-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border: 1px solid #dce8de;
            border-radius: 14px;
            background: linear-gradient(145deg, #fff2e5, #f0f8f1);
            color: var(--ap-green);
            transition: transform .2s ease;
          }

          .ap-subject-card:hover .ap-subject-icon {
            transform: translateY(-2px);
          }

          .ap-subject-tone-1 .ap-subject-icon {
            background: linear-gradient(145deg, #fff2e7, #fffaf5);
            border-color: #f2dfce;
            color: #d87925;
          }

          .ap-subject-tone-2 .ap-subject-icon {
            background: linear-gradient(145deg, #eef3fb, #f9fbff);
            border-color: #dce5f1;
            color: #315d9d;
          }

          .ap-subject-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: 1px solid #e1e9e2;
            border-radius: 50%;
            background: #f7faf7;
            color: #6e7d73;
          }

          .ap-subject-copy {
            min-width: 0;
            padding: 19px 0 17px;
          }

          .ap-subject-code {
            display: block;
            color: var(--ap-green);
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .12em;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .ap-subject-copy h3 {
            margin: 6px 0 8px;
            color: var(--ap-ink);
            font-size: 15px;
            font-weight: 800;
            line-height: 1.4;
            overflow-wrap: anywhere;
          }

          .ap-subject-material-count {
            display: inline-flex;
            align-items: center;
            min-height: 25px;
            padding: 0 9px;
            border: 1px solid #e1eae2;
            border-radius: 999px;
            background: #f7faf7;
            color: #65756a;
            font-size: 9px;
            font-weight: 750;
          }

          .ap-subject-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: auto;
            padding-top: 11px;
            border-top: 1px solid #edf1ee;
            color: #819087;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: .06em;
            text-transform: uppercase;
          }

          .ap-subject-footer svg {
            color: var(--ap-green);
          }

          /* =========================================
             ASSIGNMENT LIST CARDS
          ========================================= */

          .ap-assignment-list {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 13px;
            min-width: 0;
          }

          .ap-assignment-card {
            position: relative;
            display: flex;
            align-items: flex-start;
            gap: 16px;
            width: 100%;
            min-width: 0;
            padding: 19px;
            overflow: hidden;
            border: 1px solid #dfe8e1;
            border-radius: 18px;
            background: #ffffff;
            color: var(--ap-ink);
            text-align: left;
            cursor: pointer;
            box-shadow: 0 6px 21px rgba(20, 55, 34, .035);
            transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
          }

          .ap-assignment-card::before {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 3px;
            content: "";
            background: linear-gradient(180deg, #ff9933, #ffffff 50%, #138808);
            opacity: .9;
          }

          .ap-assignment-card:hover {
            transform: translateY(-2px);
            border-color: #b9d3bf;
            box-shadow: 0 15px 32px rgba(20, 65, 36, .075);
          }

          .ap-assignment-file-icon {
            display: flex;
            flex: 0 0 49px;
            align-items: center;
            justify-content: center;
            width: 49px;
            height: 49px;
            border: 1px solid #f1dfcf;
            border-radius: 14px;
            background: linear-gradient(145deg, #fff1e3, #fffaf5);
            color: #dc7b28;
          }

          .ap-assignment-main {
            flex: 1 1 auto;
            min-width: 0;
          }

          .ap-assignment-topline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            min-width: 0;
          }

          .ap-assignment-code {
            color: #17813d;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .12em;
            overflow-wrap: anywhere;
          }

          .ap-status {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            gap: 6px;
            min-height: 26px;
            padding: 0 9px;
            border: 1px solid transparent;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
          }

          .ap-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }

          .ap-status-published {
            border-color: #d2e5d6;
            background: #eff8f0;
            color: #19743a;
          }

          .ap-status-overdue {
            border-color: #f2d3c6;
            background: #fff2ed;
            color: #b44e2d;
          }

          .ap-assignment-main h3 {
            margin: 8px 0 7px;
            color: var(--ap-ink);
            font-size: 16px;
            font-weight: 800;
            line-height: 1.4;
            letter-spacing: -.025em;
            overflow-wrap: anywhere;
          }

          .ap-assignment-main > p {
            display: -webkit-box;
            max-width: 850px;
            margin: 0;
            overflow: hidden;
            color: var(--ap-muted);
            font-size: 11px;
            line-height: 1.7;
            overflow-wrap: anywhere;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }

          .ap-assignment-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
            padding-top: 12px;
            border-top: 1px solid #edf1ee;
          }

          .ap-due-date {
            display: inline-flex;
            flex: 1 1 160px;
            align-items: center;
            gap: 7px;
            min-width: 0;
            color: #77867c;
            font-size: 10px;
            font-weight: 700;
          }

          .ap-due-date svg {
            flex: 0 0 auto;
            color: #8a9a8f;
          }

          .ap-due-date span {
            overflow-wrap: anywhere;
          }

          .ap-assignment-view {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            color: #17723b;
            font-size: 10px;
            font-weight: 850;
            white-space: nowrap;
            transition: gap .18s ease;
          }

          .ap-assignment-card:hover .ap-assignment-view {
            gap: 10px;
          }

          /* =========================================
             EMPTY STATE
          ========================================= */

          .ap-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 260px;
            padding: 28px 20px;
            border: 1px dashed #d3dfd5;
            border-radius: 19px;
            background:
              radial-gradient(circle at 50% 0%, rgba(19, 136, 8, .035), transparent 55%),
              #ffffff;
            text-align: center;
          }

          .ap-empty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 59px;
            height: 59px;
            border: 1px solid #dce8de;
            border-radius: 17px;
            background: linear-gradient(145deg, #fff2e4, #eef7ef);
            color: var(--ap-green);
          }

          .ap-empty h3 {
            margin: 15px 0 6px;
            color: var(--ap-ink);
            font-size: 16px;
            font-weight: 800;
          }

          .ap-empty p {
            max-width: 440px;
            margin: 0;
            color: var(--ap-muted);
            font-size: 12px;
            line-height: 1.7;
          }

          .ap-empty-action {
            min-height: 36px;
            margin-top: 15px;
            padding: 0 13px;
            border: 1px solid #d4e6d7;
            border-radius: 10px;
            background: #f1f8f2;
            color: var(--ap-green-dark);
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: background .18s ease, border-color .18s ease;
          }

          .ap-empty-action:hover {
            border-color: #afcfb6;
            background: #eaf5ec;
          }

          /* =========================================
             LOADING SKELETONS
          ========================================= */

          .ap-loading-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
            gap: 16px;
          }

          .ap-loading-card {
            min-height: 230px;
            padding: 20px;
            border: 1px solid #e4ece6;
            border-radius: 18px;
            background: #f8faf8;
            animation: ap-pulse 1.4s ease-in-out infinite;
          }

          .ap-loading-icon,
          .ap-loading-line {
            display: block;
            border-radius: 9px;
            background: #e9efea;
          }

          .ap-loading-icon {
            width: 51px;
            height: 51px;
            border-radius: 15px;
          }

          .ap-loading-line {
            height: 9px;
            margin-top: 18px;
          }

          .ap-loading-line.line-one {
            width: 62px;
          }

          .ap-loading-line.line-two {
            width: 80%;
            height: 16px;
            margin-top: 12px;
          }

          .ap-loading-line.line-three {
            width: 55%;
            margin-top: 12px;
          }

          @keyframes ap-pulse {
            0%, 100% { opacity: .55; }
            50% { opacity: 1; }
          }

          /* =========================================
             ASSIGNMENT DETAILS MODAL
          ========================================= */

          .ap-modal-backdrop {
            position: fixed;
            z-index: 9999;
            inset: 0;
            display: grid;
            place-items: center;
            overflow-y: auto;
            padding: 22px;
            background: rgba(13, 29, 20, .55);
            backdrop-filter: blur(6px);
          }

          .ap-modal {
            position: relative;
            width: 100%;
            max-width: 590px;
            max-height: 88vh;
            min-width: 0;
            overflow-y: auto;
            padding: 25px;
            border: 1px solid #e0e9e2;
            border-radius: 21px;
            background: #ffffff;
            box-shadow: 0 28px 85px rgba(8, 31, 17, .26);
          }

          .ap-modal-accent {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff9933, #ffffff 50%, #138808);
          }

          .ap-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            min-width: 0;
          }

          .ap-modal-title-wrap {
            min-width: 0;
          }

          .ap-modal-kicker {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #16813e;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: .13em;
          }

          .ap-modal-header h2 {
            margin: 9px 0 0;
            color: var(--ap-ink);
            font-size: 22px;
            font-weight: 820;
            line-height: 1.35;
            letter-spacing: -.035em;
            overflow-wrap: anywhere;
          }

          .ap-modal-x {
            display: flex;
            flex: 0 0 39px;
            align-items: center;
            justify-content: center;
            width: 39px;
            height: 39px;
            padding: 0;
            border: 1px solid #dfe8e1;
            border-radius: 11px;
            background: #f6f9f6;
            color: #5b6c60;
            cursor: pointer;
            transition: background .18s ease, color .18s ease;
          }

          .ap-modal-x:hover {
            background: #edf6ee;
            color: var(--ap-green-dark);
          }

          .ap-modal-info {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            overflow: hidden;
            margin-top: 20px;
            border: 1px solid #e3ebe4;
            border-radius: 15px;
            background: #f8faf8;
          }

          .ap-modal-info-item {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
            padding: 14px;
          }

          .ap-modal-info-item:nth-child(even) {
            border-left: 1px solid #e3ebe4;
          }

          .ap-modal-info-item:nth-child(n + 3) {
            border-top: 1px solid #e3ebe4;
          }

          .ap-modal-info-item span {
            color: #839087;
            font-size: 10px;
            font-weight: 750;
          }

          .ap-modal-info-item strong {
            color: var(--ap-ink);
            font-size: 12px;
            font-weight: 750;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .ap-modal-instructions {
            margin-top: 20px;
            padding: 17px;
            border: 1px solid #e3ebe4;
            border-radius: 15px;
            background:
              linear-gradient(110deg, rgba(255, 153, 51, .045), transparent 45%, rgba(19, 136, 8, .04)),
              #ffffff;
          }

          .ap-modal-instructions-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--ap-green);
          }

          .ap-modal-instructions-title h3 {
            margin: 0;
            color: var(--ap-ink);
            font-size: 13px;
            font-weight: 800;
          }

          .ap-modal-instructions p {
            margin: 11px 0 0;
            color: var(--ap-muted);
            font-size: 12px;
            line-height: 1.75;
            overflow-wrap: anywhere;
            white-space: pre-wrap;
          }

          .ap-modal-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 21px;
          }

          .ap-modal-close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 105px;
            min-height: 42px;
            padding: 0 17px;
            border: 1px solid #cfe0d2;
            border-radius: 11px;
            background: linear-gradient(105deg, #fff8f1, #f2faf3);
            color: #176d37;
            font-size: 12px;
            font-weight: 850;
            cursor: pointer;
            transition: transform .18s ease, box-shadow .18s ease;
          }

          .ap-modal-close:hover {
            transform: translateY(-1px);
            box-shadow: 0 7px 16px rgba(19, 88, 42, .09);
          }

          /* =========================================
             RESPONSIVE
          ========================================= */

          @media (max-width: 960px) {
            .ap-hero {
              grid-template-columns: minmax(0, 1fr) 220px;
            }

            .ap-hero-content {
              padding: 28px;
            }

            .ap-hero-emblem {
              right: 20px;
              width: 160px;
            }

            .ap-group-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .ap-subject-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 700px) {
            .ap-hero {
              display: block;
              border-radius: 20px;
            }

            .ap-hero-content {
              padding: 25px 21px 20px;
            }

            .ap-hero h1 {
              font-size: 31px;
            }

            .ap-hero-content > p {
              font-size: 12px;
            }

            .ap-hero-visual {
              min-height: 135px;
            }

            .ap-hero-emblem {
              top: 6px;
              right: 22px;
              width: 134px;
              height: 105px;
              border-radius: 17px;
              transform: none;
            }

            .ap-emblem-ring {
              width: 45px;
              height: 45px;
              border-radius: 13px;
            }

            .ap-emblem-ring svg {
              width: 27px;
              height: 27px;
            }

            .ap-hero-emblem > span {
              font-size: 8px;
            }

            .ap-orbit-a {
              top: -36px;
              right: -63px;
              width: 225px;
              height: 225px;
            }

            .ap-orbit-b {
              top: -5px;
              right: -32px;
              width: 164px;
              height: 164px;
            }

            .ap-orbit-c {
              top: 22px;
              right: 2px;
              width: 105px;
              height: 105px;
            }

            .ap-dot-a {
              top: 8px;
              right: 179px;
            }

            .ap-dot-b {
              right: 195px;
              bottom: 22px;
            }

            .ap-dot-c {
              top: 17px;
              right: 9px;
            }

            .ap-toolbar {
              grid-template-columns: minmax(0, 1fr);
              padding: 10px;
            }

            .ap-refresh {
              width: 100%;
            }

            .ap-guidance {
              align-items: flex-start;
              flex-wrap: wrap;
              padding: 15px;
            }

            .ap-guidance-copy {
              flex: 1 1 calc(100% - 65px);
            }

            .ap-guidance-badge {
              margin-left: 60px;
            }

            .ap-group-grid,
            .ap-subject-grid {
              grid-template-columns: minmax(0, 1fr);
            }

            .ap-group-card {
              min-height: 245px;
            }

            .ap-section-heading {
              align-items: flex-start;
            }

            .ap-heading-decoration {
              display: none;
            }

            .ap-level-heading {
              flex-direction: column;
              align-items: flex-start;
            }

            .ap-assignment-card {
              gap: 12px;
              padding: 16px;
            }

            .ap-assignment-file-icon {
              flex-basis: 42px;
              width: 42px;
              height: 42px;
              border-radius: 12px;
            }

            .ap-assignment-file-icon svg {
              width: 20px;
              height: 20px;
            }

            .ap-assignment-main h3 {
              font-size: 14px;
            }

            .ap-assignment-main > p {
              font-size: 11px;
            }

            .ap-error {
              align-items: stretch;
              flex-wrap: wrap;
            }

            .ap-retry {
              width: 100%;
            }

            .ap-modal-backdrop {
              padding: 12px;
            }

            .ap-modal {
              padding: 21px 17px;
              border-radius: 18px;
            }
          }

          @media (max-width: 430px) {
            .ap-hero h1 {
              font-size: 27px;
            }

            .ap-hero-pills {
              gap: 6px;
            }

            .ap-hero-pills span {
              font-size: 9px;
            }

            .ap-guidance-badge {
              margin-left: 0;
            }

            .ap-assignment-card {
              flex-direction: column;
            }

            .ap-assignment-file-icon {
              flex: 0 0 42px;
            }

            .ap-assignment-topline {
              align-items: flex-start;
            }

            .ap-assignment-bottom {
              align-items: stretch;
              flex-direction: column;
            }

            .ap-assignment-view {
              justify-content: space-between;
              width: 100%;
              min-height: 37px;
              padding: 0 11px;
              border: 1px solid #d9e7dc;
              border-radius: 9px;
              background: #f5faf6;
            }

            .ap-modal-info {
              grid-template-columns: minmax(0, 1fr);
            }

            .ap-modal-info-item:nth-child(even) {
              border-left: 0;
            }

            .ap-modal-info-item:nth-child(n + 2) {
              border-top: 1px solid #e3ebe4;
            }

            .ap-modal-actions {
              align-items: stretch;
              flex-direction: column;
            }

            .ap-modal-close {
              width: 100%;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .assignments-premium *,
            .assignments-premium *::before,
            .assignments-premium *::after {
              animation-duration: .01ms !important;
              transition-duration: .01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}