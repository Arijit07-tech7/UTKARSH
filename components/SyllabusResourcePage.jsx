"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers3,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";

/* =========================================================
   HELPERS
========================================================= */

function uniqueItems(items) {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter(
    (item, index) => {
      const key =
        item?.id ||
        [
          item?.title,
          item?.name,
          item?.file_name,
          item?.pdf_url,
          item?.pdf_path,
          item?.created_at,
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

function getSyllabusTitle(item) {
  return (
    item?.title ||
    item?.name ||
    item?.document_name ||
    item?.file_name ||
    item?.subject_name ||
    "Academic Syllabus"
  );
}

function getSyllabusDescription(item) {
  return (
    item?.description ||
    item?.details ||
    item?.overview ||
    item?.content ||
    "Your syllabus document, available in one convenient place for reference and study planning."
  );
}

function getSyllabusPdfUrl(item) {
  const candidate =
    item?.pdf_url ||
    item?.public_url ||
    item?.file_url ||
    item?.pdf_path ||
    item?.file_path ||
    item?.url ||
    "";

  if (typeof candidate === "string") {
    return candidate.trim();
  }

  if (candidate && typeof candidate === "object") {
    return (
      candidate?.uri ||
      candidate?.url ||
      ""
    );
  }

  return "";
}

function getSyllabusFileName(item) {
  const explicitName =
    item?.file_name ||
    item?.original_file_name ||
    item?.filename ||
    item?.document_name;

  if (explicitName) {
    return String(explicitName);
  }

  const url = getSyllabusPdfUrl(item);

  if (url) {
    try {
      const pathname = new URL(url).pathname;
      const lastSegment = pathname.split("/").pop();

      if (lastSegment) {
        return decodeURIComponent(lastSegment);
      }
    } catch {
      const lastSegment = url.split("/").pop();

      if (lastSegment) {
        return lastSegment.split("?")[0];
      }
    }
  }

  return "Syllabus.pdf";
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getSyllabusDate(item) {
  return (
    item?.updated_at ||
    item?.date ||
    item?.created_at ||
    ""
  );
}

function formatFileSize(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return value;
    }

    value = parsed;
  }

  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const size = bytes / Math.pow(1024, exponent);

  return `${size.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function getSyllabusSize(item) {
  return formatFileSize(
    item?.file_size ||
      item?.size_bytes ||
      item?.size ||
      item?.file_size_bytes
  );
}

function getOptionalDetails(item) {
  const details = [];

  const semester =
    item?.semester_name ||
    item?.semester;

  const academicYear =
    item?.academic_year ||
    item?.year;

  const department =
    item?.department ||
    item?.branch;

  if (semester) {
    details.push({
      label: "Semester",
      value: String(semester),
    });
  }

  if (academicYear) {
    details.push({
      label: "Academic Year",
      value: String(academicYear),
    });
  }

  if (department) {
    details.push({
      label: "Department",
      value: String(department),
    });
  }

  return details;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function SyllabusResourcePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  /* =======================================================
     LOAD SYLLABUS FROM EXISTING API
  ======================================================= */

  const loadSyllabus = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/data?resource=syllabus",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            result?.message ||
              result?.error ||
              "Failed to load the syllabus."
          );
        }

        if (result?.unavailable) {
          throw new Error(
            "The syllabus is currently unavailable from the database."
          );
        }

        setItems(
          uniqueItems(result?.data)
        );
      } catch (err) {
        console.error(
          "SyllabusResourcePage:",
          err
        );

        setItems([]);

        setError(
          err?.message ||
            "Unable to load the syllabus. Please try again."
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }

        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadSyllabus();
  }, [loadSyllabus]);

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadSyllabus({
        silent: true,
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadSyllabus]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [items, normalizedSearch]);

  const totalCount = items.length;
  const hasResults = filteredItems.length > 0;

  /* =======================================================
     OPEN PDF
  ======================================================= */

  const openPdf = (item) => {
    const url = getSyllabusPdfUrl(item);

    if (!url) {
      setError(
        "The PDF link is not available for this syllabus."
      );
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AppShell
      role="student"
      title="Syllabus"
      subtitle="Your academic curriculum"
    >
      <div className="page-wrap syllabus-premium">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="sy-hero">
          <div className="sy-hero-copy">
            <div className="sy-eyebrow">
              <span className="sy-eyebrow-dot" />
              ACADEMIC RESOURCE CENTER
            </div>

            <h1>
              Syllabus<span>.</span>
            </h1>

            <p>
              Your academic curriculum, organised in one
              place. Explore the syllabus PDF and keep
              your semester study plan within reach.
            </p>

            <div className="sy-hero-tags">
              <span>
                <GraduationCap size={14} />
                Student learning
              </span>

              <span>
                <BookOpen size={14} />
                Curriculum guide
              </span>
            </div>
          </div>

          <div
            className="sy-hero-visual"
            aria-hidden="true"
          >
            <div className="sy-hero-orbit sy-orbit-a" />
            <div className="sy-hero-orbit sy-orbit-b" />
            <div className="sy-hero-orbit sy-orbit-c" />

            <div className="sy-hero-document">
              <div className="sy-hero-document-glow" />

              <div className="sy-hero-document-icon">
                <FileText size={34} />
              </div>

              <span>ACADEMIC GUIDE</span>
              <strong>Study with clarity</strong>

              <div className="sy-hero-document-lines">
                <i />
                <i />
                <i />
              </div>
            </div>

            <span className="sy-hero-float sy-float-one">
              <BookOpen size={15} />
            </span>

            <span className="sy-hero-float sy-float-two">
              <CheckCircle2 size={15} />
            </span>
          </div>

          <div className="sy-tricolour-line" />
        </section>

        {/* =================================================
            SUMMARY STRIP
        ================================================= */}

        <section className="sy-summary">
          <div className="sy-summary-icon">
            <Layers3 size={20} />
          </div>

          <div className="sy-summary-copy">
            <span className="sy-summary-label">
              AVAILABLE RESOURCE
            </span>

            <strong>
              {totalCount === 1
                ? "Your syllabus PDF is ready"
                : totalCount > 1
                  ? "Your syllabus documents are ready"
                  : "Syllabus library"}
            </strong>

            <p>
              {totalCount === 1
                ? "Open or download the available academic document."
                : totalCount > 1
                  ? "Browse and access the available syllabus documents."
                  : "Your syllabus document will appear here when available."}
            </p>
          </div>

          <div className="sy-summary-count">
            <strong>
              {loading ? "—" : totalCount}
            </strong>

            <span>
              {totalCount === 1
                ? "PDF DOCUMENT"
                : "PDF DOCUMENTS"}
            </span>
          </div>
        </section>

        {/* =================================================
            SEARCH AND REFRESH
        ================================================= */}

        <section className="sy-toolbar">
          <label className="sy-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search syllabus..."
              aria-label="Search syllabus"
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
            className="sy-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "sy-spin" : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="sy-error" role="alert">
            <div className="sy-error-icon">
              <RefreshCw size={17} />
            </div>

            <div className="sy-error-copy">
              <strong>
                Unable to load syllabus
              </strong>

              <span>{error}</span>
            </div>

            <button
              type="button"
              className="sy-error-retry"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={14}
                className={
                  refreshing ? "sy-spin" : ""
                }
              />
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            FEATURED DOCUMENT SECTION
        ================================================= */}

        <div className="sy-section-heading">
          <div>
            <span className="sy-section-eyebrow">
              YOUR ACADEMIC BLUEPRINT
            </span>

            <h2>
              Syllabus Library
            </h2>

            <p>
              Access your curriculum document whenever you need it.
            </p>
          </div>

          <div className="sy-library-badge">
            <ShieldCheck size={15} />
            Student Resource
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="sy-featured-skeleton">
            <div className="sy-skeleton-cover" />

            <div className="sy-skeleton-content">
              <span className="sy-skeleton-short" />
              <span className="sy-skeleton-title" />
              <span className="sy-skeleton-line" />
              <span className="sy-skeleton-line sy-skeleton-line-small" />
              <span className="sy-skeleton-button" />
            </div>
          </div>
        ) : hasResults ? (
          <div className="sy-document-list">
            {filteredItems.map((item, index) => {
              const title = getSyllabusTitle(item);
              const description =
                getSyllabusDescription(item);
              const pdfUrl =
                getSyllabusPdfUrl(item);
              const fileName =
                getSyllabusFileName(item);
              const updatedDate =
                formatDate(getSyllabusDate(item));
              const fileSize =
                getSyllabusSize(item);
              const optionalDetails =
                getOptionalDetails(item);

              return (
                <article
                  className="sy-featured-document"
                  key={
                    item?.id ||
                    `${title}-${fileName}-${index}`
                  }
                >
                  {/* PDF COVER */}
                  <div className="sy-document-cover">
                    <div className="sy-cover-pattern sy-cover-pattern-one" />
                    <div className="sy-cover-pattern sy-cover-pattern-two" />

                    <div className="sy-cover-top">
                      <span className="sy-cover-brand">
                        <span className="sy-cover-brand-mark">
                          <BookOpen size={17} />
                        </span>

                        <span>
                          UTKARSH
                          <small>STUDENT ACADEMIC PORTAL</small>
                        </span>
                      </span>

                      <span className="sy-cover-pdf">
                        PDF
                      </span>
                    </div>

                    <div className="sy-cover-center">
                      <div className="sy-cover-file-icon">
                        <FileText size={47} strokeWidth={1.6} />
                      </div>

                      <span className="sy-cover-document-label">
                        ACADEMIC DOCUMENT
                      </span>

                      <strong>
                        {title}
                      </strong>

                      <div className="sy-cover-lines">
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>

                    <div className="sy-cover-bottom">
                      <span>
                        <GraduationCap size={14} />
                        STUDY RESOURCE
                      </span>

                      <span className="sy-cover-page-mark">
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </div>

                  {/* DOCUMENT DETAILS */}
                  <div className="sy-document-content">
                    <div className="sy-document-topline">
                      <span className="sy-document-eyebrow">
                        <span />
                        FEATURED SYLLABUS
                      </span>

                      <span className="sy-available-badge">
                        <CheckCircle2 size={13} />
                        Available
                      </span>
                    </div>

                    <h3>
                      {title}
                    </h3>

                    <p className="sy-document-description">
                      {description}
                    </p>

                    {optionalDetails.length > 0 && (
                      <div className="sy-document-tags">
                        {optionalDetails.map((detail) => (
                          <span key={detail.label}>
                            <b>{detail.label}</b>
                            {detail.value}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="sy-document-file">
                      <div className="sy-file-icon">
                        <FileText size={22} />
                      </div>

                      <div className="sy-file-copy">
                        <strong>
                          {fileName}
                        </strong>

                        <span>
                          PDF Document
                          {fileSize
                            ? ` · ${fileSize}`
                            : ""}
                          {updatedDate
                            ? ` · Updated ${updatedDate}`
                            : ""}
                        </span>
                      </div>

                      <span className="sy-file-type">
                        PDF
                      </span>
                    </div>

                    <div className="sy-document-actions">
                      {pdfUrl ? (
                        <>
                          <a
                            className="sy-primary-button"
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={16} />
                            Open Syllabus PDF
                          </a>

                          <a
                            className="sy-secondary-button"
                            href={pdfUrl}
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={16} />
                            Download
                          </a>
                        </>
                      ) : (
                        <div className="sy-pdf-unavailable">
                          <FileText size={16} />
                          PDF link is not available yet
                        </div>
                      )}
                    </div>

                    <div className="sy-document-footnote">
                      <ShieldCheck size={14} />
                      <span>
                        Keep this document handy for your academic planning.
                      </span>
                    </div>
                  </div>

                  <div className="sy-document-bottom-line" />
                </article>
              );
            })}
          </div>
        ) : (
          /* EMPTY / SEARCH STATE */
          <section className="sy-empty">
            <div className="sy-empty-icon">
              {normalizedSearch ? (
                <Search size={27} />
              ) : (
                <BookOpen size={27} />
              )}
            </div>

            <h3>
              {normalizedSearch
                ? "No matching syllabus found"
                : "Syllabus PDF not uploaded yet"}
            </h3>

            <p>
              {normalizedSearch
                ? "Try another search term or clear the search to view the available document."
                : "The syllabus document will appear here once it has been added to the academic portal."}
            </p>

            {normalizedSearch && (
              <button
                type="button"
                className="sy-empty-clear"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            )}
          </section>
        )}

        {/* =================================================
            FOOTER NOTE
        ================================================= */}

        <div className="sy-footer-note">
          <div className="sy-footer-icon">
            <Sparkles size={16} />
          </div>

          <p>
            <strong>Study smarter with UTKARSH.</strong>
            <span>
              Your academic resources, all in one place.
            </span>
          </p>
        </div>

        {/* =================================================
            ALL CSS IN THIS JSX FILE
        ================================================= */}

        <style jsx global>{`
          .syllabus-premium {
            --sy-ink: #17251f;
            --sy-muted: #6f7d74;
            --sy-line: #dfe8e1;
            --sy-green: #138808;
            --sy-green-dark: #0d6238;
            --sy-saffron: #f28b2d;
            --sy-blue: #284e88;
            min-width: 0;
            padding-bottom: 38px;
            color: var(--sy-ink);
          }

          .syllabus-premium,
          .syllabus-premium * {
            box-sizing: border-box;
          }

          .syllabus-premium button,
          .syllabus-premium input,
          .syllabus-premium a {
            font-family: inherit;
          }

          .syllabus-premium button:focus-visible,
          .syllabus-premium a:focus-visible {
            outline: 3px solid rgba(40, 78, 136, .3);
            outline-offset: 3px;
          }

          /* =========================
             HERO
          ========================= */

          .syllabus-premium .sy-hero {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 270px;
            min-height: 244px;
            overflow: hidden;
            border: 1px solid #e0e9e2;
            border-radius: 23px;
            background:
              radial-gradient(
                circle at 84% 13%,
                rgba(255, 153, 51, .10),
                transparent 29%
              ),
              radial-gradient(
                circle at 12% 100%,
                rgba(19, 136, 8, .045),
                transparent 30%
              ),
              #fff;
            box-shadow: 0 12px 32px rgba(18, 61, 35, .045);
          }

          .syllabus-premium .sy-hero-copy {
            position: relative;
            z-index: 2;
            align-self: center;
            padding: 32px 38px;
          }

          .syllabus-premium .sy-eyebrow {
            display: flex;
            align-items: center;
            gap: 9px;
            color: #17813e;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .16em;
          }

          .syllabus-premium .sy-eyebrow-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--sy-saffron);
            box-shadow: 0 0 0 4px rgba(242, 139, 45, .11);
          }

          .syllabus-premium .sy-hero-copy h1 {
            margin: 15px 0 10px;
            color: var(--sy-ink);
            font-size: clamp(32px, 3vw, 43px);
            font-weight: 850;
            letter-spacing: -.06em;
            line-height: 1.06;
          }

          .syllabus-premium .sy-hero-copy h1 > span {
            color: var(--sy-saffron);
          }

          .syllabus-premium .sy-hero-copy > p {
            max-width: 620px;
            margin: 0;
            color: var(--sy-muted);
            font-size: 12px;
            line-height: 1.8;
          }

          .syllabus-premium .sy-hero-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 19px;
          }

          .syllabus-premium .sy-hero-tags > span {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 31px;
            padding: 0 11px;
            border: 1px solid #e0e9e2;
            border-radius: 999px;
            background: #f8fbf8;
            color: #53665a;
            font-size: 9px;
            font-weight: 800;
          }

          .syllabus-premium .sy-hero-tags svg {
            color: var(--sy-green);
          }

          .syllabus-premium .sy-hero-visual {
            position: relative;
            min-height: 244px;
            overflow: hidden;
          }

          .syllabus-premium .sy-hero-orbit {
            position: absolute;
            border: 1px solid rgba(19, 136, 8, .12);
            border-radius: 50%;
          }

          .syllabus-premium .sy-orbit-a {
            top: -55px;
            right: -78px;
            width: 315px;
            height: 315px;
          }

          .syllabus-premium .sy-orbit-b {
            top: -13px;
            right: -33px;
            width: 230px;
            height: 230px;
            border-color: rgba(242, 139, 45, .20);
          }

          .syllabus-premium .sy-orbit-c {
            top: 27px;
            right: 6px;
            width: 150px;
            height: 150px;
            border-color: rgba(40, 78, 136, .16);
          }

          .syllabus-premium .sy-hero-document {
            position: absolute;
            top: 50%;
            right: 31px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 9px;
            width: 172px;
            height: 169px;
            overflow: hidden;
            border: 1px solid #e2eae3;
            border-radius: 21px;
            background: rgba(255, 255, 255, .90);
            box-shadow: 0 18px 40px rgba(18, 68, 38, .09);
            transform: translateY(-50%);
            backdrop-filter: blur(12px);
          }

          .syllabus-premium .sy-hero-document-glow {
            position: absolute;
            top: -39px;
            right: -37px;
            width: 95px;
            height: 95px;
            border-radius: 50%;
            background: rgba(255, 153, 51, .11);
            filter: blur(2px);
          }

          .syllabus-premium .sy-hero-document-icon {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 58px;
            height: 58px;
            border: 1px solid #dce8de;
            border-radius: 17px;
            background: linear-gradient(145deg, #fff0df, #edf8ef);
            color: var(--sy-green);
          }

          .syllabus-premium .sy-hero-document > span {
            color: #7a887e;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: .16em;
          }

          .syllabus-premium .sy-hero-document > strong {
            color: #244a34;
            font-size: 10px;
            font-weight: 850;
          }

          .syllabus-premium .sy-hero-document-lines {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 75px;
          }

          .syllabus-premium .sy-hero-document-lines i {
            display: block;
            height: 3px;
            border-radius: 99px;
            background: #e5eee7;
          }

          .syllabus-premium .sy-hero-document-lines i:nth-child(2) {
            width: 80%;
          }

          .syllabus-premium .sy-hero-document-lines i:nth-child(3) {
            width: 58%;
          }

          .syllabus-premium .sy-hero-float {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 33px;
            height: 33px;
            border: 1px solid #e1e9e2;
            border-radius: 11px;
            background: #fff;
            box-shadow: 0 7px 20px rgba(18, 68, 38, .07);
          }

          .syllabus-premium .sy-float-one {
            top: 33px;
            right: 208px;
            color: var(--sy-saffron);
          }

          .syllabus-premium .sy-float-two {
            right: 17px;
            bottom: 34px;
            color: var(--sy-green);
          }

          .syllabus-premium .sy-tricolour-line {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(
              90deg,
              #ff9933 0%,
              #fff 50%,
              #138808 100%
            );
          }

          /* =========================
             SUMMARY STRIP
          ========================= */

          .syllabus-premium .sy-summary {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
            margin-top: 17px;
            padding: 15px 18px;
            border: 1px solid #deeadf;
            border-radius: 16px;
            background:
              linear-gradient(
                100deg,
                rgba(255, 153, 51, .035),
                transparent 45%,
                rgba(19, 136, 8, .04)
              ),
              #fff;
            box-shadow: 0 7px 22px rgba(20, 55, 34, .03);
          }

          .syllabus-premium .sy-summary-icon {
            display: flex;
            flex: 0 0 43px;
            align-items: center;
            justify-content: center;
            width: 43px;
            height: 43px;
            border: 1px solid #dce8de;
            border-radius: 13px;
            background: linear-gradient(145deg, #fff1e2, #edf8ef);
            color: var(--sy-green);
          }

          .syllabus-premium .sy-summary-copy {
            flex: 1 1 auto;
            min-width: 0;
          }

          .syllabus-premium .sy-summary-label {
            display: block;
            color: #16813c;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: .14em;
          }

          .syllabus-premium .sy-summary-copy strong {
            display: block;
            margin-top: 4px;
            color: var(--sy-ink);
            font-size: 13px;
            font-weight: 850;
            line-height: 1.35;
          }

          .syllabus-premium .sy-summary-copy p {
            margin: 3px 0 0;
            color: var(--sy-muted);
            font-size: 10px;
            line-height: 1.55;
          }

          .syllabus-premium .sy-summary-count {
            display: flex;
            flex: 0 0 auto;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
            min-width: 105px;
            min-height: 57px;
            padding: 8px 12px;
            border: 1px solid #e0eae2;
            border-radius: 12px;
            background: #f6faf7;
            text-align: right;
          }

          .syllabus-premium .sy-summary-count strong {
            color: var(--sy-green);
            font-size: 23px;
            font-weight: 900;
            line-height: 1;
          }

          .syllabus-premium .sy-summary-count span {
            margin-top: 5px;
            color: #7d8b81;
            font-size: 7px;
            font-weight: 850;
            letter-spacing: .1em;
          }

          /* =========================
             TOOLBAR
          ========================= */

          .syllabus-premium .sy-toolbar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            margin: 18px 0 24px;
            padding: 10px;
            border: 1px solid var(--sy-line);
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 8px 24px rgba(20, 55, 34, .035);
          }

          .syllabus-premium .sy-search {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            min-height: 45px;
            padding: 0 13px;
            border: 1px solid #e1e9e2;
            border-radius: 11px;
            background: #f8faf8;
            color: #78867d;
            transition: border-color .18s ease, box-shadow .18s ease;
          }

          .syllabus-premium .sy-search:focus-within {
            border-color: #83b894;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(19, 136, 8, .08);
          }

          .syllabus-premium .sy-search > svg {
            flex: 0 0 auto;
            color: #75837a;
          }

          .syllabus-premium .sy-search input {
            flex: 1 1 auto;
            width: 100%;
            min-width: 0;
            height: 43px;
            padding: 0;
            border: 0;
            outline: none;
            background: transparent;
            color: var(--sy-ink);
            box-shadow: none;
            font: inherit;
            font-size: 12px;
          }

          .syllabus-premium .sy-search input::placeholder {
            color: #98a39b;
            opacity: 1;
          }

          .syllabus-premium .sy-search input::-webkit-search-cancel-button {
            display: none;
          }

          .syllabus-premium .sy-search button {
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

          .syllabus-premium .sy-search button:hover {
            background: #e1efe4;
            color: var(--sy-green-dark);
          }

          .syllabus-premium .sy-refresh {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-width: 105px;
            min-height: 42px;
            padding: 0 13px;
            border: 1px solid #cfe0d2;
            border-radius: 10px;
            background: #fff;
            color: #176d37;
            font-size: 11px;
            font-weight: 850;
            white-space: nowrap;
            cursor: pointer;
            transition: .18s ease;
          }

          .syllabus-premium .sy-refresh:hover:not(:disabled) {
            transform: translateY(-1px);
            border-color: #a9cdb1;
            background: #f1f8f2;
            box-shadow: 0 7px 17px rgba(18, 91, 47, .07);
          }

          .syllabus-premium .sy-refresh:disabled {
            opacity: .65;
            cursor: wait;
          }

          .syllabus-premium .sy-spin {
            animation: syllabus-spin .85s linear infinite;
          }

          @keyframes syllabus-spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* =========================
             ERROR
          ========================= */

          .syllabus-premium .sy-error {
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
            margin: 0 0 20px;
            padding: 13px 15px;
            border: 1px solid #f0d8c3;
            border-radius: 14px;
            background: #fff8f2;
          }

          .syllabus-premium .sy-error-icon {
            display: flex;
            flex: 0 0 36px;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: 1px solid #f0d8c3;
            border-radius: 11px;
            background: #fff;
            color: #99501f;
          }

          .syllabus-premium .sy-error-copy {
            flex: 1 1 auto;
            min-width: 0;
          }

          .syllabus-premium .sy-error-copy strong,
          .syllabus-premium .sy-error-copy span {
            display: block;
          }

          .syllabus-premium .sy-error-copy strong {
            color: #99501f;
            font-size: 11px;
          }

          .syllabus-premium .sy-error-copy span {
            margin-top: 3px;
            color: #846e5e;
            font-size: 10px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .syllabus-premium .sy-error-retry {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 35px;
            padding: 0 11px;
            border: 1px solid #ead3bf;
            border-radius: 9px;
            background: #fff;
            color: #8b4d26;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
          }

          /* =========================
             SECTION HEADING
          ========================= */

          .syllabus-premium .sy-section-heading {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 14px;
            margin: 0 0 15px;
          }

          .syllabus-premium .sy-section-eyebrow {
            display: block;
            color: #8a978e;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .15em;
          }

          .syllabus-premium .sy-section-heading h2 {
            margin: 5px 0 4px;
            color: var(--sy-ink);
            font-size: 21px;
            font-weight: 850;
            letter-spacing: -.045em;
            line-height: 1.3;
          }

          .syllabus-premium .sy-section-heading p {
            margin: 0;
            color: var(--sy-muted);
            font-size: 11px;
            line-height: 1.6;
          }

          .syllabus-premium .sy-library-badge {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 32px;
            padding: 0 11px;
            border: 1px solid #dce8de;
            border-radius: 999px;
            background: #f5faf6;
            color: #2d7444;
            font-size: 9px;
            font-weight: 850;
            white-space: nowrap;
          }

          /* =========================
             FEATURED DOCUMENT
          ========================= */

          .syllabus-premium .sy-document-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .syllabus-premium .sy-featured-document {
            position: relative;
            display: grid;
            grid-template-columns: minmax(230px, 34%) minmax(0, 1fr);
            min-width: 0;
            overflow: hidden;
            border: 1px solid #dfe8e1;
            border-radius: 20px;
            background: #fff;
            box-shadow: 0 12px 32px rgba(19, 64, 38, .05);
            transition:
              transform .22s ease,
              box-shadow .22s ease,
              border-color .22s ease;
          }

          .syllabus-premium .sy-featured-document:hover {
            transform: translateY(-2px);
            border-color: #c2d9c7;
            box-shadow: 0 19px 39px rgba(19, 64, 38, .085);
          }

          .syllabus-premium .sy-document-cover {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 335px;
            overflow: hidden;
            padding: 21px;
            background:
              radial-gradient(
                circle at 80% 12%,
                rgba(255, 255, 255, .25),
                transparent 25%
              ),
              linear-gradient(
                145deg,
                #fff4e7 0%,
                #ffffff 47%,
                #eef8ef 100%
              );
            border-right: 1px solid #e5ece6;
          }

          .syllabus-premium .sy-document-cover::before {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 4px;
            content: "";
            background: linear-gradient(
              180deg,
              #ff9933 0%,
              #fff 50%,
              #138808 100%
            );
          }

          .syllabus-premium .sy-cover-pattern {
            position: absolute;
            border: 1px solid rgba(19, 136, 8, .09);
            border-radius: 50%;
            pointer-events: none;
          }

          .syllabus-premium .sy-cover-pattern-one {
            top: -70px;
            right: -73px;
            width: 245px;
            height: 245px;
          }

          .syllabus-premium .sy-cover-pattern-two {
            right: -35px;
            bottom: -95px;
            width: 240px;
            height: 240px;
            border-color: rgba(242, 139, 45, .13);
          }

          .syllabus-premium .sy-cover-top,
          .syllabus-premium .sy-cover-bottom {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .syllabus-premium .sy-cover-brand {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            min-width: 0;
            color: #17251f;
            font-size: 11px;
            font-weight: 950;
            letter-spacing: .13em;
          }

          .syllabus-premium .sy-cover-brand-mark {
            display: flex;
            flex: 0 0 32px;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: 1px solid #e0e8e1;
            border-radius: 10px;
            background: #fff;
            color: var(--sy-green);
          }

          .syllabus-premium .sy-cover-brand small {
            display: block;
            margin-top: 3px;
            color: #849087;
            font-size: 6px;
            font-weight: 800;
            letter-spacing: .09em;
          }

          .syllabus-premium .sy-cover-pdf {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 39px;
            min-height: 26px;
            padding: 0 8px;
            border: 1px solid #f1d9c1;
            border-radius: 7px;
            background: rgba(255, 255, 255, .85);
            color: #d76e1e;
            font-size: 8px;
            font-weight: 950;
            letter-spacing: .09em;
          }

          .syllabus-premium .sy-cover-center {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 10px;
            text-align: center;
          }

          .syllabus-premium .sy-cover-file-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 91px;
            height: 105px;
            margin-bottom: 17px;
            border: 1px solid #e2eae3;
            border-radius: 19px;
            background: rgba(255, 255, 255, .92);
            color: #138808;
            box-shadow: 0 12px 27px rgba(20, 70, 38, .08);
            transition: transform .24s ease;
          }

          .syllabus-premium .sy-featured-document:hover .sy-cover-file-icon {
            transform: translateY(-3px) rotate(-2deg);
          }

          .syllabus-premium .sy-cover-document-label {
            color: #198341;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: .17em;
          }

          .syllabus-premium .sy-cover-center > strong {
            display: -webkit-box;
            max-width: 260px;
            margin-top: 8px;
            overflow: hidden;
            color: #1b3024;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: -.035em;
            line-height: 1.35;
            overflow-wrap: anywhere;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }

          .syllabus-premium .sy-cover-lines {
            display: flex;
            flex-direction: column;
            gap: 5px;
            width: 102px;
            margin-top: 14px;
          }

          .syllabus-premium .sy-cover-lines i {
            display: block;
            height: 4px;
            border-radius: 99px;
            background: #dce9de;
          }

          .syllabus-premium .sy-cover-lines i:nth-child(2) {
            width: 77%;
            align-self: center;
          }

          .syllabus-premium .sy-cover-lines i:nth-child(3) {
            width: 55%;
            align-self: center;
          }

          .syllabus-premium .sy-cover-bottom {
            color: #738177;
            font-size: 7px;
            font-weight: 900;
            letter-spacing: .12em;
          }

          .syllabus-premium .sy-cover-bottom > span:first-child {
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .syllabus-premium .sy-cover-bottom svg {
            color: var(--sy-green);
          }

          .syllabus-premium .sy-cover-page-mark {
            display: inline-flex;
            gap: 4px;
          }

          .syllabus-premium .sy-cover-page-mark i {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #b5c8b9;
          }

          .syllabus-premium .sy-cover-page-mark i:first-child {
            background: #ff9933;
          }

          .syllabus-premium .sy-cover-page-mark i:last-child {
            background: #138808;
          }

          /* DOCUMENT CONTENT */
          .syllabus-premium .sy-document-content {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            padding: 27px 29px 20px;
          }

          .syllabus-premium .sy-document-topline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
          }

          .syllabus-premium .sy-document-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #16813c;
            font-size: 8px;
            font-weight: 950;
            letter-spacing: .15em;
          }

          .syllabus-premium .sy-document-eyebrow > span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--sy-saffron);
          }

          .syllabus-premium .sy-available-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            min-height: 26px;
            padding: 0 9px;
            border: 1px solid #d5e8d8;
            border-radius: 999px;
            background: #f2faf3;
            color: #17763a;
            font-size: 8px;
            font-weight: 850;
            white-space: nowrap;
          }

          .syllabus-premium .sy-document-content h3 {
            margin: 17px 0 9px;
            color: #17251f;
            font-size: clamp(21px, 2.1vw, 29px);
            font-weight: 900;
            letter-spacing: -.05em;
            line-height: 1.22;
            overflow-wrap: anywhere;
          }

          .syllabus-premium .sy-document-description {
            max-width: 690px;
            margin: 0;
            color: #6e7b73;
            font-size: 12px;
            line-height: 1.85;
            overflow-wrap: anywhere;
          }

          .syllabus-premium .sy-document-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            margin-top: 15px;
          }

          .syllabus-premium .sy-document-tags span {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            min-height: 28px;
            padding: 0 9px;
            border: 1px solid #e3eae4;
            border-radius: 8px;
            background: #f8faf8;
            color: #607066;
            font-size: 9px;
          }

          .syllabus-premium .sy-document-tags b {
            color: #315d3c;
            font-weight: 850;
          }

          /* FILE INFO */
          .syllabus-premium .sy-document-file {
            display: flex;
            align-items: center;
            gap: 11px;
            min-width: 0;
            margin-top: 20px;
            padding: 12px;
            border: 1px solid #e3eae4;
            border-radius: 13px;
            background:
              linear-gradient(
                100deg,
                rgba(255, 153, 51, .035),
                transparent 45%,
                rgba(19, 136, 8, .035)
              ),
              #fbfcfb;
          }

          .syllabus-premium .sy-file-icon {
            display: flex;
            flex: 0 0 39px;
            align-items: center;
            justify-content: center;
            width: 39px;
            height: 39px;
            border: 1px solid #f1ddca;
            border-radius: 11px;
            background: #fff2e6;
            color: #e87522;
          }

          .syllabus-premium .sy-file-copy {
            flex: 1 1 auto;
            min-width: 0;
          }

          .syllabus-premium .sy-file-copy strong {
            display: block;
            overflow: hidden;
            color: #28362d;
            font-size: 10px;
            font-weight: 850;
            line-height: 1.5;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .syllabus-premium .sy-file-copy span {
            display: block;
            margin-top: 3px;
            color: #87938a;
            font-size: 8px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .syllabus-premium .sy-file-type {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            min-width: 35px;
            min-height: 25px;
            padding: 0 6px;
            border: 1px solid #d8e8db;
            border-radius: 7px;
            background: #f0f8f1;
            color: #19753b;
            font-size: 8px;
            font-weight: 950;
          }

          /* ACTIONS */
          .syllabus-premium .sy-document-actions {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 17px;
          }

          .syllabus-premium .sy-primary-button,
          .syllabus-premium .sy-secondary-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 42px;
            padding: 0 15px;
            border: 1px solid transparent;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 850;
            line-height: 1.2;
            text-decoration: none;
            cursor: pointer;
            transition:
              transform .18s ease,
              box-shadow .18s ease,
              background .18s ease,
              border-color .18s ease;
          }

          .syllabus-premium .sy-primary-button {
            border-color: #16833c;
            background: linear-gradient(
              105deg,
              #ff9933 0%,
              #eab33a 43%,
              #138808 100%
            );
            color: #fff;
            box-shadow: 0 7px 17px rgba(24, 111, 54, .13);
          }

          .syllabus-premium .sy-primary-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 11px 23px rgba(24, 111, 54, .20);
          }

          .syllabus-premium .sy-secondary-button {
            border-color: #d8e6da;
            background: #fff;
            color: #206b3b;
          }

          .syllabus-premium .sy-secondary-button:hover {
            transform: translateY(-2px);
            border-color: #9fc8a7;
            background: #f1f8f2;
            box-shadow: 0 7px 17px rgba(24, 111, 54, .07);
          }

          .syllabus-premium .sy-pdf-unavailable {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 38px;
            padding: 0 11px;
            border: 1px solid #f0d9c5;
            border-radius: 9px;
            background: #fff8f1;
            color: #9b5b2a;
            font-size: 9px;
            font-weight: 800;
          }

          .syllabus-premium .sy-document-footnote {
            display: flex;
            align-items: flex-start;
            gap: 7px;
            margin-top: auto;
            padding-top: 16px;
            color: #87938a;
            font-size: 9px;
            line-height: 1.55;
          }

          .syllabus-premium .sy-document-footnote svg {
            flex: 0 0 auto;
            margin-top: 1px;
            color: #3c9656;
          }

          .syllabus-premium .sy-document-bottom-line {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(
              90deg,
              #ff9933 0%,
              #fff 50%,
              #138808 100%
            );
          }

          /* =========================
             EMPTY STATE
          ========================= */

          .syllabus-premium .sy-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 260px;
            padding: 30px 22px;
            border: 1px dashed #d1dfd4;
            border-radius: 19px;
            background:
              radial-gradient(
                circle at 50% 0%,
                rgba(19, 136, 8, .04),
                transparent 55%
              ),
              #fff;
            text-align: center;
          }

          .syllabus-premium .sy-empty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 61px;
            height: 61px;
            border: 1px solid #dce8de;
            border-radius: 18px;
            background: linear-gradient(145deg, #fff2e4, #eef7ef);
            color: var(--sy-green);
          }

          .syllabus-premium .sy-empty h3 {
            margin: 15px 0 6px;
            color: var(--sy-ink);
            font-size: 16px;
            font-weight: 850;
          }

          .syllabus-premium .sy-empty p {
            max-width: 440px;
            margin: 0;
            color: var(--sy-muted);
            font-size: 11px;
            line-height: 1.75;
          }

          .syllabus-premium .sy-empty-clear {
            min-height: 38px;
            margin-top: 16px;
            padding: 0 14px;
            border: 1px solid #d4e6d7;
            border-radius: 10px;
            background: #f1f8f2;
            color: var(--sy-green-dark);
            font-size: 10px;
            font-weight: 850;
            cursor: pointer;
            transition: .18s ease;
          }

          .syllabus-premium .sy-empty-clear:hover {
            background: #e7f4e9;
            border-color: #a9cdb1;
          }

          /* =========================
             FOOTER NOTE
          ========================= */

          .syllabus-premium .sy-footer-note {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
            padding: 13px 15px;
            border: 1px solid #e2eae3;
            border-radius: 13px;
            background: #f8fbf8;
          }

          .syllabus-premium .sy-footer-icon {
            display: flex;
            flex: 0 0 32px;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: 1px solid #dce8de;
            border-radius: 10px;
            background: #fff;
            color: var(--sy-green);
          }

          .syllabus-premium .sy-footer-note p {
            min-width: 0;
            margin: 0;
          }

          .syllabus-premium .sy-footer-note strong,
          .syllabus-premium .sy-footer-note span {
            display: block;
          }

          .syllabus-premium .sy-footer-note strong {
            color: #496151;
            font-size: 10px;
            font-weight: 850;
          }

          .syllabus-premium .sy-footer-note span {
            margin-top: 3px;
            color: #87938a;
            font-size: 9px;
            line-height: 1.5;
          }

          /* =========================
             SKELETON
          ========================= */

          .syllabus-premium .sy-featured-skeleton {
            display: grid;
            grid-template-columns: minmax(230px, 34%) minmax(0, 1fr);
            min-height: 335px;
            overflow: hidden;
            border: 1px solid #e1eae3;
            border-radius: 20px;
            background: #fff;
            animation: syllabus-pulse 1.4s ease-in-out infinite;
          }

          .syllabus-premium .sy-skeleton-cover {
            min-height: 335px;
            background: linear-gradient(
              145deg,
              #edf3ee,
              #f8faf8,
              #eef4ef
            );
          }

          .syllabus-premium .sy-skeleton-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 13px;
            padding: 30px;
          }

          .syllabus-premium .sy-skeleton-content span {
            display: block;
            border-radius: 99px;
            background: #e7eee8;
          }

          .syllabus-premium .sy-skeleton-short {
            width: 110px;
            height: 9px;
          }

          .syllabus-premium .sy-skeleton-title {
            width: 65%;
            height: 23px;
            margin-top: 8px;
          }

          .syllabus-premium .sy-skeleton-line {
            width: 90%;
            height: 11px;
          }

          .syllabus-premium .sy-skeleton-line-small {
            width: 58%;
          }

          .syllabus-premium .sy-skeleton-button {
            width: 150px;
            height: 42px;
            margin-top: 17px;
            border-radius: 10px !important;
          }

          @keyframes syllabus-pulse {
            0%, 100% {
              opacity: .58;
            }
            50% {
              opacity: 1;
            }
          }

          /* =========================
             RESPONSIVE
          ========================= */

          @media (max-width: 850px) {
            .syllabus-premium .sy-hero {
              grid-template-columns: minmax(0, 1fr) 220px;
            }

            .syllabus-premium .sy-hero-copy {
              padding: 27px;
            }

            .syllabus-premium .sy-hero-document {
              right: 18px;
              width: 157px;
            }

            .syllabus-premium .sy-featured-document,
            .syllabus-premium .sy-featured-skeleton {
              grid-template-columns: minmax(205px, 32%) minmax(0, 1fr);
            }

            .syllabus-premium .sy-document-content {
              padding: 23px 21px 18px;
            }
          }

          @media (max-width: 650px) {
            .syllabus-premium .sy-hero {
              display: block;
              border-radius: 20px;
            }

            .syllabus-premium .sy-hero-copy {
              padding: 23px 20px 16px;
            }

            .syllabus-premium .sy-hero-copy h1 {
              font-size: 30px;
            }

            .syllabus-premium .sy-hero-copy > p {
              font-size: 11px;
            }

            .syllabus-premium .sy-hero-visual {
              min-height: 123px;
            }

            .syllabus-premium .sy-hero-document {
              top: 2px;
              right: 20px;
              width: 132px;
              height: 108px;
              gap: 4px;
              border-radius: 16px;
              transform: none;
            }

            .syllabus-premium .sy-hero-document-icon {
              width: 35px;
              height: 35px;
              border-radius: 10px;
            }

            .syllabus-premium .sy-hero-document-icon svg {
              width: 22px;
              height: 22px;
            }

            .syllabus-premium .sy-hero-document > span {
              font-size: 6px;
            }

            .syllabus-premium .sy-hero-document > strong {
              font-size: 8px;
            }

            .syllabus-premium .sy-hero-document-lines {
              gap: 3px;
              width: 57px;
            }

            .syllabus-premium .sy-hero-document-lines i {
              height: 2px;
            }

            .syllabus-premium .sy-orbit-a {
              top: -36px;
              right: -63px;
              width: 220px;
              height: 220px;
            }

            .syllabus-premium .sy-orbit-b {
              top: -6px;
              right: -32px;
              width: 158px;
              height: 158px;
            }

            .syllabus-premium .sy-orbit-c {
              top: 18px;
              right: 2px;
              width: 105px;
              height: 105px;
            }

            .syllabus-premium .sy-float-one {
              top: 13px;
              right: 173px;
            }

            .syllabus-premium .sy-float-two {
              right: 12px;
              bottom: 12px;
            }

            .syllabus-premium .sy-summary {
              gap: 10px;
              padding: 12px;
            }

            .syllabus-premium .sy-summary-icon {
              flex-basis: 37px;
              width: 37px;
              height: 37px;
            }

            .syllabus-premium .sy-summary-copy strong {
              font-size: 11px;
            }

            .syllabus-premium .sy-summary-copy p {
              font-size: 9px;
            }

            .syllabus-premium .sy-summary-count {
              min-width: 68px;
              min-height: 48px;
              padding: 6px 8px;
            }

            .syllabus-premium .sy-summary-count strong {
              font-size: 20px;
            }

            .syllabus-premium .sy-summary-count span {
              font-size: 6px;
            }

            .syllabus-premium .sy-toolbar {
              grid-template-columns: minmax(0, 1fr);
              padding: 9px;
            }

            .syllabus-premium .sy-refresh {
              width: 100%;
            }

            .syllabus-premium .sy-section-heading {
              align-items: flex-start;
              flex-direction: column;
              gap: 9px;
            }

            .syllabus-premium .sy-featured-document,
            .syllabus-premium .sy-featured-skeleton {
              grid-template-columns: minmax(0, 1fr);
            }

            .syllabus-premium .sy-document-cover {
              min-height: 235px;
              border-right: 0;
              border-bottom: 1px solid #e5ece6;
              padding: 17px;
            }

            .syllabus-premium .sy-cover-center {
              padding: 13px 10px;
            }

            .syllabus-premium .sy-cover-file-icon {
              width: 66px;
              height: 73px;
              margin-bottom: 11px;
              border-radius: 15px;
            }

            .syllabus-premium .sy-cover-file-icon svg {
              width: 37px;
              height: 37px;
            }

            .syllabus-premium .sy-cover-center > strong {
              font-size: 15px;
            }

            .syllabus-premium .sy-document-content {
              padding: 20px 17px 17px;
            }

            .syllabus-premium .sy-document-content h3 {
              margin-top: 13px;
              font-size: 22px;
            }

            .syllabus-premium .sy-document-description {
              font-size: 11px;
            }

            .syllabus-premium .sy-document-file {
              margin-top: 16px;
              padding: 10px;
            }

            .syllabus-premium .sy-file-copy strong {
              font-size: 9px;
            }

            .syllabus-premium .sy-file-copy span {
              font-size: 8px;
            }

            .syllabus-premium .sy-document-actions {
              display: grid;
              grid-template-columns: minmax(0, 1fr);
            }

            .syllabus-premium .sy-primary-button,
            .syllabus-premium .sy-secondary-button {
              width: 100%;
              min-height: 43px;
            }

            .syllabus-premium .sy-featured-skeleton {
              min-height: 0;
            }

            .syllabus-premium .sy-skeleton-cover {
              min-height: 180px;
            }

            .syllabus-premium .sy-skeleton-content {
              padding: 19px;
            }
          }

          @media (max-width: 390px) {
            .syllabus-premium .sy-summary {
              flex-wrap: wrap;
            }

            .syllabus-premium .sy-summary-copy {
              flex: 1 1 calc(100% - 60px);
            }

            .syllabus-premium .sy-summary-count {
              margin-left: 47px;
            }

            .syllabus-premium .sy-document-topline {
              align-items: flex-start;
            }

            .syllabus-premium .sy-available-badge {
              font-size: 7px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .syllabus-premium *,
            .syllabus-premium *::before,
            .syllabus-premium *::after {
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