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
  BookOpen,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { PageHeader, Status, EmptyState } from "@/components/ui";

/* =========================================================
   RESOURCE CONFIGURATION
========================================================= */

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

/* =========================================================
   COMMON HELPERS
========================================================= */

function uniqueItems(items) {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter((item, index) => {
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
  });
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
        item?.time || item?.start_time || item?.class_time,
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

  if (resource === "notes" || resource === "syllabus") {
    return item?.date ? formatDate(item.date) : "Recently added";
  }

  if (resource === "notices") {
    return item?.date ? formatDate(item.date) : "Recently";
  }

  return item?.created_at ? formatDate(item.created_at) : "Recently";
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
   NOTES — SUBJECT HELPERS
========================================================= */

function getSubjectId(item) {
  return item?.subject_id || item?.subjectId || "";
}

function getSubjectCode(subject) {
  return subject?.subject_code || subject?.code || "SUBJECT";
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
      String(getSubjectId(note)) === String(subject.id)
  );
}

/* =========================================================
   RESOURCE PAGE
========================================================= */

export default function ResourcePage({ resource }) {
  const config = configs[resource];

  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const Icon = config?.icon || FileText;

  /* =======================================================
     LOAD RESOURCE DATA
  ======================================================= */

  const loadItems = useCallback(async () => {
    if (!config) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `/api/data?resource=${encodeURIComponent(resource)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || `Failed to load ${config.title}.`
        );
      }

      if (result?.unavailable) {
        throw new Error(
          `Unable to load ${config.title} from the database.`
        );
      }

      setItems(uniqueItems(result.data));
    } catch (err) {
      console.error(`ResourcePage ${resource}:`, err);

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
     LOAD SUBJECTS — NOTES ONLY
  ======================================================= */

  const loadSubjects = useCallback(async () => {
    if (resource !== "notes") return;

    try {
      setSubjectsLoading(true);

      const response = await fetch("/api/data?resource=subjects", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Failed to load subjects."
        );
      }

      setSubjects(uniqueItems(result.data));
    } catch (err) {
      console.error("Failed to load subjects:", err);

      setSubjects([]);
      setError(err?.message || "Unable to load subjects.");
    } finally {
      setSubjectsLoading(false);
    }
  }, [resource]);

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
    setError("");

    if (resource === "notes") {
      void loadItems();
      void loadSubjects();
      return;
    }

    void loadItems();
  }, [resource, loadItems, loadSubjects]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = useCallback(() => {
    setRefreshing(true);

    if (resource === "notes") {
      void Promise.all([loadItems(), loadSubjects()]).finally(() => {
        setRefreshing(false);
      });
      return;
    }

    void loadItems();
  }, [resource, loadItems, loadSubjects]);

  /* =======================================================
     GENERIC RESOURCE SEARCH
  ======================================================= */

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(term)
    );
  }, [items, search]);

  /* =======================================================
     NOTES — SUBJECT SEARCH
  ======================================================= */

  const filteredSubjects = useMemo(() => {
    if (resource !== "notes") return [];

    const term = search.trim().toLowerCase();

    if (!term) return subjects;

    return subjects.filter((subject) => {
      const code = String(getSubjectCode(subject)).toLowerCase();
      const name = String(getSubjectName(subject)).toLowerCase();

      return code.includes(term) || name.includes(term);
    });
  }, [resource, subjects, search]);

  /* =======================================================
     NOTES — MATERIALS INSIDE SELECTED SUBJECT
  ======================================================= */

  const selectedSubjectNotes = useMemo(() => {
    if (resource !== "notes" || !selectedSubject) return [];

    const subjectNotes = getSubjectNotes(items, selectedSubject);
    const term = search.trim().toLowerCase();

    if (!term) return subjectNotes;

    return subjectNotes.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(term)
    );
  }, [resource, items, selectedSubject, search]);

  /* =======================================================
     INVALID RESOURCE
  ======================================================= */

  if (!config) return null;

  /* =======================================================
     NOTES — SUBJECT FOLDER VIEW
  ======================================================= */

  if (resource === "notes" && !selectedSubject) {
    return (
      <AppShell
        role="student"
        title="Study Material"
        subtitle="Subject-wise academic resources"
      >
        <div className="page-wrap rp-notes-page">
          <section className="rp-notes-hero">
            <div className="rp-notes-hero-glow" />

            <div className="rp-notes-hero-content">
              <div className="rp-notes-kicker">
                <span className="rp-notes-kicker-dot" />
                ACADEMIC LIBRARY
              </div>

              <h1>
                Notes & <strong>Study Material</strong>
              </h1>

              <p>
                Find your subject, open the folder, and access
                every material uploaded for your academic workspace.
              </p>

              <div className="rp-notes-hero-meta">
                <span>
                  <BookOpen size={14} />
                  {subjectsLoading
                    ? "Loading subjects..."
                    : `${subjects.length} subjects`}
                </span>

                <span>
                  <FileText size={14} />
                  {loading
                    ? "Syncing materials..."
                    : `${items.length} materials`}
                </span>

                <span>
                  <Sparkles size={14} />
                  Updated academic space
                </span>
              </div>
            </div>

            <div className="rp-notes-hero-art" aria-hidden="true">
              <div className="rp-notes-orbit rp-orbit-one" />
              <div className="rp-notes-orbit rp-orbit-two" />
              <div className="rp-notes-orbit rp-orbit-three" />

              <div className="rp-notes-art-card">
                <FolderOpen size={42} />
                <small>YOUR LIBRARY</small>
              </div>
            </div>
          </section>

          <section className="rp-notes-toolbar">
            <label className="rp-notes-search">
              <Search size={18} aria-hidden="true" />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject name or subject code..."
                aria-label="Search subjects"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </label>

            <button
              type="button"
              className="rp-notes-refresh"
              onClick={handleRefresh}
              disabled={refreshing || subjectsLoading}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "rp-notes-spin" : ""}
              />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </section>

          {error && (
            <div className="rp-notes-error" role="alert">
              <div>
                <strong>Unable to load study material</strong>
                <span>{error}</span>
              </div>

              <button type="button" onClick={handleRefresh}>
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          )}

          <div className="rp-notes-section-heading">
            <div>
              <span>SUBJECT LIBRARY</span>
              <h2>Choose a subject</h2>
            </div>

            <p>
              Open any subject to explore its available PDFs
              and study materials.
            </p>
          </div>

          {subjectsLoading ? (
            <div className="rp-subject-grid">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div className="rp-subject-skeleton" key={item}>
                  <div />
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="rp-notes-empty">
              <div className="rp-notes-empty-icon">
                <FolderOpen size={25} />
              </div>

              <h3>
                {search
                  ? "No subjects found"
                  : "No subject folders available"}
              </h3>

              <p>
                {search
                  ? "Try another subject name or code."
                  : "Subjects created by admin will appear here."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="rp-subject-grid">
              {filteredSubjects.map((subject, index) => {
                const count = getSubjectNotes(items, subject).length;
                const accent = index % 3;

                return (
                  <button
                    type="button"
                    className={`rp-subject-card rp-accent-${accent}`}
                    key={subject.id || `${getSubjectCode(subject)}-${index}`}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setSearch("");
                      setSelected(null);
                    }}
                  >
                    <div className="rp-subject-card-top">
                      <div className="rp-subject-icon">
                        <FolderOpen size={23} />
                      </div>

                      <span className="rp-subject-arrow">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>

                    <div className="rp-subject-card-copy">
                      <span className="rp-subject-code">
                        {getSubjectCode(subject)}
                      </span>

                      <h3>{getSubjectName(subject)}</h3>

                      <p>
                        {count}{" "}
                        {count === 1
                          ? "study material"
                          : "study materials"}
                      </p>
                    </div>

                    <div className="rp-subject-card-footer">
                      <span>Open subject</span>
                      <span className="rp-subject-footer-arrow">
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <style jsx>{`
            .rp-notes-page {
              --rp-ink: #17251f;
              --rp-muted: #6d7972;
              --rp-border: #dfe8e1;
              --rp-green: #138808;
              --rp-green-dark: #0d5739;
              --rp-saffron: #ff9933;
              padding-bottom: 34px;
              min-width: 0;
            }

            .rp-notes-hero {
              position: relative;
              display: grid;
              grid-template-columns: minmax(0, 1fr) 280px;
              min-height: 250px;
              overflow: hidden;
              border-radius: 23px;
              color: #fff;
              background:
                radial-gradient(circle at 86% 18%, rgba(255, 153, 51, .15), transparent 27%),
                linear-gradient(115deg, #0d5438, #157248 58%, #1b8253);
              box-shadow: 0 18px 40px rgba(22, 85, 53, .12);
            }

            .rp-notes-hero::after {
              position: absolute;
              content: "";
              height: 3px;
              bottom: 0;
              left: 0;
              right: 0;
              background: linear-gradient(90deg, #ff9933, #fff 50%, #138808);
            }

            .rp-notes-hero-glow {
              position: absolute;
              top: -45px;
              right: 55px;
              width: 190px;
              height: 190px;
              border-radius: 50%;
              background: rgba(255, 166, 93, .13);
              filter: blur(35px);
            }

            .rp-notes-hero-content {
              position: relative;
              z-index: 1;
              padding: 33px 37px;
            }

            .rp-notes-kicker {
              display: flex;
              align-items: center;
              gap: 9px;
              color: #ffd3a8;
              font-size: 10px;
              font-weight: 850;
              letter-spacing: .15em;
            }

            .rp-notes-kicker-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #ffad67;
            }

            .rp-notes-hero h1 {
              max-width: 690px;
              margin: 17px 0 11px;
              font-size: clamp(27px, 3vw, 40px);
              line-height: 1.1;
              font-weight: 780;
              letter-spacing: -.045em;
            }

            .rp-notes-hero h1 strong {
              color: #fff;
            }

            .rp-notes-hero-content > p {
              max-width: 620px;
              margin: 0;
              color: rgba(255, 255, 255, .76);
              font-size: 12px;
              line-height: 1.7;
            }

            .rp-notes-hero-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 21px;
            }

            .rp-notes-hero-meta span {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 7px 10px;
              border: 1px solid rgba(255, 255, 255, .13);
              border-radius: 999px;
              background: rgba(255, 255, 255, .08);
              color: rgba(255, 255, 255, .86);
              font-size: 9px;
              font-weight: 700;
            }

            .rp-notes-hero-meta svg {
              color: #ffc17d;
            }

            .rp-notes-hero-art {
              position: relative;
              min-height: 250px;
              overflow: hidden;
            }

            .rp-notes-orbit {
              position: absolute;
              border: 1px solid rgba(255, 255, 255, .13);
              border-radius: 50%;
            }

            .rp-orbit-one {
              width: 290px;
              height: 290px;
              top: -65px;
              right: -76px;
            }

            .rp-orbit-two {
              width: 210px;
              height: 210px;
              top: -26px;
              right: -36px;
            }

            .rp-orbit-three {
              width: 130px;
              height: 130px;
              top: 14px;
              right: 4px;
            }

            .rp-notes-art-card {
              position: absolute;
              top: 54px;
              right: 28px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 10px;
              width: 185px;
              height: 145px;
              border: 1px solid rgba(255, 255, 255, .17);
              border-radius: 20px;
              background: rgba(255, 255, 255, .095);
              box-shadow: 0 18px 36px rgba(0, 0, 0, .09);
              backdrop-filter: blur(13px);
            }

            .rp-notes-art-card svg {
              color: #ffc17d;
            }

            .rp-notes-art-card small {
              color: rgba(255, 255, 255, .74);
              font-size: 8px;
              font-weight: 850;
              letter-spacing: .16em;
            }

            /* Toolbar */
            .rp-notes-toolbar {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              align-items: center;
              gap: 12px;
              margin: 18px 0 27px;
              padding: 11px;
              min-width: 0;
              border: 1px solid var(--rp-border);
              border-radius: 16px;
              background: #fff;
              box-shadow: 0 8px 24px rgba(20, 55, 34, .04);
            }

            .rp-notes-search {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
              min-height: 46px;
              padding: 0 12px;
              border: 1px solid #e1e9e2;
              border-radius: 11px;
              background: #f8faf8;
              color: #78867d;
              transition: border-color .18s ease, box-shadow .18s ease;
            }

            .rp-notes-search:focus-within {
              border-color: #83b894;
              background: #fff;
              box-shadow: 0 0 0 3px rgba(19, 136, 8, .08);
            }

            .rp-notes-search > svg {
              flex: 0 0 auto;
              color: #738178;
            }

            .rp-notes-search input {
              flex: 1 1 auto;
              width: 100%;
              min-width: 0;
              height: 44px;
              padding: 0;
              border: 0;
              outline: none;
              box-shadow: none;
              border-radius: 0;
              appearance: none;
              background: transparent;
              color: var(--rp-ink);
              font: inherit;
              font-size: 13px;
            }

            .rp-notes-search input::placeholder {
              color: #98a39b;
              opacity: 1;
            }

            .rp-notes-search input::-webkit-search-cancel-button {
              display: none;
            }

            .rp-notes-search button {
              display: inline-flex;
              flex: 0 0 27px;
              align-items: center;
              justify-content: center;
              width: 27px;
              height: 27px;
              padding: 0;
              border: 0;
              border-radius: 50%;
              background: #edf4ee;
              color: #5d7063;
              cursor: pointer;
            }

            .rp-notes-search button:hover {
              background: #e1efe4;
              color: var(--rp-green-dark);
            }

            .rp-notes-refresh {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-width: 110px;
              min-height: 46px;
              padding: 0 15px;
              border: 1px solid #cfe0d2;
              border-radius: 11px;
              background: #fff;
              color: #176d37;
              font: inherit;
              font-size: 12px;
              font-weight: 750;
              white-space: nowrap;
              cursor: pointer;
              transition: .18s ease;
            }

            .rp-notes-refresh svg {
              flex: 0 0 auto;
              color: var(--rp-green);
            }

            .rp-notes-refresh:hover:not(:disabled) {
              transform: translateY(-1px);
              border-color: #a9cdb1;
              background: #f1f8f2;
              box-shadow: 0 7px 17px rgba(18, 91, 47, .07);
            }

            .rp-notes-refresh:disabled {
              cursor: wait;
              opacity: .65;
            }

            .rp-notes-spin {
              animation: rp-notes-spin .85s linear infinite;
            }

            @keyframes rp-notes-spin {
              to { transform: rotate(360deg); }
            }

            /* Error */
            .rp-notes-error {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 14px;
              margin: 0 0 22px;
              padding: 14px 16px;
              border: 1px solid #f0d8c3;
              border-radius: 14px;
              background: #fff8f2;
            }

            .rp-notes-error strong,
            .rp-notes-error span {
              display: block;
            }

            .rp-notes-error strong {
              color: #99501f;
              font-size: 12px;
            }

            .rp-notes-error span {
              margin-top: 4px;
              color: #846e5e;
              font-size: 11px;
              line-height: 1.5;
              overflow-wrap: anywhere;
            }

            .rp-notes-error button {
              display: inline-flex;
              flex: 0 0 auto;
              align-items: center;
              justify-content: center;
              gap: 7px;
              min-height: 36px;
              padding: 0 12px;
              border: 1px solid #ead3bf;
              border-radius: 10px;
              background: #fff;
              color: #8b4d26;
              font: inherit;
              font-size: 11px;
              font-weight: 750;
              cursor: pointer;
            }

            /* Section heading */
            .rp-notes-section-heading {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 15px;
              margin-bottom: 16px;
            }

            .rp-notes-section-heading > div > span {
              display: block;
              color: #97a19a;
              font-size: 9px;
              font-weight: 850;
              letter-spacing: .15em;
            }

            .rp-notes-section-heading h2 {
              margin: 5px 0 0;
              color: var(--rp-ink);
              font-size: 21px;
              letter-spacing: -.04em;
            }

            .rp-notes-section-heading p {
              max-width: 290px;
              margin: 0 0 2px;
              color: var(--rp-muted);
              font-size: 10px;
              line-height: 1.6;
              text-align: right;
            }

            /* Subject folders */
            .rp-subject-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(min(100%, 245px), 1fr));
              gap: 15px;
              min-width: 0;
            }

            .rp-subject-card {
              position: relative;
              display: flex;
              flex-direction: column;
              min-width: 0;
              min-height: 215px;
              overflow: hidden;
              padding: 17px;
              border: 1px solid var(--rp-border);
              border-radius: 18px;
              background:
                radial-gradient(circle at 100% 0%, rgba(19, 136, 8, .055), transparent 32%),
                radial-gradient(circle at 0% 100%, rgba(255, 153, 51, .055), transparent 32%),
                #fff;
              text-align: left;
              cursor: pointer;
              transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
            }

            .rp-subject-card::before {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              content: "";
              background: linear-gradient(90deg, #ff9933, #fff 50%, #138808);
            }

            .rp-subject-card:hover {
              transform: translateY(-3px);
              border-color: #b9d2bf;
              box-shadow: 0 16px 32px rgba(26, 71, 39, .09);
            }

            .rp-subject-card-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
            }

            .rp-subject-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              border: 1px solid #d9e6db;
              border-radius: 14px;
              background: linear-gradient(145deg, #fff1e2, #f3f8f4 55%, #e8f4eb);
              color: var(--rp-green);
            }

            .rp-subject-arrow {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border: 1px solid #e0e9e2;
              border-radius: 50%;
              background: #f4f8f5;
              color: #728077;
            }

            .rp-subject-card-copy {
              min-width: 0;
              padding: 18px 0 48px;
            }

            .rp-subject-code {
              display: block;
              color: var(--rp-green);
              font-size: 9px;
              font-weight: 900;
              letter-spacing: .13em;
              overflow-wrap: anywhere;
            }

            .rp-subject-card-copy h3 {
              margin: 6px 0 0;
              color: var(--rp-ink);
              font-size: 15px;
              font-weight: 800;
              line-height: 1.4;
              overflow-wrap: anywhere;
            }

            .rp-subject-card-copy p {
              margin: 7px 0 0;
              color: var(--rp-muted);
              font-size: 10px;
            }

            .rp-subject-card-footer {
              position: absolute;
              right: 17px;
              bottom: 14px;
              left: 17px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding-top: 10px;
              border-top: 1px solid #edf1ee;
              color: #8a978f;
              font-size: 8px;
              font-weight: 800;
              letter-spacing: .06em;
              text-transform: uppercase;
            }

            .rp-subject-footer-arrow {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #f5f8f6;
            }

            .rp-accent-0 .rp-subject-icon { color: #138808; }
            .rp-accent-1 .rp-subject-icon { color: #d97722; }
            .rp-accent-2 .rp-subject-icon { color: #244d8f; }

            /* Empty and loading */
            .rp-notes-empty {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 220px;
              padding: 25px;
              border: 1px dashed #cfdcd2;
              border-radius: 18px;
              background: #fff;
              text-align: center;
            }

            .rp-notes-empty-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 54px;
              height: 54px;
              border: 1px solid #dae7dd;
              border-radius: 16px;
              background: linear-gradient(135deg, #fff2e5, #ebf5ed);
              color: var(--rp-green);
            }

            .rp-notes-empty h3 {
              margin: 12px 0 4px;
              color: var(--rp-ink);
              font-size: 15px;
            }

            .rp-notes-empty p {
              margin: 0;
              color: var(--rp-muted);
              font-size: 11px;
              line-height: 1.6;
            }

            .rp-notes-empty button {
              margin-top: 13px;
              padding: 8px 12px;
              border: 1px solid #d4e6d7;
              border-radius: 9px;
              background: #f1f8f2;
              color: var(--rp-green-dark);
              font: inherit;
              font-size: 11px;
              font-weight: 750;
              cursor: pointer;
            }

            .rp-subject-skeleton {
              min-height: 215px;
              padding: 17px;
              border: 1px solid #e4ece6;
              border-radius: 18px;
              background: #f6f9f7;
              animation: rp-notes-pulse 1.45s ease-in-out infinite;
            }

            .rp-subject-skeleton div,
            .rp-subject-skeleton span {
              display: block;
              background: #e9efea;
              border-radius: 999px;
            }

            .rp-subject-skeleton div {
              width: 48px;
              height: 48px;
              border-radius: 14px;
            }

            .rp-subject-skeleton span {
              height: 8px;
              margin-top: 17px;
            }

            .rp-subject-skeleton span:nth-child(2) { width: 54px; }
            .rp-subject-skeleton span:nth-child(3) { width: 75%; height: 14px; margin-top: 10px; }
            .rp-subject-skeleton span:nth-child(4) { width: 48%; margin-top: 9px; }

            @keyframes rp-notes-pulse {
              0%, 100% { opacity: .55; }
              50% { opacity: 1; }
            }

            .rp-notes-page button:focus-visible {
              outline: 3px solid rgba(36, 77, 143, .35);
              outline-offset: 3px;
            }

            @media (max-width: 960px) {
              .rp-notes-hero {
                grid-template-columns: minmax(0, 1fr) 220px;
              }

              .rp-notes-section-heading {
                align-items: flex-start;
                flex-direction: column;
                gap: 6px;
              }

              .rp-notes-section-heading p {
                max-width: 450px;
                text-align: left;
              }

              .rp-subject-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 700px) {
              .rp-notes-hero {
                display: block;
                border-radius: 19px;
              }

              .rp-notes-hero-content {
                padding: 25px 20px 20px;
              }

              .rp-notes-hero h1 {
                font-size: 28px;
              }

              .rp-notes-hero-content > p {
                font-size: 11px;
              }

              .rp-notes-hero-art {
                min-height: 135px;
              }

              .rp-notes-art-card {
                top: 5px;
                right: 21px;
                width: 138px;
                height: 105px;
              }

              .rp-notes-art-card svg {
                width: 30px;
                height: 30px;
              }

              .rp-orbit-one {
                width: 220px;
                height: 220px;
                top: -40px;
                right: -70px;
              }

              .rp-orbit-two {
                width: 155px;
                height: 155px;
                top: -8px;
                right: -30px;
              }

              .rp-orbit-three {
                width: 98px;
                height: 98px;
                top: 20px;
                right: 5px;
              }

              .rp-notes-toolbar {
                grid-template-columns: minmax(0, 1fr);
                align-items: stretch;
              }

              .rp-notes-refresh {
                width: 100%;
              }

              .rp-subject-grid {
                grid-template-columns: minmax(0, 1fr);
              }

              .rp-subject-card {
                min-height: 190px;
              }

              .rp-notes-error {
                align-items: stretch;
                flex-direction: column;
              }

              .rp-notes-error button {
                width: 100%;
              }
            }

            @media (max-width: 420px) {
              .rp-notes-hero h1 {
                font-size: 24px;
              }

              .rp-notes-hero-meta {
                gap: 6px;
              }

              .rp-notes-hero-meta span:last-child {
                width: 100%;
              }

              .rp-notes-section-heading h2 {
                font-size: 19px;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .rp-notes-page *,
              .rp-notes-page *::before,
              .rp-notes-page *::after {
                animation-duration: .01ms !important;
                transition-duration: .01ms !important;
              }
            }
          `}</style>
        </div>
      </AppShell>
    );
  }

  /* =======================================================
     NOTES — MATERIALS INSIDE A SUBJECT FOLDER
  ======================================================= */

  if (resource === "notes" && selectedSubject) {
    return (
      <AppShell
        role="student"
        title={getSubjectCode(selectedSubject)}
        subtitle={getSubjectName(selectedSubject)}
      >
        <div className="page-wrap rp-notes-detail">
          <section className="rp-detail-hero">
            <button
              type="button"
              className="rp-detail-back"
              onClick={() => {
                setSelectedSubject(null);
                setSelected(null);
                setSearch("");
              }}
            >
              <ArrowLeft size={16} />
              Back to Subjects
            </button>

            <div className="rp-detail-hero-main">
              <div className="rp-detail-subject-icon">
                <BookOpen size={28} />
              </div>

              <div className="rp-detail-heading">
                <span className="rp-detail-eyebrow">
                  {getSubjectCode(selectedSubject)} · SUBJECT MATERIAL
                </span>

                <h1>{getSubjectName(selectedSubject)}</h1>

                <p>
                  All study materials uploaded for this subject,
                  organised in one place.
                </p>
              </div>
            </div>

            <div className="rp-detail-count">
              <strong>
                {loading ? "…" : selectedSubjectNotes.length}
              </strong>
              <span>Available materials</span>
            </div>
          </section>

          <section className="rp-detail-toolbar">
            <label className="rp-detail-search">
              <Search size={18} aria-hidden="true" />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search materials, topics or titles..."
                aria-label="Search materials"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </label>

            <button
              type="button"
              className="rp-detail-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "rp-detail-spin" : ""}
              />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
          </section>

          {error && (
            <div className="rp-detail-error" role="alert">
              <div>
                <strong>Unable to load materials</strong>
                <span>{error}</span>
              </div>

              <button type="button" onClick={handleRefresh}>
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="rp-material-grid">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div className="rp-material-skeleton" key={item}>
                  <div />
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : selectedSubjectNotes.length === 0 ? (
            <div className="rp-detail-empty">
              <div className="rp-detail-empty-icon">
                <FileText size={26} />
              </div>

              <h3>
                {search
                  ? "No materials found"
                  : "No materials uploaded yet"}
              </h3>

              <p>
                {search
                  ? "Try another title or topic."
                  : "Materials uploaded for this subject will appear here."}
              </p>

              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="rp-material-grid">
              {selectedSubjectNotes.map((item, index) => {
                const title = getTitle(item);
                const rawDate = item?.date || item?.created_at;

                return (
                  <article
                    className="rp-material-card"
                    key={item?.id || `${title}-${index}`}
                  >
                    <div className="rp-material-accent" />

                    <div className="rp-material-card-top">
                      <div className="rp-material-file-icon">
                        <FileText size={23} />
                      </div>

                      <span className="rp-material-pdf">
                        <span />
                        PDF
                      </span>
                    </div>

                    <div className="rp-material-copy">
                      <span className="rp-material-code">
                        {getSubjectCode(selectedSubject)}
                      </span>

                      <h3>{title}</h3>

                      <p>{getDescription(item)}</p>
                    </div>

                    <div className="rp-material-footer">
                      <small>
                        <CalendarDays size={13} />
                        <span>
                          {rawDate
                            ? formatDate(rawDate)
                            : "Recently added"}
                        </span>
                      </small>

                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="rp-material-view"
                      >
                        <span>View PDF</span>
                        <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* PDF modal */}
          {selected && (
            <div
              className="rp-detail-modal-backdrop"
              onMouseDown={() => setSelected(null)}
            >
              <section
                className="rp-detail-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rp-detail-modal-title"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="rp-detail-modal-accent" />

                <div className="rp-detail-modal-header">
                  <div>
                    <span className="rp-detail-modal-kicker">
                      <FileText size={14} />
                      STUDY MATERIAL
                    </span>

                    <h2 id="rp-detail-modal-title">
                      {getTitle(selected)}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="rp-detail-modal-x"
                    onClick={() => setSelected(null)}
                    aria-label="Close details"
                  >
                    <X size={19} />
                  </button>
                </div>

                <p className="rp-detail-modal-description">
                  {getDescription(selected)}
                </p>

                <div className="rp-detail-modal-info">
                  <div>
                    <span>Subject</span>
                    <strong>
                      {getSubjectCode(selectedSubject)} ·{" "}
                      {getSubjectName(selectedSubject)}
                    </strong>
                  </div>

                  <div>
                    <span>Date</span>
                    <strong>
                      {selected.date
                        ? formatDate(selected.date)
                        : selected.created_at
                          ? formatDate(selected.created_at)
                          : "—"}
                    </strong>
                  </div>

                  {selected.file_name && (
                    <div className="rp-detail-file-info">
                      <span>File</span>
                      <strong>{selected.file_name}</strong>
                    </div>
                  )}
                </div>

                <div className="rp-detail-modal-actions">
                  {(
                    selected.pdf_url ||
                    selected.pdf_path ||
                    selected.file_path
                  ) && (
                    <a
                      className="rp-detail-open-pdf"
                      href={
                        selected.pdf_url ||
                        selected.pdf_path ||
                        selected.file_path
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={16} />
                      <span>Open PDF</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="rp-detail-close"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                </div>
              </section>
            </div>
          )}

          <style jsx>{`
            .rp-notes-detail {
              --rd-ink: #17251f;
              --rd-muted: #6c7971;
              --rd-border: #dfe8e1;
              --rd-green: #138808;
              --rd-green-dark: #0d6238;
              --rd-saffron: #f28b2d;
              min-width: 0;
              padding-bottom: 35px;
            }

            .rp-detail-hero {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              align-items: center;
              gap: 18px 22px;
              min-width: 0;
              padding: 22px 24px;
              border: 1px solid var(--rd-border);
              border-radius: 21px;
              background:
                radial-gradient(circle at 100% 0%, rgba(255, 153, 51, .09), transparent 28%),
                radial-gradient(circle at 0% 100%, rgba(19, 136, 8, .06), transparent 29%),
                #fff;
              box-shadow: 0 10px 28px rgba(18, 61, 35, .045);
            }

            .rp-detail-back {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              justify-self: start;
              grid-column: 1 / -1;
              gap: 8px;
              min-height: 38px;
              padding: 0 13px;
              border: 1px solid #dfe8e1;
              border-radius: 10px;
              background: #f7faf7;
              color: #53675a;
              font: inherit;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              transition: .18s ease;
            }

            .rp-detail-back:hover {
              background: #edf7ef;
              border-color: #b8d5bf;
              color: var(--rd-green-dark);
              transform: translateX(-2px);
            }

            .rp-detail-hero-main {
              display: flex;
              align-items: center;
              gap: 16px;
              min-width: 0;
            }

            .rp-detail-subject-icon {
              display: flex;
              flex: 0 0 62px;
              align-items: center;
              justify-content: center;
              width: 62px;
              height: 62px;
              border: 1px solid #dfe8e1;
              border-radius: 16px;
              background: linear-gradient(145deg, #fff3e5, #f4faf5);
              color: var(--rd-green);
            }

            .rp-detail-heading {
              min-width: 0;
            }

            .rp-detail-eyebrow {
              display: block;
              color: var(--rd-green);
              font-size: 10px;
              font-weight: 850;
              letter-spacing: .11em;
              line-height: 1.5;
              overflow-wrap: anywhere;
            }

            .rp-detail-heading h1 {
              margin: 6px 0;
              color: var(--rd-ink);
              font-size: clamp(22px, 2.5vw, 31px);
              font-weight: 780;
              letter-spacing: -.045em;
              line-height: 1.2;
              overflow-wrap: anywhere;
            }

            .rp-detail-heading p {
              max-width: 650px;
              margin: 0;
              color: var(--rd-muted);
              font-size: 12px;
              line-height: 1.65;
            }

            .rp-detail-count {
              display: flex;
              flex: 0 0 155px;
              flex-direction: column;
              align-items: flex-end;
              justify-content: center;
              min-height: 80px;
              padding: 13px 16px;
              border: 1px solid var(--rd-border);
              border-radius: 15px;
              background: #f7faf7;
              text-align: right;
            }

            .rp-detail-count strong {
              color: var(--rd-green);
              font-size: 30px;
              font-weight: 800;
              letter-spacing: -.04em;
              line-height: 1;
            }

            .rp-detail-count span {
              margin-top: 7px;
              color: var(--rd-muted);
              font-size: 10px;
            }

            /* Search and refresh */
            .rp-detail-toolbar {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              align-items: center;
              gap: 12px;
              min-width: 0;
              margin: 18px 0 25px;
            }

            .rp-detail-search {
              display: flex;
              align-items: center;
              gap: 10px;
              min-width: 0;
              min-height: 48px;
              padding: 0 13px;
              border: 1px solid #dfe8e1;
              border-radius: 13px;
              background: #fff;
              color: #78877e;
              box-shadow: 0 5px 15px rgba(20, 55, 34, .025);
              transition: border-color .18s ease, box-shadow .18s ease;
            }

            .rp-detail-search:focus-within {
              border-color: #79b58a;
              box-shadow: 0 0 0 3px rgba(19, 136, 8, .08);
            }

            .rp-detail-search > svg {
              flex: 0 0 auto;
              color: #78877e;
            }

            .rp-detail-search input {
              flex: 1 1 auto;
              width: 100%;
              min-width: 0;
              height: 46px;
              padding: 0;
              border: 0;
              border-radius: 0;
              outline: none;
              appearance: none;
              background: transparent;
              color: var(--rd-ink);
              box-shadow: none;
              font: inherit;
              font-size: 13px;
            }

            .rp-detail-search input::placeholder {
              color: #98a39b;
              opacity: 1;
            }

            .rp-detail-search input::-webkit-search-cancel-button {
              display: none;
            }

            .rp-detail-search button {
              display: inline-flex;
              flex: 0 0 27px;
              align-items: center;
              justify-content: center;
              width: 27px;
              height: 27px;
              padding: 0;
              border: 0;
              border-radius: 50%;
              background: #edf4ee;
              color: #5d7063;
              cursor: pointer;
            }

            .rp-detail-search button:hover {
              background: #e1efe4;
              color: var(--rd-green-dark);
            }

            .rp-detail-refresh {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-width: 110px;
              min-height: 48px;
              padding: 0 15px;
              border: 1px solid #cfe0d2;
              border-radius: 12px;
              background: #fff;
              color: #176d37;
              font: inherit;
              font-size: 12px;
              font-weight: 750;
              white-space: nowrap;
              cursor: pointer;
              transition: .18s ease;
            }

            .rp-detail-refresh svg {
              flex: 0 0 auto;
              color: var(--rd-green);
            }

            .rp-detail-refresh:hover:not(:disabled) {
              transform: translateY(-1px);
              border-color: #a9cdb1;
              background: #f1f8f2;
              box-shadow: 0 7px 17px rgba(18, 91, 47, .07);
            }

            .rp-detail-refresh:disabled {
              opacity: .65;
              cursor: wait;
            }

            .rp-detail-spin {
              animation: rp-detail-spin .85s linear infinite;
            }

            @keyframes rp-detail-spin {
              to { transform: rotate(360deg); }
            }

            .rp-detail-error {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 14px;
              margin: 0 0 22px;
              padding: 14px 16px;
              border: 1px solid #f0d8c3;
              border-radius: 14px;
              background: #fff8f2;
            }

            .rp-detail-error strong,
            .rp-detail-error span {
              display: block;
            }

            .rp-detail-error strong {
              color: #99501f;
              font-size: 12px;
            }

            .rp-detail-error span {
              margin-top: 4px;
              color: #846e5e;
              font-size: 11px;
              line-height: 1.5;
              overflow-wrap: anywhere;
            }

            .rp-detail-error button {
              display: inline-flex;
              flex: 0 0 auto;
              align-items: center;
              justify-content: center;
              gap: 7px;
              min-height: 36px;
              padding: 0 12px;
              border: 1px solid #ead3bf;
              border-radius: 10px;
              background: #fff;
              color: #8b4d26;
              font: inherit;
              font-size: 11px;
              font-weight: 750;
              cursor: pointer;
            }

            /* PDF cards */
            .rp-material-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(min(100%, 285px), 1fr));
              align-items: stretch;
              gap: 17px;
              min-width: 0;
            }

            .rp-material-card {
              position: relative;
              display: flex;
              flex-direction: column;
              min-width: 0;
              min-height: 265px;
              overflow: hidden;
              padding: 18px;
              border: 1px solid var(--rd-border);
              border-radius: 18px;
              background: #fff;
              box-shadow: 0 7px 22px rgba(20, 55, 34, .035);
              transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
            }

            .rp-material-card:hover {
              transform: translateY(-3px);
              border-color: #b9d3bf;
              box-shadow: 0 17px 35px rgba(20, 65, 36, .085);
            }

            .rp-material-accent {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #ff9933, #fff 48%, #138808);
            }

            .rp-material-card-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              min-width: 0;
            }

            .rp-material-file-icon {
              display: flex;
              flex: 0 0 48px;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              border: 1px solid #f3dfcc;
              border-radius: 13px;
              background: #fff3e7;
              color: #e87825;
            }

            .rp-material-pdf {
              display: inline-flex;
              flex: 0 0 auto;
              align-items: center;
              gap: 6px;
              min-height: 28px;
              padding: 0 10px;
              border: 1px solid #cfe3d2;
              border-radius: 9px;
              background: #eff8f0;
              color: #167b31;
              font-size: 10px;
              font-weight: 850;
            }

            .rp-material-pdf > span {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #168b35;
            }

            .rp-material-copy {
              min-width: 0;
              padding: 18px 0 16px;
            }

            .rp-material-code {
              display: block;
              color: var(--rd-green);
              font-size: 9px;
              font-weight: 850;
              letter-spacing: .1em;
              overflow-wrap: anywhere;
            }

            .rp-material-copy h3 {
              margin: 7px 0 8px;
              color: var(--rd-ink);
              font-size: 15px;
              font-weight: 760;
              line-height: 1.4;
              letter-spacing: -.025em;
              overflow-wrap: anywhere;
            }

            .rp-material-copy p {
              display: -webkit-box;
              margin: 0;
              overflow: hidden;
              color: var(--rd-muted);
              font-size: 11px;
              line-height: 1.65;
              overflow-wrap: anywhere;
              -webkit-box-orient: vertical;
              -webkit-line-clamp: 4;
            }

            .rp-material-footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 10px;
              min-width: 0;
              margin-top: auto;
              padding-top: 13px;
              border-top: 1px solid #edf1ee;
            }

            .rp-material-footer small {
              display: inline-flex;
              flex: 1 1 100px;
              align-items: center;
              gap: 6px;
              min-width: 0;
              color: #829087;
              font-size: 10px;
              overflow-wrap: anywhere;
            }

            .rp-material-footer small svg {
              flex: 0 0 auto;
              color: #92a097;
            }

            .rp-material-view {
              display: inline-flex;
              flex: 0 0 auto;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-width: 100px;
              min-height: 39px;
              padding: 0 13px;
              border: 0;
              border-radius: 10px;
              background: linear-gradient(105deg, #f28b2d, #138808);
              color: #fff;
              box-shadow: 0 7px 16px rgba(25, 112, 47, .12);
              font: inherit;
              font-size: 11px;
              font-weight: 800;
              white-space: nowrap;
              cursor: pointer;
              transition: transform .18s ease, box-shadow .18s ease;
            }

            .rp-material-view:hover {
              transform: translateY(-1px);
              box-shadow: 0 10px 21px rgba(25, 112, 47, .19);
            }

            /* Empty/loading */
            .rp-detail-empty {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 250px;
              padding: 28px 20px;
              border: 1px dashed #d5e2d8;
              border-radius: 18px;
              background: #fff;
              text-align: center;
            }

            .rp-detail-empty-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 58px;
              height: 58px;
              border: 1px solid #e0e9e2;
              border-radius: 16px;
              background: linear-gradient(135deg, #fff2e5, #eef7f0);
              color: var(--rd-green);
            }

            .rp-detail-empty h3 {
              margin: 15px 0 6px;
              color: var(--rd-ink);
              font-size: 16px;
            }

            .rp-detail-empty p {
              margin: 0;
              color: var(--rd-muted);
              font-size: 12px;
              line-height: 1.6;
            }

            .rp-detail-empty button {
              margin-top: 15px;
              padding: 9px 13px;
              border: 1px solid #d4e6d7;
              border-radius: 9px;
              background: #f1f8f2;
              color: var(--rd-green-dark);
              font: inherit;
              font-size: 11px;
              font-weight: 750;
              cursor: pointer;
            }

            .rp-material-skeleton {
              min-height: 265px;
              padding: 18px;
              border: 1px solid #e5ece6;
              border-radius: 18px;
              background: #f8faf8;
              animation: rp-detail-pulse 1.4s ease-in-out infinite;
            }

            .rp-material-skeleton div,
            .rp-material-skeleton span {
              display: block;
              border-radius: 9px;
              background: #e9efea;
            }

            .rp-material-skeleton div {
              width: 48px;
              height: 48px;
              border-radius: 13px;
            }

            .rp-material-skeleton span {
              width: 100%;
              height: 9px;
              margin-top: 18px;
            }

            .rp-material-skeleton span:nth-child(2) {
              width: 65px;
              height: 8px;
              margin-top: 20px;
            }

            .rp-material-skeleton span:nth-child(3) {
              width: 82%;
              height: 16px;
              margin-top: 12px;
            }

            .rp-material-skeleton span:nth-child(4) {
              width: 62%;
              margin-top: 10px;
            }

            @keyframes rp-detail-pulse {
              0%, 100% { opacity: .55; }
              50% { opacity: 1; }
            }

            /* Details modal */
            .rp-detail-modal-backdrop {
              position: fixed;
              z-index: 9999;
              inset: 0;
              display: grid;
              place-items: center;
              overflow-y: auto;
              padding: 22px;
              background: rgba(14, 29, 20, .53);
              backdrop-filter: blur(5px);
            }

            .rp-detail-modal {
              position: relative;
              width: 100%;
              max-width: 560px;
              max-height: 88vh;
              min-width: 0;
              overflow-y: auto;
              box-sizing: border-box;
              padding: 25px;
              border: 1px solid #e1eae3;
              border-radius: 20px;
              background: #fff;
              box-shadow: 0 26px 80px rgba(8, 31, 17, .25);
            }

            .rp-detail-modal-accent {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #ff9933, #fff 48%, #138808);
            }

            .rp-detail-modal-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 15px;
              min-width: 0;
            }

            .rp-detail-modal-header > div {
              min-width: 0;
            }

            .rp-detail-modal-kicker {
              display: inline-flex;
              align-items: center;
              gap: 7px;
              color: var(--rd-green);
              font-size: 10px;
              font-weight: 850;
              letter-spacing: .12em;
            }

            .rp-detail-modal-header h2 {
              margin: 9px 0 0;
              color: var(--rd-ink);
              font-size: 21px;
              font-weight: 780;
              line-height: 1.35;
              letter-spacing: -.035em;
              overflow-wrap: anywhere;
            }

            .rp-detail-modal-x {
              display: flex;
              flex: 0 0 38px;
              align-items: center;
              justify-content: center;
              width: 38px;
              height: 38px;
              padding: 0;
              border: 1px solid #e3eae4;
              border-radius: 11px;
              background: #f4f7f4;
              color: #5b6c60;
              cursor: pointer;
            }

            .rp-detail-modal-x:hover {
              background: #edf5ee;
              color: var(--rd-green-dark);
            }

            .rp-detail-modal-description {
              margin: 17px 0 20px;
              color: var(--rd-muted);
              font-size: 12px;
              line-height: 1.75;
              overflow-wrap: anywhere;
            }

            .rp-detail-modal-info {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              overflow: hidden;
              border: 1px solid #e6ede7;
              border-radius: 14px;
              background: #f8faf8;
            }

            .rp-detail-modal-info > div {
              display: flex;
              flex-direction: column;
              gap: 6px;
              min-width: 0;
              padding: 13px 14px;
            }

            .rp-detail-modal-info > div:nth-child(even) {
              border-left: 1px solid #e6ede7;
            }

            .rp-detail-modal-info > div:nth-child(n + 3) {
              border-top: 1px solid #e6ede7;
            }

            .rp-detail-modal-info span {
              color: #829087;
              font-size: 10px;
              font-weight: 700;
            }

            .rp-detail-modal-info strong {
              color: var(--rd-ink);
              font-size: 11px;
              font-weight: 700;
              line-height: 1.5;
              overflow-wrap: anywhere;
            }

            .rp-detail-file-info {
              grid-column: 1 / -1;
            }

            .rp-detail-modal-actions {
              display: flex;
              align-items: center;
              justify-content: flex-end;
              flex-wrap: wrap;
              gap: 10px;
              min-width: 0;
              margin-top: 22px;
            }

            .rp-detail-open-pdf,
            .rp-detail-close {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-height: 42px;
              padding: 0 17px;
              border: 1px solid transparent;
              border-radius: 11px;
              font: inherit;
              font-size: 12px;
              font-weight: 800;
              text-decoration: none;
              cursor: pointer;
              box-sizing: border-box;
              transition: .18s ease;
            }

            .rp-detail-open-pdf {
              background: linear-gradient(105deg, #f28b2d, #138808);
              color: #fff;
              box-shadow: 0 8px 18px rgba(25, 112, 47, .13);
            }

            .rp-detail-open-pdf:hover {
              transform: translateY(-1px);
              box-shadow: 0 11px 22px rgba(25, 112, 47, .2);
            }

            .rp-detail-close {
              border-color: #dce6de;
              background: #fff;
              color: #53665a;
            }

            .rp-detail-close:hover {
              border-color: #b9d0be;
              background: #f4f8f5;
              color: var(--rd-green-dark);
            }

            .rp-notes-detail button:focus-visible,
            .rp-notes-detail a:focus-visible {
              outline: 3px solid rgba(36, 77, 143, .33);
              outline-offset: 3px;
            }

            @media (max-width: 900px) {
              .rp-detail-hero {
                padding: 20px;
              }

              .rp-material-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 700px) {
              .rp-detail-hero {
                grid-template-columns: minmax(0, 1fr);
                border-radius: 18px;
                padding: 17px;
              }

              .rp-detail-back {
                grid-column: auto;
              }

              .rp-detail-hero-main {
                align-items: flex-start;
                gap: 12px;
              }

              .rp-detail-subject-icon {
                flex-basis: 50px;
                width: 50px;
                height: 50px;
                border-radius: 14px;
              }

              .rp-detail-subject-icon svg {
                width: 23px;
                height: 23px;
              }

              .rp-detail-heading h1 {
                font-size: 22px;
              }

              .rp-detail-heading p {
                font-size: 11px;
              }

              .rp-detail-count {
                align-items: flex-start;
                width: 100%;
                min-height: 0;
                flex-basis: auto;
                text-align: left;
              }

              .rp-detail-toolbar {
                grid-template-columns: minmax(0, 1fr);
                margin: 14px 0 20px;
              }

              .rp-detail-refresh {
                width: 100%;
              }

              .rp-material-grid {
                grid-template-columns: minmax(0, 1fr);
                gap: 13px;
              }

              .rp-material-card {
                min-height: 245px;
                padding: 16px;
              }

              .rp-detail-error {
                align-items: stretch;
                flex-direction: column;
              }

              .rp-detail-error button {
                width: 100%;
              }

              .rp-detail-modal-backdrop {
                padding: 12px;
              }

              .rp-detail-modal {
                padding: 20px 17px;
                border-radius: 17px;
              }
            }

            @media (max-width: 420px) {
              .rp-material-footer {
                align-items: stretch;
                flex-direction: column;
              }

              .rp-material-view {
                width: 100%;
                min-height: 40px;
              }

              .rp-detail-modal-actions {
                align-items: stretch;
                flex-direction: column;
              }

              .rp-detail-open-pdf,
              .rp-detail-close {
                width: 100%;
              }

              .rp-detail-modal-info {
                grid-template-columns: minmax(0, 1fr);
              }

              .rp-detail-modal-info > div:nth-child(even) {
                border-left: 0;
              }

              .rp-detail-modal-info > div:nth-child(n + 2) {
                border-top: 1px solid #e6ede7;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .rp-notes-detail *,
              .rp-notes-detail *::before,
              .rp-notes-detail *::after {
                animation-duration: .01ms !important;
                transition-duration: .01ms !important;
              }
            }
          `}</style>
        </div>
      </AppShell>
    );
  }

  /* =======================================================
     OTHER STUDENT RESOURCES
======================================================= */

  const resourceTone = (item) => {
    if (String(item?.status || "").toLowerCase() === "verified") {
      return "green";
    }

    if (String(item?.priority || "").toLowerCase() === "important") {
      return "pink";
    }

    return "blue";
  };

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
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${resource}...`}
              aria-label={`Search ${resource}`}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
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
              className={refreshing ? "spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="resource-error" role="alert">
            <strong>Unable to load data</strong>
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
            {[1, 2, 3, 4].map((item) => (
              <div className="skeleton-card" key={item} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
          <div className={`resource-grid ${resource}`}>
            {filtered.map((item, index) => {
              const title = getTitle(item);
              const description = getDescription(item);
              const status = getStatus(item);

              return (
                <article
                  className="resource-card"
                  key={item?.id || `${title}-${index}`}
                >
                  <div className="resource-card-top">
                    <span className="resource-icon">
                      <Icon size={19} />
                    </span>

                    <Status tone={resourceTone(item)}>
                      {status}
                    </Status>
                  </div>

                  <h3>{title}</h3>
                  <p>{description}</p>

                  <div className="resource-meta">
                    <small>{getMeta(item, resource)}</small>

                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                    >
                      View <span>→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selected && (
          <div
            className="modal-backdrop"
            onMouseDown={() => setSelected(null)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="resource-modal-title"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-head">
                <div>
                  <span>ACADEMIC ITEM</span>
                  <h3 id="resource-modal-title">
                    {getTitle(selected)}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="modal-description">
                {getDescription(selected)}
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
                    ? formatDate(selected.date)
                    : selected.due_date
                      ? formatDate(selected.due_date)
                      : selected.created_at
                        ? formatDate(selected.created_at)
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
                selected.pdf_path ||
                selected.file_path
              ) && (
                <a
                  className="primary-button full"
                  href={
                    selected.pdf_url ||
                    selected.pdf_path ||
                    selected.file_path
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={17} />
                  Open PDF
                </a>
              )}

              <button
                type="button"
                className="primary-button full"
                onClick={() => setSelected(null)}
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