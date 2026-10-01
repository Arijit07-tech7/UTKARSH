"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileText,
  FolderOpen,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { PageHeader, Status } from "@/components/ui";

const pageStyles = {
  shell: {
    width: "100%",
  },

  topBar: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 24,
    flexWrap: "wrap",
  },

  titleBlock: {
    minWidth: 0,
  },

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  title: {
    margin: 0,
    fontSize: "clamp(28px, 4vw, 42px)",
    lineHeight: 1.05,
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    margin: "10px 0 0",
    fontSize: 15,
    lineHeight: 1.6,
    opacity: 0.72,
    maxWidth: 650,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    border: "1px solid rgba(15, 23, 42, 0.08)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(250,252,250,0.96))",
    boxShadow:
      "0 18px 50px rgba(15, 23, 42, 0.08)",
    padding: 22,
    marginBottom: 18,
  },

  heroGlow: {
    position: "absolute",
    inset: "auto -80px -100px auto",
    width: 240,
    height: 240,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(19,136,8,0.10), transparent 68%)",
    pointerEvents: "none",
  },

  breadcrumb: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    opacity: 0.72,
    marginBottom: 16,
  },

  heroContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },

  heroIcon: {
    width: 58,
    height: 58,
    flex: "0 0 58px",
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background:
      "linear-gradient(145deg, rgba(255,153,51,0.14), rgba(19,136,8,0.10))",
    border: "1px solid rgba(19,136,8,0.13)",
  },

  heroInfo: {
    minWidth: 0,
    flex: 1,
  },

  heroLabel: {
    margin: "0 0 5px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    opacity: 0.56,
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(20px, 3vw, 28px)",
    fontWeight: 800,
    lineHeight: 1.2,
  },

  heroMeta: {
    margin: "7px 0 0",
    fontSize: 14,
    opacity: 0.7,
  },

  yearBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 13px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    background:
      "linear-gradient(135deg, rgba(255,153,51,0.12), rgba(19,136,8,0.10))",
    border:
      "1px solid rgba(15,23,42,0.07)",
    whiteSpace: "nowrap",
  },

  tools: {
    display: "flex",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  searchWrap: {
    flex: 1,
    minWidth: 260,
    position: "relative",
  },

  searchIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.48,
    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    minHeight: 50,
    borderRadius: 15,
    border:
      "1px solid rgba(15, 23, 42, 0.09)",
    background: "rgba(255,255,255,0.92)",
    padding: "0 45px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },

  clearBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    width: 30,
    height: 30,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    border:
      "1px solid rgba(15,23,42,0.07)",
    background: "#fff",
    cursor: "pointer",
  },

  refreshBtn: {
    minHeight: 50,
    padding: "0 16px",
    borderRadius: 15,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 800,
    fontSize: 13,
    border:
      "1px solid rgba(15,23,42,0.09)",
    background: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(230px, 1fr))",
    gap: 16,
  },

  folderCard: {
    position: "relative",
    overflow: "hidden",
    textAlign: "left",
    borderRadius: 22,
    border:
      "1px solid rgba(15,23,42,0.07)",
    background: "#fff",
    padding: 20,
    cursor: "pointer",
    boxShadow:
      "0 12px 32px rgba(15,23,42,0.055)",
    transition:
      "transform .2s ease, box-shadow .2s ease",
  },

  folderTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  folderIcon: {
    width: 48,
    height: 48,
    display: "grid",
    placeItems: "center",
    borderRadius: 16,
    background:
      "linear-gradient(145deg, rgba(255,153,51,0.13), rgba(19,136,8,0.10))",
    border:
      "1px solid rgba(19,136,8,0.10)",
  },

  folderArrow: {
    width: 32,
    height: 32,
    display: "grid",
    placeItems: "center",
    borderRadius: 11,
    background:
      "rgba(15,23,42,0.04)",
  },

  code: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    opacity: 0.58,
    marginBottom: 8,
  },

  folderTitle: {
    margin: 0,
    fontSize: 18,
    lineHeight: 1.3,
    fontWeight: 800,
  },

  folderDescription: {
    margin: "8px 0 0",
    fontSize: 13,
    lineHeight: 1.55,
    opacity: 0.62,
  },

  workspaceTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },

  backBtn: {
    minHeight: 44,
    padding: "0 13px",
    borderRadius: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border:
      "1px solid rgba(15,23,42,0.09)",
    background: "#fff",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },

  workspaceCard: {
    flex: 1,
    minWidth: 240,
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderRadius: 18,
    border:
      "1px solid rgba(15,23,42,0.07)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(249,250,248,0.95))",
  },

  workspaceIcon: {
    width: 48,
    height: 48,
    flex: "0 0 48px",
    display: "grid",
    placeItems: "center",
    borderRadius: 15,
    background:
      "linear-gradient(145deg, rgba(255,153,51,0.13), rgba(19,136,8,0.10))",
  },

  workspaceSmall: {
    display: "block",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    opacity: 0.52,
    marginBottom: 4,
  },

  workspaceTitle: {
    margin: 0,
    fontSize: 19,
    fontWeight: 800,
  },

  workspaceSub: {
    margin: "4px 0 0",
    fontSize: 13,
    opacity: 0.62,
  },

  paperList: {
    display: "grid",
    gap: 12,
  },

  paperCard: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0,1fr) auto",
    alignItems: "center",
    gap: 15,
    padding: 16,
    borderRadius: 20,
    border:
      "1px solid rgba(15,23,42,0.07)",
    background: "#fff",
    boxShadow:
      "0 10px 26px rgba(15,23,42,0.045)",
  },

  paperIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    display: "grid",
    placeItems: "center",
    background:
      "rgba(19,136,8,0.08)",
    border:
      "1px solid rgba(19,136,8,0.10)",
  },

  paperMain: {
    minWidth: 0,
  },

  paperTitle: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.4,
    fontWeight: 800,
  },

  paperMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    fontSize: 12,
    opacity: 0.60,
  },

  paperFile: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.72,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 420,
  },

  paperActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  openBtn: {
    minHeight: 42,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    border: 0,
    background:
      "linear-gradient(135deg, #ff9933 0%, #f47b20 52%, #138808 100%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    textDecoration: "none",
    whiteSpace: "nowrap",
    boxShadow:
      "0 10px 22px rgba(244,123,32,0.22)",
  },

  empty: {
    textAlign: "center",
    padding: "54px 20px",
    borderRadius: 22,
    border:
      "1px dashed rgba(15,23,42,0.13)",
    background:
      "linear-gradient(145deg, rgba(255,153,51,0.035), rgba(19,136,8,0.035))",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    margin: "0 auto 14px",
    borderRadius: 18,
    display: "grid",
    placeItems: "center",
    background: "#fff",
    border:
      "1px solid rgba(15,23,42,0.07)",
  },

  emptyTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
  },

  emptyText: {
    margin: "8px auto 0",
    maxWidth: 460,
    fontSize: 13,
    lineHeight: 1.6,
    opacity: 0.62,
  },

  error: {
    marginBottom: 16,
    padding: "12px 14px",
    borderRadius: 14,
    border:
      "1px solid rgba(185,28,28,0.12)",
    background:
      "rgba(185,28,28,0.06)",
    color: "#991b1b",
    fontSize: 13,
    fontWeight: 700,
  },
};

function uniqueById(items) {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter(
    (item) => {
      if (!item?.id || seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    }
  );
}

export default function PYQResourcePage() {
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [papers, setPapers] = useState([]);

  const [selectedSubject, setSelectedSubject] =
    useState(null);

  const [selectedYear, setSelectedYear] =
    useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [yearsLoading, setYearsLoading] =
    useState(false);
  const [papersLoading, setPapersLoading] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  /* =========================================================
     LOAD SUBJECTS
  ========================================================= */

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/pyq?view=subjects",
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            "Could not load PYQ subjects."
        );
      }

      setSubjects(uniqueById(result.data));
    } catch (err) {
      console.error(
        "Student PYQ subjects:",
        err
      );

      setSubjects([]);

      setError(
        err?.message ||
          "Unable to load PYQ subjects."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     LOAD YEARS
  ========================================================= */

  const loadYears = useCallback(
    async (subjectId) => {
      if (!subjectId) return;

      try {
        setYearsLoading(true);
        setError("");

        const response = await fetch(
          `/api/pyq?view=years&subject_id=${encodeURIComponent(
            subjectId
          )}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
              "Could not load PYQ years."
          );
        }

        setYears(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (err) {
        console.error(
          "Student PYQ years:",
          err
        );

        setYears([]);

        setError(
          err?.message ||
            "Unable to load PYQ years."
        );
      } finally {
        setYearsLoading(false);
      }
    },
    []
  );

  /* =========================================================
     LOAD PAPERS
  ========================================================= */

  const loadPapers = useCallback(
    async (yearId) => {
      if (!yearId) return;

      try {
        setPapersLoading(true);
        setError("");

        const response = await fetch(
          `/api/pyq?view=papers&year_id=${encodeURIComponent(
            yearId
          )}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
              "Could not load question papers."
          );
        }

        setPapers(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (err) {
        console.error(
          "Student PYQ papers:",
          err
        );

        setPapers([]);

        setError(
          err?.message ||
            "Unable to load question papers."
        );
      } finally {
        setPapersLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return subjects;

    return subjects.filter((subject) =>
      `${subject.subject_code || ""} ${
        subject.subject_name || ""
      }`
        .toLowerCase()
        .includes(term)
    );
  }, [subjects, search]);

  const filteredYears = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return years;

    return years.filter((year) =>
      String(year.year)
        .toLowerCase()
        .includes(term)
    );
  }, [years, search]);

  const filteredPapers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return papers;

    return papers.filter((paper) =>
      `${paper.title || ""} ${
        paper.file_name || ""
      } ${paper.serial_no || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [papers, search]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  async function openSubject(subject) {
    setSelectedSubject(subject);
    setSelectedYear(null);
    setYears([]);
    setPapers([]);
    setSearch("");
    setError("");

    await loadYears(subject.id);
  }

  function backToSubjects() {
    setSelectedSubject(null);
    setSelectedYear(null);
    setYears([]);
    setPapers([]);
    setSearch("");
    setError("");
  }

  async function openYear(year) {
    setSelectedYear(year);
    setPapers([]);
    setSearch("");
    setError("");

    await loadPapers(year.id);
  }

  function backToYears() {
    setSelectedYear(null);
    setPapers([]);
    setSearch("");
    setError("");
  }

  async function refreshCurrent() {
    try {
      setRefreshing(true);

      if (!selectedSubject) {
        await loadSubjects();
        return;
      }

      if (!selectedYear) {
        await loadYears(selectedSubject.id);
        return;
      }

      await loadPapers(selectedYear.id);
    } finally {
      setRefreshing(false);
    }
  }

  /* =========================================================
     SUBJECT VIEW
  ========================================================= */

  function renderSubjects() {
    return (
      <>
        <div style={pageStyles.topBar}>
          <div style={pageStyles.titleBlock}>
            <span style={pageStyles.eyebrow}>
              <BookOpen size={13} />
              ACADEMIC SPACE
            </span>

            <h1 style={pageStyles.title}>
              Previous Year Questions
            </h1>

            <p style={pageStyles.subtitle}>
              Browse question papers by subject
              and examination year.
            </p>
          </div>
        </div>

        <div style={pageStyles.tools}>
          <div style={pageStyles.searchWrap}>
            <Search
              size={18}
              style={pageStyles.searchIcon}
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subjects..."
              style={pageStyles.searchInput}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={pageStyles.clearBtn}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={refreshCurrent}
            disabled={refreshing || loading}
            style={pageStyles.refreshBtn}
          >
            <RefreshCw
              size={16}
              style={{
                transform: refreshing
                  ? "rotate(360deg)"
                  : "none",
                transition:
                  "transform .6s linear",
              }}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={pageStyles.cardGrid}>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  height: 190,
                  borderRadius: 22,
                  background:
                    "rgba(15,23,42,0.05)",
                }}
              />
            ))}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div style={pageStyles.empty}>
            <div style={pageStyles.emptyIcon}>
              <FolderOpen size={27} />
            </div>

            <h3 style={pageStyles.emptyTitle}>
              No PYQ subjects available
            </h3>

            <p style={pageStyles.emptyText}>
              Previous year question papers will
              appear here when published by the
              administrator.
            </p>
          </div>
        ) : (
          <div style={pageStyles.cardGrid}>
            {filteredSubjects.map((subject) => (
              <button
                type="button"
                key={subject.id}
                onClick={() => openSubject(subject)}
                style={pageStyles.folderCard}
              >
                <div style={pageStyles.folderTop}>
                  <span style={pageStyles.folderIcon}>
                    <FolderOpen
                      size={22}
                      color="#138808"
                    />
                  </span>

                  <span
                    style={pageStyles.folderArrow}
                  >
                    <ExternalLink size={14} />
                  </span>
                </div>

                <div style={pageStyles.code}>
                  {subject.subject_code}
                </div>

                <h3 style={pageStyles.folderTitle}>
                  {subject.subject_name}
                </h3>

                <p
                  style={pageStyles.folderDescription}
                >
                  View previous year question papers
                  for this subject.
                </p>
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  /* =========================================================
     YEAR VIEW
  ========================================================= */

  function renderYears() {
    return (
      <>
        <div style={pageStyles.heroCard}>
          <div style={pageStyles.heroGlow} />

          <div
            style={{
              ...pageStyles.breadcrumb,
              position: "relative",
              zIndex: 1,
            }}
          >
            PYQ
            <span>•</span>
            Subject
          </div>

          <div style={pageStyles.heroContent}>
            <button
              type="button"
              onClick={backToSubjects}
              style={pageStyles.backBtn}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div style={pageStyles.workspaceCard}>
              <div style={pageStyles.workspaceIcon}>
                <FolderOpen
                  size={24}
                  color="#138808"
                />
              </div>

              <div>
                <span
                  style={
                    pageStyles.workspaceSmall
                  }
                >
                  {selectedSubject?.subject_code}
                </span>

                <h2
                  style={
                    pageStyles.workspaceTitle
                  }
                >
                  {selectedSubject?.subject_name}
                </h2>

                <p
                  style={pageStyles.workspaceSub}
                >
                  Select an examination year
                  to view question papers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={pageStyles.tools}>
          <div style={pageStyles.searchWrap}>
            <Search
              size={18}
              style={pageStyles.searchIcon}
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search years..."
              style={pageStyles.searchInput}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={pageStyles.clearBtn}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={refreshCurrent}
            disabled={
              refreshing || yearsLoading
            }
            style={pageStyles.refreshBtn}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {yearsLoading ? (
          <div style={pageStyles.cardGrid}>
            {[1, 2].map((item) => (
              <div
                key={item}
                style={{
                  height: 175,
                  borderRadius: 22,
                  background:
                    "rgba(15,23,42,0.05)",
                }}
              />
            ))}
          </div>
        ) : filteredYears.length === 0 ? (
          <div style={pageStyles.empty}>
            <div style={pageStyles.emptyIcon}>
              <FolderOpen size={27} />
            </div>

            <h3 style={pageStyles.emptyTitle}>
              No year folders available
            </h3>

            <p style={pageStyles.emptyText}>
              No published question-paper years
              are available for this subject yet.
            </p>
          </div>
        ) : (
          <div style={pageStyles.cardGrid}>
            {filteredYears.map((year) => (
              <button
                key={year.id}
                type="button"
                onClick={() => openYear(year)}
                style={pageStyles.folderCard}
              >
                <div style={pageStyles.folderTop}>
                  <span style={pageStyles.folderIcon}>
                    <FolderOpen
                      size={22}
                      color="#138808"
                    />
                  </span>

                  <span
                    style={pageStyles.folderArrow}
                  >
                    <ExternalLink size={14} />
                  </span>
                </div>

                <div style={pageStyles.code}>
                  QUESTION PAPERS
                </div>

                <h3 style={pageStyles.folderTitle}>
                  {year.year}
                </h3>

                <p
                  style={pageStyles.folderDescription}
                >
                  Open this year to browse all
                  available question papers.
                </p>
              </button>
            ))}
          </div>
        )}
      </>
    );
  }

  /* =========================================================
     PAPER VIEW
  ========================================================= */

  function renderPapers() {
    return (
      <>
        <div style={pageStyles.heroCard}>
          <div style={pageStyles.heroGlow} />

          <div
            style={{
              ...pageStyles.breadcrumb,
              position: "relative",
              zIndex: 1,
            }}
          >
            PYQ
            <span>•</span>
            {selectedSubject?.subject_code}
            <span>•</span>
            {selectedYear?.year}
          </div>

          <div style={pageStyles.heroContent}>
            <button
              type="button"
              onClick={backToYears}
              style={pageStyles.backBtn}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div style={pageStyles.workspaceCard}>
              <div style={pageStyles.workspaceIcon}>
                <FileText
                  size={24}
                  color="#138808"
                />
              </div>

              <div style={pageStyles.heroInfo}>
                <span
                  style={pageStyles.heroLabel}
                >
                  QUESTION PAPERS
                </span>

                <h2
                  style={pageStyles.heroTitle}
                >
                  {selectedSubject?.subject_name}
                </h2>

                <p
                  style={pageStyles.heroMeta}
                >
                  {selectedSubject?.subject_code}
                  {" "}
                  •
                  {" "}
                  Previous year papers
                </p>
              </div>

              <span style={pageStyles.yearBadge}>
                {selectedYear?.year}
              </span>
            </div>
          </div>
        </div>

        <div style={pageStyles.tools}>
          <div style={pageStyles.searchWrap}>
            <Search
              size={18}
              style={pageStyles.searchIcon}
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search question papers..."
              style={pageStyles.searchInput}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={pageStyles.clearBtn}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={refreshCurrent}
            disabled={
              refreshing || papersLoading
            }
            style={pageStyles.refreshBtn}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {papersLoading ? (
          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                style={{
                  height: 86,
                  borderRadius: 20,
                  background:
                    "rgba(15,23,42,0.05)",
                }}
              />
            ))}
          </div>
        ) : filteredPapers.length === 0 ? (
          <div style={pageStyles.empty}>
            <div style={pageStyles.emptyIcon}>
              <FileText size={27} />
            </div>

            <h3 style={pageStyles.emptyTitle}>
              No question papers available
            </h3>

            <p style={pageStyles.emptyText}>
              No question paper has been published
              for {selectedYear?.year} yet.
            </p>
          </div>
        ) : (
          <div style={pageStyles.paperList}>
            {filteredPapers.map((paper) => (
              <article
                key={paper.id}
                style={pageStyles.paperCard}
              >
                <div style={pageStyles.paperIcon}>
                  <FileText
                    size={23}
                    color="#138808"
                  />
                </div>

                <div style={pageStyles.paperMain}>
                  <h3
                    style={pageStyles.paperTitle}
                  >
                    {paper.serial_no}.{" "}
                    {paper.title ||
                      "Question Paper"}
                  </h3>

                  <div style={pageStyles.paperMeta}>
                    <span>
                      {selectedYear?.year}
                    </span>

                    <span>•</span>

                    <span>
                      Question Paper
                    </span>
                  </div>

                  <div
                    style={pageStyles.paperFile}
                  >
                    <FileText size={13} />
                    {paper.file_name ||
                      "Question paper PDF"}
                  </div>
                </div>

                <div style={pageStyles.paperActions}>
                  <Status tone="green">
                    PDF
                  </Status>

                  {paper.pdf_url && (
                    <a
                      href={paper.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={pageStyles.openBtn}
                    >
                      <ExternalLink size={16} />
                      Open PDF
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <AppShell
      role="student"
      title="PYQ"
      subtitle="Previous Year Question Papers"
    >
      <div style={pageStyles.shell}>
        {error && (
          <div style={pageStyles.error}>
            {error}
          </div>
        )}

        {!selectedSubject
          ? renderSubjects()
          : !selectedYear
            ? renderYears()
            : renderPapers()}
      </div>
    </AppShell>
  );
}