
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";

/* =========================================================
   HELPERS
========================================================= */

async function requestPYQ(url, signal) {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || "Unable to load PYQ data. Please try again.",
    );
  }

  return Array.isArray(result.data) ? result.data : [];
}

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "PDF document";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value) {
  if (!value) return "Date not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getSubjectName(subject) {
  return (
    String(
      subject?.subject_name ||
        subject?.name ||
        subject?.title ||
        "Untitled Subject",
    ).trim() || "Untitled Subject"
  );
}

function getSubjectCode(subject) {
  return String(
    subject?.subject_code ||
      subject?.code ||
      "",
  ).trim();
}

function getPaperTitle(paper) {
  return (
    String(
      paper?.title ||
        paper?.file_name ||
        "Question Paper",
    ).trim() || "Question Paper"
  );
}

function getPaperIdentity(paper, index) {
  return paper?.id != null
    ? String(paper.id)
    : `${paper?.title || "paper"}-${paper?.serial_no || index}`;
}

function getYearLabel(year) {
  return String(year?.year ?? "Year");
}

/* =========================================================
   SHARED UI COMPONENTS
========================================================= */

function PageEyebrow({ children }) {
  return (
    <div className="pyq-eyebrow">
      <span className="pyq-eyebrow-mark" />
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon = FileText, title, description, action }) {
  return (
    <section className="pyq-empty">
      <div className="pyq-empty-icon">
        <Icon size={27} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      {action || null}
    </section>
  );
}

function LoadingCards({ count = 4 }) {
  return (
    <div className="pyq-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div className="pyq-skeleton-card" key={index}>
          <div className="pyq-skeleton-icon" />
          <div className="pyq-skeleton-line pyq-skeleton-line-large" />
          <div className="pyq-skeleton-line" />
          <div className="pyq-skeleton-line pyq-skeleton-line-small" />
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   PDF PAPER CARD
========================================================= */

function PaperCard({ paper, index, onOpen }) {
  const title = getPaperTitle(paper);
  const fileName = paper?.file_name || "PDF question paper";
  const fileSize = formatFileSize(paper?.file_size);
  const serialNo = paper?.serial_no;
  const pdfUrl = paper?.pdf_url;

  return (
    <article
      className="pyq-paper-card"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="pyq-paper-preview">
        <div className="pyq-paper-preview-top">
          <span className="pyq-paper-preview-dot" />
          <span className="pyq-paper-preview-dot" />
          <span className="pyq-paper-preview-dot" />
          <span className="pyq-paper-preview-label">QUESTION PAPER</span>
        </div>

        <div className="pyq-paper-sheet">
          <div className="pyq-paper-sheet-seal">
            <GraduationCap size={19} />
          </div>

          <span className="pyq-paper-sheet-heading">
            {title.length > 37 ? `${title.slice(0, 34)}...` : title}
          </span>

          <span className="pyq-paper-sheet-line pyq-paper-sheet-line-wide" />
          <span className="pyq-paper-sheet-line" />
          <span className="pyq-paper-sheet-line pyq-paper-sheet-line-mid" />
          <span className="pyq-paper-sheet-line pyq-paper-sheet-line-wide" />
          <span className="pyq-paper-sheet-line pyq-paper-sheet-line-short" />

          <span className="pyq-paper-sheet-watermark">PYQ</span>
        </div>

        <div className="pyq-paper-preview-foot">
          <span>PDF DOCUMENT</span>
          <span>{fileSize}</span>
        </div>
      </div>

      <div className="pyq-paper-info">
        <div className="pyq-paper-meta">
          <span className="pyq-paper-serial">
            {serialNo != null
              ? `PAPER ${String(serialNo).padStart(2, "0")}`
              : "QUESTION PAPER"}
          </span>

          <span className="pyq-paper-format">
            <FileText size={12} />
            PDF
          </span>
        </div>

        <h3 className="pyq-paper-title">{title}</h3>

        <p className="pyq-paper-filename" title={fileName}>
          {fileName}
        </p>

        <div className="pyq-paper-date">
          <CalendarDays size={13} />
          <span>Added {formatDate(paper?.created_at)}</span>
        </div>

        <div className="pyq-paper-actions">
          <button
            type="button"
            className="pyq-paper-view"
            onClick={() => onOpen(paper)}
            disabled={!pdfUrl}
            title={!pdfUrl ? "PDF link is not available" : "View question paper"}
          >
            <FileText size={15} />
            View Paper
            <ArrowUpRight size={14} />
          </button>

          {pdfUrl ? (
            <a
              className="pyq-paper-download"
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open or download ${title}`}
              title="Open PDF in a new tab"
            >
              <Download size={16} />
            </a>
          ) : (
            <button
              type="button"
              className="pyq-paper-download pyq-paper-download-disabled"
              disabled
              aria-label="PDF link unavailable"
              title="PDF link is not available"
            >
              <AlertCircle size={16} />
            </button>
          )}
        </div>

        {!pdfUrl && (
          <div className="pyq-paper-unavailable">
            PDF link is currently unavailable.
          </div>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   SUBJECT CARD
========================================================= */

function SubjectCard({ subject, index, onSelect }) {
  const name = getSubjectName(subject);
  const code = getSubjectCode(subject);

  return (
    <button
      type="button"
      className="pyq-subject-card"
      onClick={() => onSelect(subject)}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="pyq-subject-card-top">
        <span className="pyq-folder-icon">
          <FolderOpen size={22} />
        </span>

        <span className="pyq-subject-arrow">
          <ArrowUpRight size={16} />
        </span>
      </div>

      <div className="pyq-subject-card-copy">
        {code && <span className="pyq-subject-code">{code}</span>}

        <h3>{name}</h3>

        <p>
          Previous year question papers
        </p>
      </div>

      <div className="pyq-subject-card-footer">
        <span>
          <FileText size={14} />
          Browse papers
        </span>

        <ChevronRight size={16} />
      </div>
    </button>
  );
}

/* =========================================================
   YEAR FOLDER CARD
========================================================= */

function YearCard({ year, index, onSelect }) {
  return (
    <button
      type="button"
      className="pyq-year-card"
      onClick={() => onSelect(year)}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="pyq-year-card-top">
        <span className="pyq-year-folder-icon">
          <FolderOpen size={24} />
        </span>

        <span className="pyq-year-arrow">
          <ArrowUpRight size={16} />
        </span>
      </div>

      <div className="pyq-year-number">{getYearLabel(year)}</div>
      <div className="pyq-year-caption">Question paper archive</div>

      <div className="pyq-year-card-footer">
        <span>Open year folder</span>
        <ChevronRight size={15} />
      </div>
    </button>
  );
}

/* =========================================================
   PDF VIEWER MODAL
========================================================= */

function PaperModal({ paper, onClose }) {
  useEffect(() => {
    if (!paper) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [paper, onClose]);

  if (!paper) return null;

  const pdfUrl = paper?.pdf_url;
  const title = getPaperTitle(paper);

  return (
    <div
      className="pyq-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="pyq-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pyq-modal-title"
      >
        <div className="pyq-modal-top-accent" />

        <header className="pyq-modal-header">
          <div className="pyq-modal-heading">
            <span className="pyq-modal-icon">
              <FileText size={20} />
            </span>

            <div>
              <h2 id="pyq-modal-title">{title}</h2>
              <p>Previous Year Question Paper</p>
            </div>
          </div>

          <button
            type="button"
            className="pyq-modal-close"
            onClick={onClose}
            aria-label="Close PDF viewer"
          >
            <X size={19} />
          </button>
        </header>

        <div className="pyq-modal-content">
          {pdfUrl ? (
            <iframe
              title={title}
              src={pdfUrl}
              className="pyq-pdf-frame"
            />
          ) : (
            <div className="pyq-pdf-unavailable">
              <AlertCircle size={27} />
              <strong>PDF link unavailable</strong>
              <p>
                The paper is listed, but a viewable PDF link was not
                returned by the server.
              </p>
            </div>
          )}
        </div>

        <footer className="pyq-modal-footer">
          <span className="pyq-modal-security">
            <ShieldCheck size={14} />
            UTKARSH Academic Resources
          </span>

          <div className="pyq-modal-actions">
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pyq-modal-open-link"
              >
                Open in new tab
                <ArrowUpRight size={14} />
              </a>
            )}

            <button
              type="button"
              className="pyq-modal-done"
              onClick={onClose}
            >
              Done
              <CheckCircle2 size={15} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
   Existing API flow:
   /api/pyq?view=subjects
   /api/pyq?view=years&subject_id=<uuid>
   /api/pyq?view=papers&year_id=<uuid>
========================================================= */

export default function PYQResourcePage() {
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [papers, setPapers] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);

  const [search, setSearch] = useState("");
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  /* -------------------------------------------------------
     LOAD SUBJECTS
  ------------------------------------------------------- */

  useEffect(() => {
    const controller = new AbortController();

    async function loadSubjects() {
      setLoadingSubjects(true);
      setError("");

      try {
        const data = await requestPYQ(
          "/api/pyq?view=subjects",
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setSubjects(data);
      } catch (err) {
        if (err?.name === "AbortError") return;

        setError(
          err?.message || "Could not load PYQ subject folders.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSubjects(false);
        }
      }
    }

    loadSubjects();

    return () => controller.abort();
  }, [refreshKey]);

  /* -------------------------------------------------------
     LOAD YEARS FOR SELECTED SUBJECT
  ------------------------------------------------------- */

  useEffect(() => {
    if (!selectedSubject?.id) {
      setYears([]);
      setLoadingYears(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadYears() {
      setLoadingYears(true);
      setError("");
      setYears([]);

      try {
        const query = new URLSearchParams({
          view: "years",
          subject_id: String(selectedSubject.id),
        });

        const data = await requestPYQ(
          `/api/pyq?${query.toString()}`,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setYears(
          [...data].sort(
            (a, b) => Number(b?.year || 0) - Number(a?.year || 0),
          ),
        );
      } catch (err) {
        if (err?.name === "AbortError") return;

        setError(
          err?.message || "Could not load year folders for this subject.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingYears(false);
        }
      }
    }

    loadYears();

    return () => controller.abort();
  }, [selectedSubject, refreshKey]);

  /* -------------------------------------------------------
     LOAD PAPERS FOR SELECTED YEAR
  ------------------------------------------------------- */

  useEffect(() => {
    if (!selectedYear?.id) {
      setPapers([]);
      setLoadingPapers(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadPapers() {
      setLoadingPapers(true);
      setError("");
      setPapers([]);

      try {
        const query = new URLSearchParams({
          view: "papers",
          year_id: String(selectedYear.id),
        });

        const data = await requestPYQ(
          `/api/pyq?${query.toString()}`,
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setPapers(
          [...data].sort((a, b) => {
            const serialA = Number(a?.serial_no || 0);
            const serialB = Number(b?.serial_no || 0);

            if (serialA && serialB && serialA !== serialB) {
              return serialA - serialB;
            }

            return (
              new Date(a?.created_at || 0).getTime() -
              new Date(b?.created_at || 0).getTime()
            );
          }),
        );
      } catch (err) {
        if (err?.name === "AbortError") return;

        setError(
          err?.message || "Could not load question papers for this year.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPapers(false);
        }
      }
    }

    loadPapers();

    return () => controller.abort();
  }, [selectedYear, refreshKey]);

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  const openSubject = useCallback((subject) => {
    setSelectedSubject(subject);
    setSelectedYear(null);
    setSelectedPaper(null);
    setSearch("");
    setError("");
  }, []);

  const openYear = useCallback((year) => {
    setSelectedYear(year);
    setSelectedPaper(null);
    setSearch("");
    setError("");
  }, []);

  const backToSubjects = useCallback(() => {
    setSelectedSubject(null);
    setSelectedYear(null);
    setSelectedPaper(null);
    setSearch("");
    setError("");
  }, []);

  const backToYears = useCallback(() => {
    setSelectedYear(null);
    setSelectedPaper(null);
    setSearch("");
    setError("");
  }, []);

  const refreshCurrent = useCallback(() => {
    setError("");
    setRefreshKey((value) => value + 1);
  }, []);

  /* -------------------------------------------------------
     FILTER CURRENT LEVEL
  ------------------------------------------------------- */

  const currentLevel = selectedYear
    ? "papers"
    : selectedSubject
      ? "years"
      : "subjects";

  const isLoading =
    currentLevel === "papers"
      ? loadingPapers
      : currentLevel === "years"
        ? loadingYears
        : loadingSubjects;

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = subjects.filter((subject) => {
      const name = getSubjectName(subject).toLowerCase();
      const code = getSubjectCode(subject).toLowerCase();

      return !query || name.includes(query) || code.includes(query);
    });

    return [...filtered].sort((a, b) => {
      const codeA = getSubjectCode(a).toLowerCase();
      const codeB = getSubjectCode(b).toLowerCase();

      return codeA.localeCompare(codeB);
    });
  }, [subjects, search]);

  const filteredYears = useMemo(() => {
    const query = search.trim().toLowerCase();

    return years.filter((year) => {
      return !query || getYearLabel(year).toLowerCase().includes(query);
    });
  }, [years, search]);

  const filteredPapers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return papers.filter((paper) => {
      const searchable = [
        getPaperTitle(paper),
        paper?.file_name || "",
        paper?.serial_no || "",
        paper?.file_size || "",
      ]
        .join(" ")
        .toLowerCase();

      return !query || searchable.includes(query);
    });
  }, [papers, search]);

  const selectedSubjectName = selectedSubject
    ? getSubjectName(selectedSubject)
    : "";

  const selectedSubjectCode = selectedSubject
    ? getSubjectCode(selectedSubject)
    : "";

  const selectedYearLabel = selectedYear
    ? getYearLabel(selectedYear)
    : "";

  const totalPapersShown = selectedYear ? papers.length : 0;

  const pageTitle = selectedYear
    ? "Question Papers"
    : selectedSubject
      ? "Year-wise Archive"
      : "Previous Year Questions";

  const pageSubtitle = selectedYear
    ? `${selectedSubjectName} · ${selectedYearLabel}`
    : selectedSubject
      ? `${selectedSubjectName} · Browse available years`
      : "Subject-wise question paper archive";

  const visibleCount =
    currentLevel === "papers"
      ? filteredPapers.length
      : currentLevel === "years"
        ? filteredYears.length
        : filteredSubjects.length;

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <AppShell
      role="student"
      title="Previous Year Questions"
      subtitle="Subject-wise question paper archive"
    >
      <main className="pyq-page">
        <div className="pyq-container">
          {/* HERO */}
          <section className="pyq-hero">
            <div className="pyq-hero-pattern" aria-hidden="true" />
            <div className="pyq-hero-orb pyq-hero-orb-one" aria-hidden="true" />
            <div className="pyq-hero-orb pyq-hero-orb-two" aria-hidden="true" />

            <div className="pyq-hero-copy">
              <PageEyebrow>ACADEMIC PRACTICE CENTRE</PageEyebrow>

              <h1>
                Previous Year <span>Questions</span>
              </h1>

              <p>
                Prepare with organised subject-wise question papers.
                Select a subject, explore its year-wise archive, and
                open the available PDF papers for practice.
              </p>

              <div className="pyq-hero-pills">
                <span>
                  <FolderOpen size={14} />
                  Subject-wise folders
                </span>

                <span>
                  <FileText size={14} />
                  PDF question papers
                </span>
              </div>
            </div>

            <div className="pyq-hero-art" aria-hidden="true">
              <div className="pyq-art-halo" />

              <div className="pyq-art-book">
                <div className="pyq-art-book-spine" />
                <div className="pyq-art-book-content">
                  <span className="pyq-art-book-label">UTKARSH</span>
                  <span className="pyq-art-book-icon">
                    <GraduationCap size={27} />
                  </span>
                  <span className="pyq-art-book-title">PYQ</span>
                  <span className="pyq-art-book-subtitle">ARCHIVE</span>
                  <span className="pyq-art-book-lines" />
                  <span className="pyq-art-book-lines pyq-art-book-lines-short" />
                </div>
              </div>

              <div className="pyq-art-float pyq-art-float-file">
                <FileText size={18} />
              </div>

              <div className="pyq-art-float pyq-art-float-check">
                <CheckCircle2 size={18} />
              </div>

              <div className="pyq-art-tricolour">
                <i />
                <i />
                <i />
              </div>
            </div>

            <div className="pyq-hero-bottom">
              <span className="pyq-hero-bottom-line" />
              <span>UTKARSH · NARULA INSTITUTE OF TECHNOLOGY</span>
            </div>
          </section>

          {/* OVERVIEW STATS */}
          <section className="pyq-stats" aria-label="PYQ archive overview">
            <div className="pyq-stat-card">
              <span className="pyq-stat-icon pyq-stat-icon-saffron">
                <Layers3 size={18} />
              </span>

              <div>
                <span className="pyq-stat-label">Subjects</span>
                <strong>{loadingSubjects ? "—" : subjects.length}</strong>
                <small>Available subject folders</small>
              </div>
            </div>

            <div className="pyq-stat-card">
              <span className="pyq-stat-icon pyq-stat-icon-blue">
                <CalendarDays size={18} />
              </span>

              <div>
                <span className="pyq-stat-label">Year Folders</span>
                <strong>
                  {selectedSubject
                    ? loadingYears
                      ? "—"
                      : years.length
                    : "—"}
                </strong>
                <small>
                  {selectedSubject
                    ? "For selected subject"
                    : "Select a subject to explore"}
                </small>
              </div>
            </div>

            <div className="pyq-stat-card">
              <span className="pyq-stat-icon pyq-stat-icon-green">
                <FileText size={18} />
              </span>

              <div>
                <span className="pyq-stat-label">Papers in Folder</span>
                <strong>
                  {selectedYear
                    ? loadingPapers
                      ? "—"
                      : totalPapersShown
                    : "—"}
                </strong>
                <small>
                  {selectedYear
                    ? `For ${selectedYearLabel}`
                    : "Select a year to view papers"}
                </small>
              </div>
            </div>

            <div className="pyq-stat-card">
              <span className="pyq-stat-icon pyq-stat-icon-navy">
                <ShieldCheck size={18} />
              </span>

              <div>
                <span className="pyq-stat-label">Resource Access</span>
                <strong className="pyq-stat-word">Student</strong>
                <small>Academic resource workspace</small>
              </div>
            </div>
          </section>

          {/* CONTENT HEADER */}
          <section className="pyq-content-header">
            <div className="pyq-content-heading">
              <PageEyebrow>QUESTION PAPER LIBRARY</PageEyebrow>
              <h2>{pageTitle}</h2>
              <p>{pageSubtitle}</p>
            </div>

            <button
              type="button"
              className="pyq-refresh-button"
              onClick={refreshCurrent}
              disabled={isLoading}
            >
              <RefreshCw
                size={15}
                className={isLoading ? "pyq-spin" : ""}
              />
              {isLoading ? "Loading" : "Refresh"}
            </button>
          </section>

          {/* BREADCRUMB */}
          <nav className="pyq-breadcrumb" aria-label="PYQ navigation">
            <button
              type="button"
              className={`pyq-breadcrumb-item ${
                !selectedSubject ? "pyq-breadcrumb-current" : ""
              }`}
              onClick={backToSubjects}
            >
              <BookOpen size={14} />
              All Subjects
            </button>

            {selectedSubject && (
              <>
                <ChevronRight size={14} className="pyq-breadcrumb-separator" />

                <button
                  type="button"
                  className={`pyq-breadcrumb-item ${
                    !selectedYear ? "pyq-breadcrumb-current" : ""
                  }`}
                  onClick={backToYears}
                  title={selectedSubjectName}
                >
                  <span className="pyq-breadcrumb-truncate">
                    {selectedSubjectCode
                      ? `${selectedSubjectCode} · ${selectedSubjectName}`
                      : selectedSubjectName}
                  </span>
                </button>
              </>
            )}

            {selectedYear && (
              <>
                <ChevronRight size={14} className="pyq-breadcrumb-separator" />
                <span className="pyq-breadcrumb-item pyq-breadcrumb-current">
                  <CalendarDays size={14} />
                  {selectedYearLabel}
                </span>
              </>
            )}
          </nav>

          {/* SEARCH AND CONTEXT */}
          <section className="pyq-toolbar">
            <div className="pyq-search">
              <Search size={17} className="pyq-search-icon" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  currentLevel === "papers"
                    ? "Search papers by title or file name..."
                    : currentLevel === "years"
                      ? "Search available years..."
                      : "Search by subject name or code..."
                }
                aria-label="Search PYQ resources"
              />

              {search && (
                <button
                  type="button"
                  className="pyq-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="pyq-toolbar-status">
              <span className="pyq-status-dot" />
              {isLoading
                ? "Fetching resources"
                : `${visibleCount} ${
                    visibleCount === 1 ? "result" : "results"
                  }`}
            </div>
          </section>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="pyq-error" role="alert">
              <span className="pyq-error-icon">
                <AlertCircle size={17} />
              </span>

              <div className="pyq-error-copy">
                <strong>Unable to load resources</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                className="pyq-error-retry"
                onClick={refreshCurrent}
                disabled={isLoading}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {/* BACK BUTTON ON DEEPER LEVELS */}
          {selectedSubject && (
            <button
              type="button"
              className="pyq-back-button"
              onClick={selectedYear ? backToYears : backToSubjects}
            >
              <ArrowLeft size={15} />
              {selectedYear ? "Back to year folders" : "Back to all subjects"}
            </button>
          )}

          {/* SUBJECT VIEW */}
          {currentLevel === "subjects" && (
            <section className="pyq-section">
              <div className="pyq-section-heading">
                <div className="pyq-section-title-wrap">
                  <span className="pyq-section-icon pyq-section-icon-saffron">
                    <FolderOpen size={17} />
                  </span>

                  <div>
                    <h3>Choose a Subject</h3>
                    <p>Open a subject folder to browse its PYQ archive.</p>
                  </div>
                </div>

                {!loadingSubjects && (
                  <span className="pyq-section-count">
                    {filteredSubjects.length} shown
                  </span>
                )}
              </div>

              {loadingSubjects ? (
                <LoadingCards count={6} />
              ) : filteredSubjects.length > 0 ? (
                <div className="pyq-grid">
                  {filteredSubjects.map((subject, index) => (
                    <SubjectCard
                      key={subject?.id || getSubjectCode(subject) || index}
                      subject={subject}
                      index={index}
                      onSelect={openSubject}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={search ? Search : FolderOpen}
                  title={
                    search
                      ? "No matching subjects"
                      : "No subject folders available"
                  }
                  description={
                    search
                      ? "Try a different subject name or code."
                      : "PYQ subject folders will appear here when they are available."
                  }
                  action={
                    search ? (
                      <button
                        type="button"
                        className="pyq-empty-action"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </button>
                    ) : null
                  }
                />
              )}
            </section>
          )}

          {/* YEAR VIEW */}
          {currentLevel === "years" && (
            <section className="pyq-section">
              <div className="pyq-section-heading">
                <div className="pyq-section-title-wrap">
                  <span className="pyq-section-icon pyq-section-icon-blue">
                    <CalendarDays size={17} />
                  </span>

                  <div>
                    <h3>Year-wise Archive</h3>
                    <p>
                      Choose an available year for{" "}
                      <strong>{selectedSubjectName}</strong>.
                    </p>
                  </div>
                </div>

                {!loadingYears && (
                  <span className="pyq-section-count">
                    {filteredYears.length} shown
                  </span>
                )}
              </div>

              {loadingYears ? (
                <LoadingCards count={4} />
              ) : filteredYears.length > 0 ? (
                <div className="pyq-grid pyq-year-grid">
                  {filteredYears.map((year, index) => (
                    <YearCard
                      key={year?.id || getYearLabel(year)}
                      year={year}
                      index={index}
                      onSelect={openYear}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={search ? Search : CalendarDays}
                  title={
                    search
                      ? "No matching years"
                      : "No year folders available"
                  }
                  description={
                    search
                      ? "Try searching for another year."
                      : "There are currently no year folders for this subject."
                  }
                  action={
                    search ? (
                      <button
                        type="button"
                        className="pyq-empty-action"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </button>
                    ) : null
                  }
                />
              )}
            </section>
          )}

          {/* PAPERS VIEW */}
          {currentLevel === "papers" && (
            <section className="pyq-section">
              <div className="pyq-section-heading">
                <div className="pyq-section-title-wrap">
                  <span className="pyq-section-icon pyq-section-icon-green">
                    <FileText size={17} />
                  </span>

                  <div>
                    <h3>{selectedYearLabel} Question Papers</h3>
                    <p>
                      {selectedSubjectName}
                      {selectedSubjectCode
                        ? ` · ${selectedSubjectCode}`
                        : ""}
                    </p>
                  </div>
                </div>

                {!loadingPapers && (
                  <span className="pyq-section-count">
                    {filteredPapers.length} shown
                  </span>
                )}
              </div>

              {loadingPapers ? (
                <LoadingCards count={4} />
              ) : filteredPapers.length > 0 ? (
                <div className="pyq-grid pyq-paper-grid">
                  {filteredPapers.map((paper, index) => (
                    <PaperCard
                      key={getPaperIdentity(paper, index)}
                      paper={paper}
                      index={index}
                      onOpen={setSelectedPaper}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={search ? Search : FileText}
                  title={
                    search
                      ? "No matching question papers"
                      : "No papers in this year folder"
                  }
                  description={
                    search
                      ? "Try another paper title or file name."
                      : "Question papers will appear here once they have been added to this year folder."
                  }
                  action={
                    search ? (
                      <button
                        type="button"
                        className="pyq-empty-action"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </button>
                    ) : null
                  }
                />
              )}
            </section>
          )}

          {/* FOOTER */}
          <footer className="pyq-footer">
            <span className="pyq-footer-icon">
              <ShieldCheck size={16} />
            </span>

            <div className="pyq-footer-copy">
              <strong>Learn from the past. Prepare for what's next.</strong>
              <span>
                Use the available question papers as part of your
                academic preparation.
              </span>
            </div>

            <span className="pyq-footer-brand">
              <i />
              UTKARSH
            </span>
          </footer>
        </div>

        <PaperModal
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      </main>

      <style jsx global>{`
        .pyq-page {
          --pyq-ink: #192d42;
          --pyq-muted: #758597;
          --pyq-line: #e7edf2;
          --pyq-saffron: #f28c28;
          --pyq-green: #16834a;
          --pyq-blue: #386da4;
          width: 100%;
          min-height: 100%;
          padding: 24px 24px 40px;
          box-sizing: border-box;
          background:
            radial-gradient(
              circle at 2% 2%,
              rgba(242, 140, 40, 0.05),
              transparent 25%
            ),
            radial-gradient(
              circle at 98% 36%,
              rgba(22, 131, 74, 0.045),
              transparent 25%
            ),
            #f6f8fb;
          color: var(--pyq-ink);
        }

        .pyq-page *,
        .pyq-page *::before,
        .pyq-page *::after {
          box-sizing: border-box;
        }

        .pyq-container {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        /* HERO */

        .pyq-hero {
          position: relative;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 270px;
          overflow: hidden;
          padding: 34px 42px 46px;
          border: 1px solid #e6edf0;
          border-radius: 24px;
          background: linear-gradient(
            112deg,
            #fff 0%,
            #fff 48%,
            #f3f9f5 100%
          );
          box-shadow:
            0 16px 45px rgba(25, 47, 74, 0.055),
            0 2px 7px rgba(25, 47, 74, 0.025);
        }

        .pyq-hero::before {
          position: absolute;
          z-index: -1;
          top: 0;
          bottom: 0;
          left: 0;
          width: 6px;
          content: "";
          background: linear-gradient(
            180deg,
            #f28c28 0%,
            #fff 48%,
            #16834a 100%
          );
        }

        .pyq-hero-pattern {
          position: absolute;
          z-index: -1;
          inset: 0;
          opacity: 0.28;
          pointer-events: none;
          background-image: radial-gradient(
            rgba(36, 75, 122, 0.13) 0.7px,
            transparent 0.7px
          );
          background-size: 18px 18px;
          mask-image: linear-gradient(
            90deg,
            transparent 5%,
            #000 72%,
            #000 100%
          );
        }

        .pyq-hero-orb {
          position: absolute;
          z-index: -1;
          border: 1px solid transparent;
          border-radius: 50%;
          pointer-events: none;
        }

        .pyq-hero-orb-one {
          top: -125px;
          right: 26%;
          width: 250px;
          height: 250px;
          border-color: rgba(242, 140, 40, 0.13);
          box-shadow:
            0 0 0 26px rgba(242, 140, 40, 0.025),
            0 0 0 52px rgba(242, 140, 40, 0.018);
        }

        .pyq-hero-orb-two {
          right: 6%;
          bottom: -208px;
          width: 300px;
          height: 300px;
          border-color: rgba(22, 131, 74, 0.12);
          box-shadow: 0 0 0 34px rgba(22, 131, 74, 0.025);
        }

        .pyq-hero-copy {
          position: relative;
          z-index: 2;
          width: min(690px, 68%);
        }

        .pyq-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 17px;
          color: #6e7f90;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.17em;
        }

        .pyq-eyebrow-mark {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--pyq-green);
          box-shadow: 0 0 0 4px rgba(22, 131, 74, 0.1);
        }

        .pyq-hero h1 {
          margin: 0;
          color: #192d42;
          font-size: clamp(30px, 3.3vw, 46px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.047em;
        }

        .pyq-hero h1 span {
          color: #1e704b;
        }

        .pyq-hero-copy > p {
          max-width: 610px;
          margin: 15px 0 20px;
          color: #6e7e8e;
          font-size: 13px;
          line-height: 1.75;
        }

        .pyq-hero-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .pyq-hero-pills span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border: 1px solid #e8eeeb;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #506477;
          font-size: 10px;
          font-weight: 750;
        }

        .pyq-hero-pills span:first-child svg {
          color: #d9842b;
        }

        .pyq-hero-pills span:last-child svg {
          color: #2b8753;
        }

        .pyq-hero-art {
          position: relative;
          display: grid;
          flex: 0 0 280px;
          min-height: 205px;
          place-items: center;
          margin-right: 12px;
        }

        .pyq-art-halo {
          position: absolute;
          width: 205px;
          height: 205px;
          border: 1px solid rgba(22, 131, 74, 0.13);
          border-radius: 50%;
          box-shadow:
            0 0 0 17px rgba(22, 131, 74, 0.026),
            0 0 0 37px rgba(242, 140, 40, 0.025);
        }

        .pyq-art-book {
          position: relative;
          z-index: 2;
          width: 148px;
          height: 182px;
          padding: 8px 9px 8px 16px;
          border: 1px solid #d1e0d8;
          border-radius: 8px 13px 13px 8px;
          background: linear-gradient(135deg, #2e7952, #1e5d42);
          box-shadow:
            0 23px 35px rgba(30, 57, 77, 0.15),
            0 5px 13px rgba(30, 57, 77, 0.06);
          transform: rotate(-5deg);
        }

        .pyq-art-book-spine {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 7px;
          width: 4px;
          border-right: 1px solid rgba(255, 255, 255, 0.24);
          border-left: 1px solid rgba(255, 255, 255, 0.13);
          background: rgba(7, 53, 33, 0.17);
        }

        .pyq-art-book-content {
          display: flex;
          height: 100%;
          align-items: center;
          flex-direction: column;
          padding: 14px 6px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 4px 9px 9px 4px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.11),
            rgba(255, 255, 255, 0.025)
          );
        }

        .pyq-art-book-label {
          color: rgba(255, 255, 255, 0.75);
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.24em;
        }

        .pyq-art-book-icon {
          display: grid;
          width: 43px;
          height: 43px;
          margin-top: 17px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }

        .pyq-art-book-title {
          margin-top: 11px;
          color: #fff;
          font-size: 28px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: 0.06em;
        }

        .pyq-art-book-subtitle {
          margin-top: 3px;
          color: rgba(255, 255, 255, 0.76);
          font-size: 7px;
          font-weight: 850;
          letter-spacing: 0.29em;
        }

        .pyq-art-book-lines {
          width: 65%;
          height: 3px;
          margin-top: 12px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.4);
        }

        .pyq-art-book-lines-short {
          width: 41%;
          margin-top: 5px;
        }

        .pyq-art-float {
          position: absolute;
          z-index: 3;
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid rgba(235, 241, 239, 0.9);
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 10px 23px rgba(29, 61, 72, 0.1);
        }

        .pyq-art-float-file {
          top: 26px;
          right: 29px;
          color: #e58a2d;
          transform: rotate(7deg);
        }

        .pyq-art-float-check {
          bottom: 27px;
          left: 25px;
          color: #269259;
          transform: rotate(-8deg);
        }

        .pyq-art-tricolour {
          position: absolute;
          right: 26px;
          bottom: 7px;
          display: flex;
          gap: 4px;
          transform: rotate(-5deg);
        }

        .pyq-art-tricolour i {
          width: 19px;
          height: 4px;
          border-radius: 5px;
        }

        .pyq-art-tricolour i:nth-child(1) {
          background: #f28c28;
        }

        .pyq-art-tricolour i:nth-child(2) {
          background: #9eafb9;
        }

        .pyq-art-tricolour i:nth-child(3) {
          background: #16834a;
        }

        .pyq-hero-bottom {
          position: absolute;
          right: 27px;
          bottom: 17px;
          left: 42px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #8997a3;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 0.15em;
        }

        .pyq-hero-bottom-line {
          width: 24px;
          height: 2px;
          border-radius: 4px;
          background: linear-gradient(
            90deg,
            #f28c28 0 33%,
            #dce4e4 33% 66%,
            #16834a 66%
          );
        }

        /* STATS */

        .pyq-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 13px;
          margin-top: 18px;
        }

        .pyq-stat-card {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
          padding: 16px 17px;
          border: 1px solid #e8eef2;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(25, 47, 74, 0.035);
        }

        .pyq-stat-icon {
          display: grid;
          flex: 0 0 41px;
          width: 41px;
          height: 41px;
          place-items: center;
          border-radius: 12px;
        }

        .pyq-stat-icon-saffron {
          background: #fff4e8;
          color: #dc8229;
        }

        .pyq-stat-icon-blue {
          background: #edf4ff;
          color: #3b6fa8;
        }

        .pyq-stat-icon-green {
          background: #eaf7ef;
          color: #23824d;
        }

        .pyq-stat-icon-navy {
          background: #edf2f8;
          color: #49678b;
        }

        .pyq-stat-card > div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 2px;
        }

        .pyq-stat-label {
          color: #778596;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .pyq-stat-card strong {
          overflow: hidden;
          color: #1b3045;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: -0.04em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pyq-stat-card .pyq-stat-word {
          font-size: 17px;
        }

        .pyq-stat-card small {
          overflow: hidden;
          color: #9aa5b0;
          font-size: 9px;
          font-weight: 550;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* CONTENT HEADER */

        .pyq-content-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;
          margin: 34px 1px 16px;
        }

        .pyq-content-heading .pyq-eyebrow {
          margin-bottom: 8px;
        }

        .pyq-content-heading h2 {
          margin: 0;
          color: #1b3045;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: -0.04em;
        }

        .pyq-content-heading p {
          margin: 7px 0 0;
          color: #788797;
          font-size: 12px;
          line-height: 1.6;
        }

        .pyq-refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 36px;
          flex-shrink: 0;
          padding: 0 13px;
          border: 1px solid #dfe7ed;
          border-radius: 10px;
          background: #fff;
          color: #496176;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
          transition: 150ms ease;
        }

        .pyq-refresh-button:hover:not(:disabled) {
          border-color: #c6d8ce;
          background: #f8fcf9;
          color: #287349;
          transform: translateY(-1px);
        }

        .pyq-refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pyq-spin {
          animation: pyq-spin 0.85s linear infinite;
        }

        @keyframes pyq-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* BREADCRUMB */

        .pyq-breadcrumb {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px;
          min-height: 39px;
          margin-bottom: 12px;
          padding: 6px 10px;
          border: 1px solid #e8edf1;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.78);
        }

        .pyq-breadcrumb-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 100%;
          min-width: 0;
          padding: 5px 7px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #788898;
          font-size: 10px;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
        }

        button.pyq-breadcrumb-item:hover {
          background: #f1f7f3;
          color: #277348;
        }

        .pyq-breadcrumb-current {
          color: #2a764b;
          font-weight: 850;
          cursor: default;
        }

        .pyq-breadcrumb-separator {
          flex-shrink: 0;
          color: #b7c0c9;
        }

        .pyq-breadcrumb-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* SEARCH TOOLBAR */

        .pyq-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px;
          border: 1px solid #e7edf2;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(25, 47, 74, 0.025);
        }

        .pyq-search {
          position: relative;
          display: flex;
          flex: 1;
          align-items: center;
          min-width: 160px;
        }

        .pyq-search-icon {
          position: absolute;
          left: 13px;
          color: #97a4b0;
          pointer-events: none;
        }

        .pyq-search input {
          width: 100%;
          height: 39px;
          padding: 0 38px 0 40px;
          border: 1px solid #edf1f4;
          border-radius: 10px;
          outline: none;
          background: #f8fafb;
          color: #24394e;
          font: inherit;
          font-size: 11px;
          transition: 150ms ease;
        }

        .pyq-search input::placeholder {
          color: #a1acb7;
        }

        .pyq-search input:focus {
          border-color: #a5c9b1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(22, 131, 74, 0.08);
        }

        .pyq-search-clear {
          position: absolute;
          right: 8px;
          display: grid;
          width: 25px;
          height: 25px;
          place-items: center;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #8a98a6;
          cursor: pointer;
        }

        .pyq-search-clear:hover {
          background: #eef2f4;
          color: #40586d;
        }

        .pyq-toolbar-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          padding: 0 8px;
          color: #8794a2;
          font-size: 10px;
          font-weight: 750;
        }

        .pyq-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2ba05d;
          box-shadow: 0 0 0 4px rgba(43, 160, 93, 0.09);
        }

        /* ERROR */

        .pyq-error {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 14px;
          padding: 12px 14px;
          border: 1px solid #f0d3ac;
          border-radius: 12px;
          background: #fff9f1;
          color: #875622;
        }

        .pyq-error-icon {
          display: grid;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 10px;
          background: #ffefd9;
          color: #c47c26;
        }

        .pyq-error-copy {
          min-width: 0;
          flex: 1;
        }

        .pyq-error-copy strong {
          display: block;
          margin-bottom: 3px;
          color: #80501f;
          font-size: 11px;
          font-weight: 850;
        }

        .pyq-error-copy p {
          margin: 0;
          color: #987447;
          font-size: 10px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .pyq-error-retry {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 31px;
          padding: 0 10px;
          border: 1px solid #ead0aa;
          border-radius: 8px;
          background: #fff;
          color: #986221;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .pyq-error-retry:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* BACK BUTTON */

        .pyq-back-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 32px;
          margin: 16px 0 2px;
          padding: 0 10px;
          border: 1px solid #e2eaf0;
          border-radius: 8px;
          background: #fff;
          color: #63778a;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: 150ms ease;
        }

        .pyq-back-button:hover {
          border-color: #c5dacc;
          background: #f4faf6;
          color: #28744a;
        }

        /* SECTION */

        .pyq-section {
          margin-top: 21px;
        }

        .pyq-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 13px;
        }

        .pyq-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .pyq-section-icon {
          display: grid;
          flex: 0 0 38px;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 11px;
        }

        .pyq-section-icon-saffron {
          background: #fff4e8;
          color: #d9842b;
        }

        .pyq-section-icon-blue {
          background: #edf4ff;
          color: #3b6fa8;
        }

        .pyq-section-icon-green {
          background: #eaf7ef;
          color: #23824d;
        }

        .pyq-section-title-wrap h3 {
          margin: 0;
          color: #263b4f;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .pyq-section-title-wrap p {
          margin: 4px 0 0;
          color: #8996a4;
          font-size: 10px;
          line-height: 1.5;
        }

        .pyq-section-title-wrap p strong {
          color: #657a8c;
          font-weight: 800;
        }

        .pyq-section-count {
          flex-shrink: 0;
          padding: 6px 9px;
          border: 1px solid #e7edf1;
          border-radius: 7px;
          background: #fff;
          color: #8895a2;
          font-size: 9px;
          font-weight: 800;
        }

        /* GRIDS */

        .pyq-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
        }

        .pyq-year-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .pyq-paper-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        /* SUBJECT CARDS */

        .pyq-subject-card {
          display: flex;
          min-width: 0;
          min-height: 190px;
          flex-direction: column;
          padding: 16px;
          border: 1px solid #e6edf1;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(25, 47, 74, 0.035);
          text-align: left;
          cursor: pointer;
          animation: pyq-card-in 280ms ease both;
          transition:
            transform 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease;
        }

        .pyq-subject-card:hover {
          transform: translateY(-3px);
          border-color: #cbded2;
          box-shadow: 0 13px 27px rgba(25, 47, 74, 0.075);
        }

        .pyq-subject-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pyq-folder-icon {
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          border: 1px solid #f6e5cf;
          border-radius: 13px;
          background: linear-gradient(145deg, #fff8ed, #fff2e1);
          color: #d9852b;
          transition: transform 170ms ease;
        }

        .pyq-subject-card:hover .pyq-folder-icon {
          transform: translateY(-1px) rotate(-3deg);
        }

        .pyq-subject-arrow,
        .pyq-year-arrow {
          display: grid;
          width: 29px;
          height: 29px;
          place-items: center;
          border: 1px solid #edf1f4;
          border-radius: 9px;
          background: #fff;
          color: #96a2ae;
          transition: 160ms ease;
        }

        .pyq-subject-card:hover .pyq-subject-arrow,
        .pyq-year-card:hover .pyq-year-arrow {
          border-color: #d2e4d8;
          background: #edf8f1;
          color: #267448;
        }

        .pyq-subject-card-copy {
          min-width: 0;
          flex: 1;
          margin-top: 15px;
        }

        .pyq-subject-code {
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          margin-bottom: 6px;
          color: #b77a39;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pyq-subject-card-copy h3 {
          display: -webkit-box;
          overflow: hidden;
          margin: 0;
          color: #263a4e;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.45;
          letter-spacing: -0.02em;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .pyq-subject-card-copy p {
          margin: 6px 0 0;
          color: #8b98a5;
          font-size: 10px;
          line-height: 1.5;
        }

        .pyq-subject-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 9px;
          margin-top: 14px;
          padding-top: 11px;
          border-top: 1px solid #f0f3f5;
          color: #7e8d9c;
          font-size: 9px;
          font-weight: 800;
        }

        .pyq-subject-card-footer span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .pyq-subject-card-footer span svg {
          color: #8fa19a;
        }

        .pyq-subject-card-footer > svg {
          flex-shrink: 0;
          color: #a8b2bc;
        }

        /* YEAR CARDS */

        .pyq-year-card {
          display: flex;
          min-width: 0;
          min-height: 172px;
          flex-direction: column;
          padding: 15px;
          border: 1px solid #e6edf1;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(25, 47, 74, 0.035);
          text-align: left;
          cursor: pointer;
          animation: pyq-card-in 280ms ease both;
          transition:
            transform 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease;
        }

        .pyq-year-card:hover {
          transform: translateY(-3px);
          border-color: #cbded2;
          box-shadow: 0 13px 27px rgba(25, 47, 74, 0.075);
        }

        .pyq-year-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pyq-year-folder-icon {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid #d9e6f5;
          border-radius: 12px;
          background: linear-gradient(145deg, #f1f6ff, #eaf2ff);
          color: #4776b0;
        }

        .pyq-year-number {
          margin-top: 15px;
          color: #20374f;
          font-size: 27px;
          font-weight: 950;
          line-height: 1.1;
          letter-spacing: -0.05em;
        }

        .pyq-year-caption {
          margin-top: 5px;
          color: #8694a2;
          font-size: 9px;
          line-height: 1.4;
        }

        .pyq-year-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: auto;
          padding-top: 11px;
          color: #6d8092;
          font-size: 9px;
          font-weight: 800;
        }

        .pyq-year-card-footer svg {
          color: #a5b0ba;
        }

        /* PAPER CARDS */

        .pyq-paper-card {
          display: flex;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e7edf2;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(25, 47, 74, 0.035);
          animation: pyq-card-in 280ms ease both;
          transition:
            transform 170ms ease,
            border-color 170ms ease,
            box-shadow 170ms ease;
        }

        .pyq-paper-card:hover {
          transform: translateY(-2px);
          border-color: #d2dfd8;
          box-shadow: 0 13px 27px rgba(25, 47, 74, 0.075);
        }

        @keyframes pyq-card-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .pyq-paper-preview {
          display: flex;
          flex: 0 0 142px;
          min-height: 224px;
          flex-direction: column;
          align-items: center;
          padding: 10px 10px 9px;
          background:
            radial-gradient(
              circle at 20% 15%,
              rgba(242, 140, 40, 0.08),
              transparent 40%
            ),
            linear-gradient(145deg, #f5f8fa, #edf2f5);
        }

        .pyq-paper-preview-top {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
          padding: 0 2px 8px;
        }

        .pyq-paper-preview-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c5d0d7;
        }

        .pyq-paper-preview-dot:first-child {
          background: #e9a24e;
        }

        .pyq-paper-preview-label {
          overflow: hidden;
          margin-left: auto;
          color: #96a2ad;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pyq-paper-sheet {
          position: relative;
          display: flex;
          width: 100%;
          max-width: 108px;
          min-height: 163px;
          align-items: flex-start;
          flex-direction: column;
          overflow: hidden;
          padding: 13px 10px;
          border: 1px solid #e4e9ed;
          border-radius: 3px;
          background: #fff;
          box-shadow: 0 8px 18px rgba(37, 58, 76, 0.1);
        }

        .pyq-paper-sheet-seal {
          display: grid;
          width: 27px;
          height: 27px;
          margin-bottom: 9px;
          place-items: center;
          border-radius: 8px;
          background: #edf6f0;
          color: #398057;
        }

        .pyq-paper-sheet-heading {
          display: -webkit-box;
          overflow: hidden;
          width: 100%;
          min-height: 16px;
          color: #4b6072;
          font-size: 6px;
          font-weight: 900;
          line-height: 1.35;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .pyq-paper-sheet-line {
          display: block;
          width: 75%;
          height: 3px;
          margin-top: 7px;
          border-radius: 4px;
          background: #e7ecef;
        }

        .pyq-paper-sheet-line-wide {
          width: 100%;
        }

        .pyq-paper-sheet-line-mid {
          width: 86%;
        }

        .pyq-paper-sheet-line-short {
          width: 53%;
        }

        .pyq-paper-sheet-watermark {
          position: absolute;
          right: 3px;
          bottom: 14px;
          color: rgba(45, 120, 77, 0.08);
          font-size: 23px;
          font-weight: 950;
          letter-spacing: -0.06em;
          transform: rotate(-24deg);
        }

        .pyq-paper-preview-foot {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          margin-top: auto;
          padding-top: 9px;
          color: #8997a5;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .pyq-paper-preview-foot span:last-child {
          letter-spacing: 0;
        }

        .pyq-paper-info {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          padding: 17px 17px 14px;
        }

        .pyq-paper-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .pyq-paper-serial {
          overflow: hidden;
          color: #aa793d;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pyq-paper-format {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          padding: 5px 7px;
          border: 1px solid #f1dfcf;
          border-radius: 6px;
          background: #fff8f1;
          color: #b97936;
          font-size: 8px;
          font-weight: 900;
        }

        .pyq-paper-title {
          display: -webkit-box;
          overflow: hidden;
          margin: 16px 0 6px;
          color: #253a4f;
          font-size: 14px;
          font-weight: 900;
          line-height: 1.45;
          letter-spacing: -0.025em;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .pyq-paper-filename {
          display: -webkit-box;
          overflow: hidden;
          margin: 0;
          color: #93a0ac;
          font-size: 9px;
          line-height: 1.5;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .pyq-paper-date {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          color: #8b99a6;
          font-size: 9px;
          font-weight: 700;
        }

        .pyq-paper-date svg {
          color: #a2afb9;
        }

        .pyq-paper-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: auto;
          padding-top: 14px;
        }

        .pyq-paper-view {
          display: inline-flex;
          flex: 1;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 0;
          min-height: 34px;
          padding: 0 8px;
          border: 1px solid #d3e6da;
          border-radius: 9px;
          background: #eff8f2;
          color: #287449;
          font-size: 9px;
          font-weight: 850;
          cursor: pointer;
          transition: 150ms ease;
        }

        .pyq-paper-view:hover:not(:disabled) {
          border-color: #b9d8c4;
          background: #e4f4e9;
        }

        .pyq-paper-view:disabled {
          opacity: 0.52;
          cursor: not-allowed;
        }

        .pyq-paper-download {
          display: grid;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 1px solid #e4ebef;
          border-radius: 9px;
          background: #fff;
          color: #657c90;
          text-decoration: none;
          cursor: pointer;
          transition: 150ms ease;
        }

        .pyq-paper-download:hover {
          border-color: #c9d8e2;
          background: #f5f9fb;
          color: #356b91;
        }

        .pyq-paper-download-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pyq-paper-unavailable {
          margin-top: 7px;
          color: #b46b3d;
          font-size: 8px;
          line-height: 1.4;
        }

        /* SKELETON */

        .pyq-skeleton-card {
          min-height: 155px;
          padding: 16px;
          border: 1px solid #e7edf1;
          border-radius: 15px;
          background: #fff;
        }

        .pyq-skeleton-icon,
        .pyq-skeleton-line {
          display: block;
          border-radius: 7px;
          background: linear-gradient(
            90deg,
            #f0f3f5 20%,
            #f8fafb 45%,
            #f0f3f5 70%
          );
          background-size: 220% 100%;
          animation: pyq-shimmer 1.3s ease infinite;
        }

        @keyframes pyq-shimmer {
          to {
            background-position: -220% 0;
          }
        }

        .pyq-skeleton-icon {
          width: 43px;
          height: 43px;
          border-radius: 12px;
        }

        .pyq-skeleton-line {
          width: 86%;
          height: 10px;
          margin-top: 15px;
        }

        .pyq-skeleton-line-large {
          width: 67%;
          height: 13px;
          margin-top: 17px;
        }

        .pyq-skeleton-line-small {
          width: 49%;
          margin-top: 8px;
        }

        /* EMPTY STATE */

        .pyq-empty {
          display: flex;
          min-height: 235px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 25px;
          border: 1px dashed #dce5e9;
          border-radius: 16px;
          background:
            radial-gradient(
              circle at 50% 25%,
              rgba(242, 140, 40, 0.045),
              transparent 34%
            ),
            #fff;
          text-align: center;
        }

        .pyq-empty-icon {
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          border: 1px solid #e0ebe4;
          border-radius: 18px;
          background: linear-gradient(145deg, #f2f9f4, #fff8ef);
          color: #5b9371;
          box-shadow: 0 7px 19px rgba(28, 80, 49, 0.06);
        }

        .pyq-empty h3 {
          margin: 15px 0 6px;
          color: #2a3f53;
          font-size: 15px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .pyq-empty p {
          max-width: 390px;
          margin: 0;
          color: #8794a2;
          font-size: 10px;
          line-height: 1.7;
        }

        .pyq-empty-action {
          min-height: 33px;
          margin-top: 14px;
          padding: 0 12px;
          border: 1px solid #d2e5d9;
          border-radius: 8px;
          background: #eff8f2;
          color: #267449;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .pyq-empty-action:hover {
          background: #e3f3e8;
        }

        /* FOOTER */

        .pyq-footer {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 20px;
          padding: 14px 16px;
          border: 1px solid #e8eef1;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.78);
        }

        .pyq-footer-icon {
          display: grid;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 10px;
          background: #edf7f0;
          color: #27814d;
        }

        .pyq-footer-copy {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 3px;
        }

        .pyq-footer-copy strong {
          color: #506477;
          font-size: 10px;
          font-weight: 850;
        }

        .pyq-footer-copy span {
          color: #96a2ad;
          font-size: 9px;
          line-height: 1.5;
        }

        .pyq-footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #607285;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.15em;
        }

        .pyq-footer-brand i {
          display: inline-block;
          width: 4px;
          height: 15px;
          border-radius: 3px;
          background: linear-gradient(
            180deg,
            #f28c28 0 33%,
            #9eafb9 33% 66%,
            #16834a 66%
          );
        }

        /* MODAL */

        .pyq-modal-backdrop {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 20px;
          background: rgba(13, 27, 41, 0.52);
          backdrop-filter: blur(5px);
          animation: pyq-fade-in 150ms ease both;
        }

        @keyframes pyq-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .pyq-modal {
          position: relative;
          display: flex;
          width: min(100%, 920px);
          max-height: 90vh;
          overflow: hidden;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.65);
          border-radius: 19px;
          background: #fff;
          box-shadow: 0 28px 85px rgba(10, 28, 43, 0.28);
          animation: pyq-modal-in 180ms ease both;
        }

        @keyframes pyq-modal-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .pyq-modal-top-accent {
          flex: 0 0 5px;
          background: linear-gradient(
            90deg,
            #f28c28 0%,
            #f7c18c 33%,
            #e2e9e5 50%,
            #80b993 75%,
            #16834a 100%
          );
        }

        .pyq-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 15px 18px;
          border-bottom: 1px solid #edf1f3;
        }

        .pyq-modal-heading {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 11px;
        }

        .pyq-modal-icon {
          display: grid;
          flex: 0 0 40px;
          width: 40px;
          height: 40px;
          place-items: center;
          border: 1px solid #dcebe0;
          border-radius: 11px;
          background: #edf8f1;
          color: #2d8050;
        }

        .pyq-modal-heading > div {
          min-width: 0;
        }

        .pyq-modal-heading h2 {
          overflow: hidden;
          margin: 0;
          color: #23384c;
          font-size: 13px;
          font-weight: 900;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pyq-modal-heading p {
          margin: 4px 0 0;
          color: #91a0ad;
          font-size: 9px;
          font-weight: 650;
        }

        .pyq-modal-close {
          display: grid;
          flex: 0 0 33px;
          width: 33px;
          height: 33px;
          place-items: center;
          border: 1px solid #e7edf1;
          border-radius: 9px;
          background: #fff;
          color: #788897;
          cursor: pointer;
          transition: 150ms ease;
        }

        .pyq-modal-close:hover {
          border-color: #e5c6c1;
          background: #fff4f3;
          color: #b95048;
        }

        .pyq-modal-content {
          min-height: 300px;
          flex: 1;
          overflow: auto;
          background: #eef2f4;
        }

        .pyq-pdf-frame {
          display: block;
          width: 100%;
          height: min(68vh, 690px);
          border: 0;
          background: #eef2f4;
        }

        .pyq-pdf-unavailable {
          display: flex;
          min-height: 280px;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 25px;
          color: #9d7447;
          text-align: center;
        }

        .pyq-pdf-unavailable strong {
          margin-top: 11px;
          color: #5d6873;
          font-size: 13px;
        }

        .pyq-pdf-unavailable p {
          max-width: 340px;
          margin: 7px 0 0;
          color: #8793a0;
          font-size: 10px;
          line-height: 1.65;
        }

        .pyq-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 16px;
          border-top: 1px solid #e9eef1;
          background: #fff;
        }

        .pyq-modal-security {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #8d9b92;
          font-size: 9px;
          font-weight: 750;
        }

        .pyq-modal-security svg {
          color: #4b9666;
        }

        .pyq-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .pyq-modal-open-link,
        .pyq-modal-done {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 33px;
          padding: 0 11px;
          border: 1px solid #e1e9ed;
          border-radius: 8px;
          background: #fff;
          color: #61768a;
          font-size: 9px;
          font-weight: 850;
          text-decoration: none;
          cursor: pointer;
          transition: 150ms ease;
        }

        .pyq-modal-open-link:hover {
          border-color: #cbdce5;
          background: #f6fafb;
          color: #386b91;
        }

        .pyq-modal-done {
          border-color: #cfe3d5;
          background: #edf8f1;
          color: #267448;
        }

        .pyq-modal-done:hover {
          background: #e0f2e6;
        }

        /* ACCESSIBILITY */

        .pyq-page button:focus-visible,
        .pyq-page a:focus-visible,
        .pyq-page input:focus-visible,
        .pyq-modal button:focus-visible,
        .pyq-modal a:focus-visible {
          outline: 3px solid rgba(49, 133, 82, 0.28);
          outline-offset: 2px;
        }

        /* RESPONSIVE */

        @media (max-width: 1160px) {
          .pyq-hero {
            padding-right: 26px;
            padding-left: 33px;
          }

          .pyq-hero-art {
            flex-basis: 235px;
            margin-right: 0;
          }

          .pyq-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pyq-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pyq-year-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .pyq-page {
            padding: 16px 14px 28px;
          }

          .pyq-hero {
            min-height: 0;
            padding: 26px 22px 48px;
            border-radius: 19px;
          }

          .pyq-hero-copy {
            width: 100%;
          }

          .pyq-hero h1 {
            max-width: 470px;
            font-size: clamp(29px, 7vw, 39px);
          }

          .pyq-hero-copy > p {
            max-width: 540px;
            font-size: 12px;
          }

          .pyq-hero-art {
            display: none;
          }

          .pyq-hero-bottom {
            right: 15px;
            bottom: 15px;
            left: 22px;
            font-size: 7px;
          }

          .pyq-stats {
            gap: 10px;
            margin-top: 13px;
          }

          .pyq-stat-card {
            gap: 10px;
            padding: 13px;
            border-radius: 13px;
          }

          .pyq-stat-icon {
            flex-basis: 36px;
            width: 36px;
            height: 36px;
            border-radius: 11px;
          }

          .pyq-stat-icon svg {
            width: 16px;
            height: 16px;
          }

          .pyq-stat-card strong {
            font-size: 21px;
          }

          .pyq-stat-card .pyq-stat-word {
            font-size: 15px;
          }

          .pyq-content-header {
            margin-top: 28px;
          }

          .pyq-content-heading h2 {
            font-size: 21px;
          }

          .pyq-content-heading p {
            font-size: 11px;
          }

          .pyq-paper-preview {
            flex-basis: 122px;
          }

          .pyq-paper-info {
            padding: 14px 13px 12px;
          }

          .pyq-paper-title {
            font-size: 13px;
          }

          .pyq-year-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 540px) {
          .pyq-page {
            padding: 12px 10px 24px;
          }

          .pyq-hero {
            padding: 23px 17px 47px;
            border-radius: 16px;
          }

          .pyq-eyebrow {
            margin-bottom: 13px;
            font-size: 8px;
          }

          .pyq-hero h1 {
            font-size: 29px;
          }

          .pyq-hero-copy > p {
            margin: 11px 0 15px;
            font-size: 11px;
            line-height: 1.65;
          }

          .pyq-hero-pills {
            gap: 6px;
          }

          .pyq-hero-pills span {
            padding: 7px 9px;
            font-size: 9px;
          }

          .pyq-hero-bottom {
            left: 17px;
            font-size: 6px;
          }

          .pyq-stats {
            gap: 8px;
          }

          .pyq-stat-card {
            gap: 8px;
            padding: 11px 9px;
          }

          .pyq-stat-icon {
            flex-basis: 31px;
            width: 31px;
            height: 31px;
            border-radius: 9px;
          }

          .pyq-stat-label {
            font-size: 8px;
          }

          .pyq-stat-card strong {
            font-size: 19px;
          }

          .pyq-stat-card .pyq-stat-word {
            font-size: 13px;
          }

          .pyq-stat-card small {
            font-size: 8px;
          }

          .pyq-content-header {
            gap: 8px;
            margin: 24px 1px 13px;
          }

          .pyq-content-heading h2 {
            font-size: 19px;
          }

          .pyq-content-heading p {
            max-width: 270px;
            font-size: 10px;
          }

          .pyq-refresh-button {
            min-height: 33px;
            gap: 5px;
            padding: 0 9px;
            font-size: 9px;
          }

          .pyq-breadcrumb {
            gap: 2px;
            padding: 5px;
          }

          .pyq-breadcrumb-item {
            gap: 4px;
            padding: 5px;
            font-size: 9px;
          }

          .pyq-toolbar {
            align-items: stretch;
            flex-direction: column;
            gap: 7px;
            padding: 9px;
            border-radius: 12px;
          }

          .pyq-search {
            width: 100%;
          }

          .pyq-search input {
            height: 37px;
            font-size: 10px;
          }

          .pyq-toolbar-status {
            align-self: flex-end;
            padding: 0 3px;
            font-size: 9px;
          }

          .pyq-section {
            margin-top: 17px;
          }

          .pyq-section-heading {
            gap: 7px;
            margin-bottom: 10px;
          }

          .pyq-section-title-wrap {
            gap: 8px;
          }

          .pyq-section-icon {
            flex-basis: 33px;
            width: 33px;
            height: 33px;
            border-radius: 9px;
          }

          .pyq-section-icon svg {
            width: 15px;
            height: 15px;
          }

          .pyq-section-title-wrap h3 {
            font-size: 12px;
          }

          .pyq-section-title-wrap p {
            font-size: 9px;
          }

          .pyq-section-count {
            padding: 5px 7px;
            font-size: 8px;
          }

          .pyq-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .pyq-subject-card {
            min-height: 158px;
            padding: 14px;
          }

          .pyq-year-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 9px;
          }

          .pyq-year-card {
            min-height: 153px;
            padding: 12px;
          }

          .pyq-year-number {
            font-size: 24px;
          }

          .pyq-paper-grid {
            grid-template-columns: 1fr;
          }

          .pyq-paper-card {
            min-height: 205px;
          }

          .pyq-paper-preview {
            flex-basis: 115px;
            min-height: 205px;
            padding: 9px 8px;
          }

          .pyq-paper-sheet {
            min-height: 146px;
          }

          .pyq-paper-info {
            padding: 12px 11px 11px;
          }

          .pyq-paper-title {
            margin-top: 12px;
            font-size: 12px;
          }

          .pyq-paper-filename,
          .pyq-paper-date {
            font-size: 8px;
          }

          .pyq-paper-view {
            gap: 4px;
            min-height: 32px;
            font-size: 8px;
          }

          .pyq-paper-download {
            flex-basis: 32px;
            width: 32px;
            height: 32px;
          }

          .pyq-footer {
            gap: 8px;
            padding: 11px;
          }

          .pyq-footer-copy strong {
            font-size: 9px;
          }

          .pyq-footer-copy span {
            font-size: 8px;
          }

          .pyq-footer-brand {
            gap: 5px;
            font-size: 7px;
          }

          .pyq-modal-backdrop {
            align-items: flex-end;
            padding: 8px;
          }

          .pyq-modal {
            max-height: 92vh;
            border-radius: 16px;
          }

          .pyq-modal-header {
            padding: 11px;
          }

          .pyq-modal-heading h2 {
            font-size: 11px;
          }

          .pyq-modal-content {
            min-height: 230px;
          }

          .pyq-pdf-frame {
            height: 65vh;
          }

          .pyq-modal-footer {
            padding: 9px;
          }

          .pyq-modal-security {
            font-size: 8px;
          }

          .pyq-modal-open-link,
          .pyq-modal-done {
            min-height: 31px;
            gap: 5px;
            padding: 0 8px;
            font-size: 8px;
          }
        }

        @media (max-width: 370px) {
          .pyq-stat-card {
            gap: 6px;
            padding: 9px 7px;
          }

          .pyq-stat-icon {
            flex-basis: 28px;
            width: 28px;
            height: 28px;
          }

          .pyq-stat-card strong {
            font-size: 17px;
          }

          .pyq-stat-card .pyq-stat-word {
            font-size: 12px;
          }

          .pyq-refresh-button {
            padding: 0 7px;
          }

          .pyq-year-grid {
            grid-template-columns: 1fr 1fr;
          }

          .pyq-modal-security {
            max-width: 100px;
            line-height: 1.4;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pyq-page *,
          .pyq-page *::before,
          .pyq-page *::after,
          .pyq-modal *,
          .pyq-modal *::before,
          .pyq-modal *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </AppShell>
  );
}