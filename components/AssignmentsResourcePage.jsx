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
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { PageHeader, Status, EmptyState } from "@/components/ui";

const GROUPS = ["CX", "CY"];

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
  if (Number.isNaN(due.getTime())) return false;

  const today = new Date();

  today.setHours(23, 59, 59, 999);

  return due < today;
}

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

        if (
          result?.success === false
        ) {
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
    loadAssignments();
  }, [loadAssignments]);

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
          code: getSubjectCode(
            assignment
          ),
          name: getSubjectName(
            assignment
          ),
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

  const selectedSubjectAssignments =
    useMemo(() => {
      if (!selectedSubject) return [];

      return (
        selectedSubject.assignments || []
      ).filter((assignment) => {
        if (!normalizedSearch) {
          return true;
        }

        return JSON.stringify(
          assignment
        )
          .toLowerCase()
          .includes(normalizedSearch);
      });
    }, [
      selectedSubject,
      normalizedSearch,
    ]);

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

  return (
    <AppShell
      role="student"
      title="Assignments"
      subtitle="Academic assignment workspace"
    >
      <div className="page-wrap">
        {/* =========================
            HEADER
        ========================== */}
        <PageHeader
          eyebrow="ACADEMIC WORKSPACE"
          title="Assignments"
          description={
            selectedSubject
              ? `${selectedGroup} • ${
                  selectedSubject.code
                    ? `${selectedSubject.code} • `
                    : ""
                }${selectedSubject.name}`
              : selectedGroup
              ? `${selectedGroup} assignments`
              : "Choose an academic group to view assignments."
          }
        />

        {/* =========================
            TOP TOOLBAR
        ========================== */}
        <div className="assignment-toolbar">
          <div className="assignment-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                selectedGroup
                  ? "Search assignments..."
                  : "Search your assignments..."
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="soft-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* =========================
            INFORMATION BANNER
        ========================== */}
        <div className="assignment-student-banner">
          <div className="assignment-banner-icon">
            <ClipboardCheck size={22} />
          </div>

          <div>
            <span className="assignment-kicker">
              ASSIGNMENT GROUPS
            </span>

            <strong>
              CX and CY folders are available
              to all students.
            </strong>

            <p>
              Open any group and choose a
              subject to view its assignments.
            </p>
          </div>
        </div>

        {error && (
          <div className="resource-error">
            <strong>
              Unable to load assignments
            </strong>

            <span>{error}</span>

            <button
              type="button"
              className="soft-button"
              onClick={handleRefresh}
            >
              <RefreshCw size={15} />
              Try Again
            </button>
          </div>
        )}

        {/* =========================
            LOADING
        ========================== */}
        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  className="skeleton-card"
                  key={item}
                />
              )
            )}
          </div>
        ) : (
          <>
            {/* =========================
                LEVEL 1 — GROUP FOLDERS
            ========================== */}
            {!selectedGroup && (
              <>
                <div className="assignment-breadcrumb">
                  <span className="active">
                    Assignment Groups
                  </span>
                </div>

                <div className="assignment-group-grid">
                  {visibleGroups.map(
                    (group) => {
                      const items =
                        groups[group] || [];

                      const isGeneral =
                        group === "GENERAL";

                      return (
                        <button
                          type="button"
                          className="assignment-group-card"
                          key={group}
                          onClick={() =>
                            openGroup(group)
                          }
                        >
                          <div className="assignment-tricolour" />

                          <div className="assignment-group-icon">
                            <FolderOpen
                              size={25}
                            />
                          </div>

                          <span className="assignment-kicker">
                            {isGeneral
                              ? "OTHER"
                              : "GROUP"}
                          </span>

                          <h3>{group}</h3>

                          <p>
                            {isGeneral
                              ? "Assignments without a group."
                              : `Open the ${group} assignment folder.`}
                          </p>

                          <div className="assignment-card-foot">
                            <span>
                              {items.length}{" "}
                              {items.length ===
                              1
                                ? "assignment"
                                : "assignments"}
                            </span>

                            <ArrowUpRight
                              size={18}
                            />
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {visibleGroups.length ===
                  0 && (
                  <EmptyState
                    icon={FolderOpen}
                    title="No assignment groups"
                    text="Assignment folders will appear here when assignments are published."
                  />
                )}
              </>
            )}

            {/* =========================
                LEVEL 2 — SUBJECT FOLDERS
            ========================== */}
            {selectedGroup &&
              !selectedSubject && (
                <>
                  <div className="assignment-breadcrumb">
                    <button
                      type="button"
                      onClick={
                        resetNavigation
                      }
                    >
                      <ArrowLeft
                        size={15}
                      />
                      Assignment Groups
                    </button>

                    <span>/</span>

                    <span className="active">
                      {selectedGroup}
                    </span>
                  </div>

                  <div className="assignment-level-heading">
                    <div>
                      <span className="assignment-kicker">
                        {selectedGroup ===
                        "GENERAL"
                          ? "OTHER ASSIGNMENTS"
                          : "GROUP"}
                      </span>

                      <h3>
                        {selectedGroup} Subjects
                      </h3>
                    </div>

                    <span className="assignment-count-pill">
                      {
                        currentGroupAssignments.length
                      }{" "}
                      {currentGroupAssignments.length ===
                      1
                        ? "assignment"
                        : "assignments"}
                    </span>
                  </div>

                  {subjectFolders.length ===
                  0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title={
                        normalizedSearch
                          ? "No matching subjects"
                          : "No assignments yet"
                      }
                      text={
                        normalizedSearch
                          ? "Try another search term."
                          : "No published assignments are available in this group yet."
                      }
                    />
                  ) : (
                    <div className="assignment-subject-grid">
                      {subjectFolders.map(
                        (subject) => (
                          <button
                            type="button"
                            className="assignment-subject-card"
                            key={
                              subject.key
                            }
                            onClick={() =>
                              openSubject(
                                subject
                              )
                            }
                          >
                            <div className="assignment-subject-icon">
                              <FolderOpen
                                size={23}
                              />
                            </div>

                            <div className="assignment-subject-content">
                              <span>
                                {subject.code ||
                                  "SUBJECT"}
                              </span>

                              <h3>
                                {subject.name}
                              </h3>

                              <small>
                                {
                                  subject
                                    .assignments
                                    .length
                                }{" "}
                                {subject
                                  .assignments
                                  .length ===
                                1
                                  ? "assignment"
                                  : "assignments"}
                              </small>
                            </div>

                            <ArrowUpRight
                              size={18}
                            />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </>
              )}

            {/* =========================
                LEVEL 3 — ASSIGNMENTS
            ========================== */}
            {selectedGroup &&
              selectedSubject && (
                <>
                  <div className="assignment-breadcrumb">
                    <button
                      type="button"
                      onClick={() =>
                        openGroup(
                          selectedGroup
                        )
                      }
                    >
                      <ArrowLeft
                        size={15}
                      />
                      {selectedGroup}
                    </button>

                    <span>/</span>

                    <span className="active">
                      {selectedSubject.name}
                    </span>
                  </div>

                  <div className="assignment-level-heading">
                    <div>
                      <span className="assignment-kicker">
                        {selectedSubject.code ||
                          "SUBJECT"}
                      </span>

                      <h3>
                        {selectedSubject.name}
                      </h3>
                    </div>

                    <span className="assignment-count-pill">
                      {
                        selectedSubjectAssignments.length
                      }{" "}
                      {selectedSubjectAssignments.length ===
                      1
                        ? "assignment"
                        : "assignments"}
                    </span>
                  </div>

                  {selectedSubjectAssignments.length ===
                  0 ? (
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No assignments found"
                      text={
                        normalizedSearch
                          ? "Try another search term."
                          : "There are no published assignments in this subject yet."
                      }
                    />
                  ) : (
                    <div className="assignment-list">
                      {selectedSubjectAssignments.map(
                        (assignment) => {
                          const overdue =
                            isOverdue(
                              assignment?.due_date
                            );

                          return (
                            <button
                              type="button"
                              className="assignment-item-card"
                              key={
                                assignment.id
                              }
                              onClick={() =>
                                setSelectedAssignment(
                                  assignment
                                )
                              }
                            >
                              <div className="assignment-item-icon">
                                <FileText
                                  size={22}
                                />
                              </div>

                              <div className="assignment-item-main">
                                <div className="assignment-item-top">
                                  <span className="assignment-subject-code">
                                    {getSubjectCode(
                                      assignment
                                    ) ||
                                      selectedSubject.code ||
                                      selectedGroup}
                                  </span>

                                  <Status
                                    tone={
                                      overdue
                                        ? "pink"
                                        : "blue"
                                    }
                                  >
                                    {overdue
                                      ? "Overdue"
                                      : assignment?.status ||
                                        "Published"}
                                  </Status>
                                </div>

                                <h3>
                                  {assignment?.title ||
                                    "Untitled Assignment"}
                                </h3>

                                <p>
                                  {getInstructions(
                                    assignment
                                  )}
                                </p>

                                <div className="assignment-item-meta">
                                  <span>
                                    <CalendarDays
                                      size={15}
                                    />
                                    {assignment?.due_date
                                      ? `Due ${formatDate(
                                          assignment.due_date
                                        )}`
                                      : "No deadline"}
                                  </span>

                                  <ArrowUpRight
                                    size={17}
                                  />
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

        {/* =========================
            ASSIGNMENT DETAIL MODAL
        ========================== */}
        {selectedAssignment && (
          <div
            className="assignment-modal-backdrop"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedAssignment(
                  null
                );
              }
            }}
          >
            <div className="assignment-detail-modal">
              <div className="assignment-modal-header">
                <div>
                  <span className="assignment-kicker">
                    ASSIGNMENT
                  </span>

                  <h3>
                    {selectedAssignment.title ||
                      "Untitled Assignment"}
                  </h3>
                </div>

                <button
                  type="button"
                  className="assignment-close"
                  onClick={() =>
                    setSelectedAssignment(
                      null
                    )
                  }
                  aria-label="Close"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="assignment-detail-grid">
                <div className="assignment-detail-box">
                  <span>Group</span>
                  <strong>
                    {getAssignmentSection(
                      selectedAssignment
                    )}
                  </strong>
                </div>

                <div className="assignment-detail-box">
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

                <div className="assignment-detail-box">
                  <span>Deadline</span>
                  <strong>
                    {selectedAssignment?.due_date
                      ? formatDate(
                          selectedAssignment.due_date
                        )
                      : "Not set"}
                  </strong>
                </div>

                <div className="assignment-detail-box">
                  <span>Status</span>
                  <strong>
                    {selectedAssignment?.status ||
                      "Published"}
                  </strong>
                </div>
              </div>

              <div className="assignment-detail-content">
                <div className="assignment-detail-title">
                  <Clock3 size={17} />
                  Instructions
                </div>

                <p>
                  {getInstructions(
                    selectedAssignment
                  )}
                </p>
              </div>

              <div className="assignment-modal-actions">
                <button
                  type="button"
                  className="soft-button"
                  onClick={() =>
                    setSelectedAssignment(
                      null
                    )
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}