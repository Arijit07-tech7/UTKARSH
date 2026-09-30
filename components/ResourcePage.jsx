"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Search,
  X,
  ExternalLink,
  RefreshCw,
  FileText,
  ClipboardCheck,
  CalendarDays,
  Layers3,
  Bell,
  MessageCircle,
  FolderOpen,
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { PageHeader, Status, EmptyState } from "@/components/ui";

const configs = {
  notes: {
    title: "Notes & Study Material",
    desc: "Everything you need to study smarter.",
    icon: FileText,
  },

  assignments: {
    title: "Assignments",
    desc: "Track deadlines and physical submission status.",
    icon: ClipboardCheck,
  },

  routine: {
    title: "Class Routine",
    desc: "Your weekly academic schedule in one place.",
    icon: CalendarDays,
  },

  syllabus: {
    title: "Syllabus",
    desc: "Explore your subject-wise academic structure.",
    icon: Layers3,
  },

  notices: {
    title: "College Notices",
    desc: "Never miss important academic announcements.",
    icon: Bell,
  },

  query: {
    title: "Ask Admin",
    desc: "Have a question? Start a professional academic conversation.",
    icon: MessageCircle,
  },
};

function uniqueItems(items) {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter(
    (item, index) => {
      const key =
        item?.id ||
        [
          item?.title,
          item?.name,
          item?.subject,
          item?.code,
          item?.date,
          item?.due_date,
          item?.day,
          item?.time,
          item?.subject_id,
        ]
          .filter(Boolean)
          .join("|") ||
        `item-${index}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    }
  );
}

function formatDate(value) {
  if (!value) return "Recently";

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

function getDescription(item) {
  return (
    item?.description ||
    item?.content ||
    item?.preview ||
    item?.instructions ||
    item?.room ||
    item?.units ||
    "Academic information is available for this item."
  );
}

function getStatus(item) {
  return (
    item?.status ||
    item?.category ||
    item?.priority ||
    item?.subject ||
    "Academic"
  );
}

function getMeta(item, resource) {
  if (resource === "routine") {
    return (
      [
        item?.day,
        item?.time ||
          item?.start_time ||
          item?.class_time,
      ]
        .filter(Boolean)
        .join(" • ") || "Schedule"
    );
  }

  if (resource === "assignments") {
    return item?.due_date
      ? `Due ${formatDate(item.due_date)}`
      : "Deadline not set";
  }

  if (
    resource === "notes" ||
    resource === "syllabus"
  ) {
    return item?.date
      ? formatDate(item.date)
      : "Recently added";
  }

  if (resource === "notices") {
    return item?.date
      ? formatDate(item.date)
      : "Recently";
  }

  return item?.created_at
    ? formatDate(item.created_at)
    : "Recently";
}

function getTitle(item) {
  return (
    item?.title ||
    item?.name ||
    item?.subject ||
    item?.code ||
    "Academic Item"
  );
}

/* =========================================================
   STUDENT NOTES — SUBJECT FOLDER HELPERS
========================================================= */

function getSubjectId(item) {
  return (
    item?.subject_id ||
    item?.subjectId ||
    ""
  );
}

function getSubjectCode(subject) {
  return (
    subject?.subject_code ||
    subject?.code ||
    "SUBJECT"
  );
}

function getSubjectName(subject) {
  return (
    subject?.subject_name ||
    subject?.name ||
    subject?.title ||
    "Unnamed Subject"
  );
}

function getSubjectNotes(notes, subject) {
  if (!subject?.id) return [];

  return notes.filter(
    (note) =>
      String(getSubjectId(note)) ===
      String(subject.id)
  );
}

export default function ResourcePage({
  resource,
}) {
  const config = configs[resource];

  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [selected, setSelected] =
    useState(null);

  const [
    selectedSubject,
    setSelectedSubject,
  ] = useState(null);

  const Icon =
    config?.icon || FileText;

  /* =======================================================
     NORMAL RESOURCE LOADING
  ======================================================= */

  const loadItems = useCallback(async () => {
    if (!config) return;

    try {
      setError("");

      const response = await fetch(
        `/api/data?resource=${encodeURIComponent(
          resource
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result =
        await response.json().catch(
          () => null
        );

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            `Failed to load ${config.title}.`
        );
      }

      if (result?.unavailable) {
        throw new Error(
          `Unable to load ${config.title} from the database.`
        );
      }

      setItems(
        uniqueItems(result.data)
      );
    } catch (err) {
      console.error(
        `ResourcePage ${resource}:`,
        err
      );

      setItems([]);

      setError(
        err?.message ||
          `Unable to load ${config.title}. Please try again.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resource, config]);

  /* =======================================================
     SUBJECT LOADING — NOTES ONLY
  ======================================================= */

  const loadSubjects = useCallback(
    async () => {
      if (resource !== "notes") return;

      try {
        setSubjectsLoading(true);
        setError("");

        const response = await fetch(
          "/api/data?resource=subjects",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result =
          await response.json().catch(
            () => null
          );

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              "Failed to load subjects."
          );
        }

        setSubjects(
          uniqueItems(result.data)
        );
      } catch (err) {
        console.error(
          "Failed to load subjects:",
          err
        );

        setSubjects([]);

        setError(
          err?.message ||
            "Unable to load subjects."
        );
      } finally {
        setSubjectsLoading(false);
      }
    },
    [resource]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    setLoading(true);
    setItems([]);
    setSubjects([]);
    setSelected(null);
    setSelectedSubject(null);
    setSearch("");

    if (resource === "notes") {
      loadItems();
      loadSubjects();
      return;
    }

    loadItems();
  }, [
    resource,
    loadItems,
    loadSubjects,
  ]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {
    setRefreshing(true);

    if (resource === "notes") {
      Promise.all([
        loadItems(),
        loadSubjects(),
      ]).finally(() => {
        setRefreshing(false);
      });

      return;
    }

    loadItems();
  };

  /* =======================================================
     NORMAL RESOURCE SEARCH
  ======================================================= */

  const filtered = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(term)
    );
  }, [items, search]);

  /* =======================================================
     NOTES — SUBJECT SEARCH
  ======================================================= */

  const filteredSubjects = useMemo(() => {
    if (resource !== "notes") {
      return [];
    }

    const term =
      search.trim().toLowerCase();

    if (!term) return subjects;

    return subjects.filter(
      (subject) =>
        String(
          getSubjectCode(subject)
        )
          .toLowerCase()
          .includes(term) ||
        String(
          getSubjectName(subject)
        )
          .toLowerCase()
          .includes(term)
    );
  }, [
    resource,
    subjects,
    search,
  ]);

  /* =======================================================
     NOTES — SELECTED SUBJECT MATERIALS
  ======================================================= */

  const selectedSubjectNotes =
    useMemo(() => {
      if (
        resource !== "notes" ||
        !selectedSubject
      ) {
        return [];
      }

      const subjectNotes =
        getSubjectNotes(
          items,
          selectedSubject
        );

      const term =
        search.trim().toLowerCase();

      if (!term) {
        return subjectNotes;
      }

      return subjectNotes.filter(
        (item) =>
          JSON.stringify(item)
            .toLowerCase()
            .includes(term)
      );
    }, [
      resource,
      items,
      selectedSubject,
      search,
    ]);

  /* =======================================================
     INVALID RESOURCE
  ======================================================= */

  if (!config) {
    return null;
  }

  /* =======================================================
     NOTES — SUBJECT FOLDER VIEW
  ======================================================= */

  if (
    resource === "notes" &&
    !selectedSubject
  ) {
    return (
      <AppShell
        role="student"
        title="Study Material"
        subtitle="Subject-wise academic resources"
      >
        <div className="page-wrap">
          <PageHeader
            eyebrow="ACADEMIC SPACE"
            title="Study Material"
            description="Choose a subject to explore its notes and PDF materials."
          />

          <div className="resource-toolbar">
            <div className="search-box">
              <Search size={17} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search subjects..."
                type="search"
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
              disabled={
                refreshing ||
                subjectsLoading
              }
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

          {error && (
            <div className="resource-error">
              <strong>
                Unable to load data
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

          {subjectsLoading ? (
            <div className="skeleton-grid">
              {[1, 2, 3, 4].map(
                (i) => (
                  <div
                    className="skeleton-card"
                    key={i}
                  />
                )
              )}
            </div>
          ) : filteredSubjects.length ===
            0 ? (
            <EmptyState
              icon={FolderOpen}
              title={
                search
                  ? "No subjects found"
                  : "No subject folders available"
              }
              text={
                search
                  ? "Try another subject name or code."
                  : "Subjects created by admin will appear here."
              }
            />
          ) : (
            <div className="resource-grid notes-subject-grid">
              {filteredSubjects.map(
                (subject) => {
                  const count =
                    getSubjectNotes(
                      items,
                      subject
                    ).length;

                  return (
                    <button
                      type="button"
                      className="notes-subject-card"
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(
                          subject
                        );
                        setSearch("");
                      }}
                    >
                      <div className="notes-folder-icon">
                        <FolderOpen
                          size={25}
                        />
                      </div>

                      <div className="notes-subject-card-content">
                        <span>
                          {getSubjectCode(
                            subject
                          )}
                        </span>

                        <h3>
                          {getSubjectName(
                            subject
                          )}
                        </h3>

                        <small>
                          {count}{" "}
                          {count === 1
                            ? "material"
                            : "materials"}
                        </small>
                      </div>

                      <ArrowUpRight
                        size={18}
                      />
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  /* =======================================================
     NOTES — INSIDE SUBJECT FOLDER
  ======================================================= */

  if (
    resource === "notes" &&
    selectedSubject
  ) {
    return (
      <AppShell
        role="student"
        title={getSubjectCode(
          selectedSubject
        )}
        subtitle={getSubjectName(
          selectedSubject
        )}
      >
        <div className="page-wrap">
          <button
            type="button"
            className="notes-back-button"
            onClick={() => {
              setSelectedSubject(null);
              setSelected(null);
              setSearch("");
            }}
          >
            <ArrowLeft size={16} />
            Back to Subjects
          </button>

          <PageHeader
            eyebrow={`${getSubjectCode(
              selectedSubject
            )} • SUBJECT MATERIAL`}
            title={getSubjectName(
              selectedSubject
            )}
            description="All study materials uploaded for this subject."
          />

          <div className="resource-toolbar">
            <div className="search-box">
              <Search size={17} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search materials..."
                type="search"
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

          {error && (
            <div className="resource-error">
              <strong>
                Unable to load materials
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

          {loading ? (
            <div className="skeleton-grid">
              {[1, 2, 3].map(
                (i) => (
                  <div
                    className="skeleton-card"
                    key={i}
                  />
                )
              )}
            </div>
          ) : selectedSubjectNotes.length ===
            0 ? (
            <EmptyState
              icon={FileText}
              title={
                search
                  ? "No materials found"
                  : "No materials uploaded yet"
              }
              text={
                search
                  ? "Try another title or topic."
                  : "Materials uploaded by admin will appear here."
              }
            />
          ) : (
            <div className="resource-grid notes">
              {selectedSubjectNotes.map(
                (item, index) => {
                  const title =
                    getTitle(item);

                  return (
                    <article
                      className="resource-card"
                      key={
                        item?.id ||
                        `${title}-${index}`
                      }
                    >
                      <div className="resource-card-top">
                        <span className="resource-icon">
                          <FileText
                            size={19}
                          />
                        </span>

                        <Status tone="blue">
                          PDF
                        </Status>
                      </div>

                      <h3>{title}</h3>

                      <p>
                        {getDescription(
                          item
                        )}
                      </p>

                      <div className="resource-meta">
                        <small>
                          {item?.date
                            ? formatDate(
                                item.date
                              )
                            : item?.created_at
                              ? formatDate(
                                  item.created_at
                                )
                              : "Recently added"}
                        </small>

                        <button
                          type="button"
                          onClick={() =>
                            setSelected(
                              item
                            )
                          }
                        >
                          View{" "}
                          <span>
                            →
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}

          {selected && (
            <div
              className="modal-backdrop"
              onMouseDown={() =>
                setSelected(null)
              }
            >
              <div
                className="modal"
                onMouseDown={(e) =>
                  e.stopPropagation()
                }
              >
                <div className="modal-head">
                  <div>
                    <span>
                      STUDY MATERIAL
                    </span>

                    <h3>
                      {getTitle(
                        selected
                      )}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        null
                      )
                    }
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <p className="modal-description">
                  {getDescription(
                    selected
                  )}
                </p>

                <div className="modal-detail-grid">
                  <span>
                    <b>Subject</b>

                    {getSubjectCode(
                      selectedSubject
                    )}{" "}
                    •{" "}
                    {getSubjectName(
                      selectedSubject
                    )}
                  </span>

                  <span>
                    <b>Date</b>

                    {selected.date
                      ? formatDate(
                          selected.date
                        )
                      : selected.created_at
                        ? formatDate(
                            selected.created_at
                          )
                        : "—"}
                  </span>

                  {selected.file_name && (
                    <span>
                      <b>File</b>
                      {selected.file_name}
                    </span>
                  )}
                </div>

                {(
                  selected.pdf_url ||
                  selected.pdf_path ||
                  selected.file_path
                ) && (
                  <a
                    className="primary-button full"
                    href={
                      selected.pdf_url ||
                      selected.pdf_path ||
                      "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink
                      size={17}
                    />
                    Open PDF
                  </a>
                )}

                <button
                  type="button"
                  className="primary-button full"
                  onClick={() =>
                    setSelected(
                      null
                    )
                  }
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  /* =======================================================
     ALL OTHER STUDENT RESOURCES
     EXISTING BEHAVIOUR PRESERVED
  ======================================================= */

  return (
    <AppShell
      role="student"
      title={config.title}
      subtitle={config.desc}
    >
      <div className="page-wrap">
        <PageHeader
          eyebrow="ACADEMIC SPACE"
          title={config.title}
          description={config.desc}
        />

        <div className="resource-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={`Search ${resource}...`}
              type="search"
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

        {error && (
          <div className="resource-error">
            <strong>
              Unable to load data
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

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3, 4].map(
              (i) => (
                <div
                  className="skeleton-card"
                  key={i}
                />
              )
            )}
          </div>
        ) : filtered.length ===
          0 ? (
          <EmptyState
            icon={Icon}
            title={
              search
                ? `No ${resource} matches found`
                : `No ${resource} available`
            }
            text={
              search
                ? "Try another search term."
                : "Content will appear here when it is available."
            }
          />
        ) : (
          <div
            className={`resource-grid ${resource}`}
          >
            {filtered.map(
              (item, index) => {
                const title =
                  getTitle(item);

                const description =
                  getDescription(
                    item
                  );

                const status =
                  getStatus(item);

                const tone =
                  item?.status
                    ?.toLowerCase() ===
                  "verified"
                    ? "green"
                    : item?.priority
                          ?.toLowerCase() ===
                        "important"
                      ? "pink"
                      : "blue";

                return (
                  <article
                    className="resource-card"
                    key={
                      item?.id ||
                      `${title}-${index}`
                    }
                  >
                    <div className="resource-card-top">
                      <span className="resource-icon">
                        <Icon size={19} />
                      </span>

                      <Status
                        tone={tone}
                      >
                        {status}
                      </Status>
                    </div>

                    <h3>{title}</h3>

                    <p>
                      {description}
                    </p>

                    <div className="resource-meta">
                      <small>
                        {getMeta(
                          item,
                          resource
                        )}
                      </small>

                      <button
                        type="button"
                        onClick={() =>
                          setSelected(
                            item
                          )
                        }
                      >
                        View{" "}
                        <span>
                          →
                        </span>
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}

        {selected && (
          <div
            className="modal-backdrop"
            onMouseDown={() =>
              setSelected(null)
            }
          >
            <div
              className="modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >
              <div className="modal-head">
                <div>
                  <span>
                    ACADEMIC ITEM
                  </span>

                  <h3>
                    {getTitle(
                      selected
                    )}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      null
                    )
                  }
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="modal-description">
                {getDescription(
                  selected
                )}
              </p>

              <div className="modal-detail-grid">
                <span>
                  <b>Subject</b>

                  {selected.subject ||
                    selected.code ||
                    selected.subject_code ||
                    "—"}
                </span>

                <span>
                  <b>Date</b>

                  {selected.date
                    ? formatDate(
                        selected.date
                      )
                    : selected.due_date
                      ? formatDate(
                          selected.due_date
                        )
                      : selected.created_at
                        ? formatDate(
                            selected.created_at
                          )
                        : "—"}
                </span>

                <span>
                  <b>Status</b>

                  {selected.status ||
                    selected.category ||
                    selected.priority ||
                    "Available"}
                </span>

                {selected.room && (
                  <span>
                    <b>Room</b>
                    {selected.room}
                  </span>
                )}

                {selected.time && (
                  <span>
                    <b>Time</b>
                    {selected.time}
                  </span>
                )}

                {selected.day && (
                  <span>
                    <b>Day</b>
                    {selected.day}
                  </span>
                )}
              </div>

              {(
                selected.pdf_url ||
                selected.pdf_path
              ) && (
                <a
                  className="primary-button full"
                  href={
                    selected.pdf_url ||
                    "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink
                    size={17}
                  />
                  Open PDF
                </a>
              )}

              <button
                type="button"
                className="primary-button full"
                onClick={() =>
                  setSelected(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}