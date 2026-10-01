
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Filter,
  Layers3,
  Pin,
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

function textValue(value, fallback = "") {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text || fallback;
  }

  if (typeof value === "object") {
    const text =
      value.name ||
      value.title ||
      value.label ||
      value.value ||
      "";

    return String(text).trim() || fallback;
  }

  return fallback;
}

function getNoticeTitle(item) {
  return (
    textValue(item?.title) ||
    textValue(item?.name) ||
    textValue(item?.subject) ||
    "Untitled Notice"
  );
}

function getNoticeDescription(item) {
  return (
    textValue(item?.description) ||
    textValue(item?.content) ||
    textValue(item?.details) ||
    textValue(item?.message) ||
    textValue(item?.instructions) ||
    "No additional details are available for this notice."
  );
}

function getNoticeCategory(item) {
  return (
    textValue(item?.category) ||
    textValue(item?.notice_type) ||
    textValue(item?.type) ||
    "General"
  );
}

function getNoticeDateValue(item) {
  return (
    item?.date ||
    item?.published_at ||
    item?.created_at ||
    item?.updated_at ||
    item?.createdAt ||
    null
  );
}

function parseNoticeDate(value) {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatNoticeDate(value) {
  if (!value) return "Date not specified";

  const parsed = parseNoticeDate(value);

  if (!parsed) {
    return textValue(value, "Date not specified");
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(parsed);
  } catch {
    return parsed.toLocaleDateString();
  }
}

function getDateTimestamp(item) {
  const parsed = parseNoticeDate(getNoticeDateValue(item));
  return parsed ? parsed.getTime() : 0;
}

function isTrue(value) {
  return value === true || value === 1 || value === "true";
}

function isImportantNotice(item) {
  const priority = textValue(item?.priority).toLowerCase();
  const status = textValue(item?.status).toLowerCase();
  const category = getNoticeCategory(item).toLowerCase();

  return (
    isTrue(item?.is_important) ||
    isTrue(item?.important) ||
    isTrue(item?.urgent) ||
    priority === "important" ||
    priority === "urgent" ||
    priority === "high" ||
    priority === "critical" ||
    status === "important" ||
    status === "urgent" ||
    category.includes("important") ||
    category.includes("examination") ||
    category.includes("exam")
  );
}

function isPinnedNotice(item) {
  return (
    isTrue(item?.is_pinned) ||
    isTrue(item?.pinned) ||
    isTrue(item?.isPinned) ||
    Boolean(item?.pinned_at)
  );
}

function getNoticeAttachment(item) {
  const attachment =
    item?.pdf_url ||
    item?.pdf_path ||
    item?.file_path ||
    item?.attachment_url ||
    item?.file_url ||
    item?.document_url ||
    item?.attachment ||
    "";

  if (typeof attachment === "object" && attachment !== null) {
    return textValue(
      attachment.url || attachment.path || attachment.href,
    );
  }

  return textValue(attachment);
}

function getAttachmentName(item, url) {
  const providedName =
    item?.file_name ||
    item?.filename ||
    item?.attachment_name ||
    item?.pdf_name;

  if (providedName) return textValue(providedName);

  try {
    const parsed = new URL(url, "https://utkarsh.local");
    const pathName = parsed.pathname.split("/").pop();
    return decodeURIComponent(pathName || "Notice attachment");
  } catch {
    return "Notice attachment";
  }
}

function getNoticeIdentity(item, index) {
  if (item?.id !== null && item?.id !== undefined) {
    return String(item.id);
  }

  const title = getNoticeTitle(item);
  const date = textValue(getNoticeDateValue(item));
  const description = getNoticeDescription(item);

  return `${title}-${date}-${description.slice(0, 40)}-${index}`;
}

function uniqueNotices(list) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();

  return list.filter((item, index) => {
    if (!item || typeof item !== "object") return false;

    const id =
      item.id !== null && item.id !== undefined
        ? `id:${String(item.id)}`
        : `fallback:${getNoticeTitle(item)}|${textValue(
            getNoticeDateValue(item),
          )}|${getNoticeDescription(item)}`;

    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });
}

function getCategoryClass(category) {
  const value = String(category || "").toLowerCase();

  if (value.includes("exam")) return "nb-category-exam";
  if (value.includes("academic")) return "nb-category-academic";
  if (value.includes("event")) return "nb-category-event";
  if (value.includes("important")) return "nb-category-important";

  return "nb-category-general";
}

/* =========================================================
   NOTICE CARD
========================================================= */

function NoticeCard({ notice, index, onOpen }) {
  const title = getNoticeTitle(notice);
  const description = getNoticeDescription(notice);
  const category = getNoticeCategory(notice);
  const date = getNoticeDateValue(notice);
  const attachment = getNoticeAttachment(notice);
  const important = isImportantNotice(notice);
  const pinned = isPinnedNotice(notice);

  return (
    <article
      className={`nb-notice-card ${
        important ? "nb-notice-card-important" : ""
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="nb-card-accent" />

      <div className="nb-card-content">
        <div className="nb-card-topline">
          <div className="nb-card-badges">
            <span className={`nb-category-badge ${getCategoryClass(category)}`}>
              <Layers3 size={12} />
              {category}
            </span>

            {important && (
              <span className="nb-important-badge">
                <AlertTriangle size={12} />
                Important
              </span>
            )}

            {pinned && (
              <span className="nb-pinned-badge">
                <Pin size={12} />
                Pinned
              </span>
            )}
          </div>

          <span className="nb-card-index">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h3 className="nb-card-title">{title}</h3>

        <p className="nb-card-description">{description}</p>

        <div className="nb-card-footer">
          <div className="nb-card-date">
            <CalendarDays size={14} />
            <span>{formatNoticeDate(date)}</span>
          </div>

          <div className="nb-card-actions">
            {attachment && (
              <a
                className="nb-attachment-button"
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open attachment for ${title}`}
                onClick={(event) => event.stopPropagation()}
              >
                <FileText size={15} />
                <span>PDF</span>
                <ArrowUpRight size={13} />
              </a>
            )}

            <button
              type="button"
              className="nb-read-button"
              onClick={() => onOpen(notice)}
            >
              Read Notice
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   NOTICE DETAILS MODAL
========================================================= */

function NoticeModal({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [notice, onClose]);

  if (!notice) return null;

  const title = getNoticeTitle(notice);
  const description = getNoticeDescription(notice);
  const category = getNoticeCategory(notice);
  const date = getNoticeDateValue(notice);
  const attachment = getNoticeAttachment(notice);
  const attachmentName = getAttachmentName(notice, attachment);
  const important = isImportantNotice(notice);
  const pinned = isPinnedNotice(notice);

  return (
    <div
      className="nb-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="nb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nb-modal-title"
      >
        <div className="nb-modal-top-accent" />

        <div className="nb-modal-header">
          <div className="nb-modal-icon">
            <Bell size={22} />
          </div>

          <button
            type="button"
            className="nb-modal-close"
            onClick={onClose}
            aria-label="Close notice"
          >
            <X size={19} />
          </button>
        </div>

        <div className="nb-modal-body">
          <div className="nb-modal-badges">
            <span className={`nb-category-badge ${getCategoryClass(category)}`}>
              <Layers3 size={12} />
              {category}
            </span>

            {important && (
              <span className="nb-important-badge">
                <AlertTriangle size={12} />
                Important
              </span>
            )}

            {pinned && (
              <span className="nb-pinned-badge">
                <Pin size={12} />
                Pinned
              </span>
            )}
          </div>

          <h2 id="nb-modal-title" className="nb-modal-title">
            {title}
          </h2>

          <div className="nb-modal-date">
            <CalendarDays size={15} />
            <span>{formatNoticeDate(date)}</span>
          </div>

          <div className="nb-modal-divider" />

          <div className="nb-modal-description">{description}</div>

          {attachment && (
            <a
              className="nb-modal-attachment"
              href={attachment}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nb-modal-attachment-icon">
                <FileText size={19} />
              </span>

              <span className="nb-modal-attachment-copy">
                <strong>{attachmentName}</strong>
                <small>Open attached document</small>
              </span>

              <span className="nb-modal-attachment-action">
                <Download size={17} />
              </span>
            </a>
          )}
        </div>

        <div className="nb-modal-footer">
          <span className="nb-modal-security">
            <ShieldCheck size={14} />
            UTKARSH Notice Board
          </span>

          <button
            type="button"
            className="nb-modal-done"
            onClick={onClose}
          >
            Done
            <CheckCircle2 size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MAIN NOTICES PAGE
========================================================= */

export default function NoticesResourcePage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [importantOnly, setImportantOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("newest");
  const [selectedNotice, setSelectedNotice] = useState(null);

  const loadNotices = useCallback(async (options = {}) => {
    const { signal, manual = false } = options;

    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        "/api/data?resource=notices",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          ...(signal ? { signal } : {}),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || "Unable to load notices. Please try again.",
        );
      }

      if (!result || result.success === false) {
        throw new Error(
          result?.message || "The server returned an invalid notice response.",
        );
      }

      const nextNotices = uniqueNotices(result.data);

      if (signal?.aborted) return;

      setNotices(nextNotices);

      if (result.unavailable) {
        setError(
          result.message ||
            "The notice service is temporarily unavailable.",
        );
      }
    } catch (err) {
      if (err?.name === "AbortError") return;

      setError(
        err?.message ||
          "Something went wrong while loading the notices.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadNotices({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadNotices]);

  const categories = useMemo(() => {
    const values = notices.map(getNoticeCategory);
    return ["All", ...new Set(values.filter(Boolean))];
  }, [notices]);

  const importantCount = useMemo(
    () => notices.filter(isImportantNotice).length,
    [notices],
  );

  const latestNotice = useMemo(() => {
    if (!notices.length) return null;

    return [...notices].sort(
      (a, b) => getDateTimestamp(b) - getDateTimestamp(a),
    )[0];
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = notices.filter((notice) => {
      const matchesCategory =
        activeCategory === "All" ||
        getNoticeCategory(notice) === activeCategory;

      const matchesImportance =
        !importantOnly || isImportantNotice(notice);

      const searchableText = [
        getNoticeTitle(notice),
        getNoticeDescription(notice),
        getNoticeCategory(notice),
        textValue(notice?.priority),
        textValue(notice?.status),
        textValue(notice?.subject),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesCategory && matchesImportance && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const difference = getDateTimestamp(a) - getDateTimestamp(b);

      return sortOrder === "newest" ? -difference : difference;
    });
  }, [notices, search, activeCategory, importantOnly, sortOrder]);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setImportantOnly(false);
    setSortOrder("newest");
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    activeCategory !== "All" ||
    importantOnly;

  return (
    <AppShell
      role="student"
      title="College Notices"
      subtitle="Official announcements and academic updates"
    >
      <main className="nb-page">
        <div className="nb-container">
          {/* HERO */}
          <section className="nb-hero">
            <div className="nb-hero-pattern" aria-hidden="true" />
            <div className="nb-hero-orb nb-hero-orb-one" aria-hidden="true" />
            <div className="nb-hero-orb nb-hero-orb-two" aria-hidden="true" />

            <div className="nb-hero-copy">
              <div className="nb-eyebrow">
                <span className="nb-eyebrow-dot" />
                STUDENT INFORMATION CENTRE
              </div>

              <h1>
                Campus <span>Notice Board</span>
              </h1>

              <p>
                Stay informed with official college announcements,
                academic updates, schedules and important information
                from one organised space.
              </p>

              <div className="nb-hero-pills">
                <span>
                  <ShieldCheck size={14} />
                  Official updates
                </span>
                <span>
                  <Bell size={14} />
                  Academic notices
                </span>
              </div>
            </div>

            <div className="nb-hero-art" aria-hidden="true">
              <div className="nb-art-halo" />
              <div className="nb-art-board">
                <div className="nb-art-board-top">
                  <span className="nb-art-board-dot" />
                  <span className="nb-art-board-dot" />
                  <span className="nb-art-board-dot" />
                  <span className="nb-art-board-label">NOTICE</span>
                </div>

                <div className="nb-art-paper">
                  <div className="nb-art-paper-seal">
                    <Bell size={18} />
                  </div>
                  <div className="nb-art-paper-title" />
                  <div className="nb-art-paper-line nb-art-paper-line-long" />
                  <div className="nb-art-paper-line" />
                  <div className="nb-art-paper-line nb-art-paper-line-short" />

                  <div className="nb-art-paper-stamp">
                    <CheckCircle2 size={12} />
                    RELEASED
                  </div>
                </div>

                <div className="nb-art-board-foot">
                  <span />
                  <span />
                </div>
              </div>

              <div className="nb-art-floating nb-art-floating-bell">
                <Bell size={18} />
              </div>

              <div className="nb-art-floating nb-art-floating-check">
                <CheckCircle2 size={18} />
              </div>

              <div className="nb-art-tricolour">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="nb-hero-bottom">
              <span className="nb-hero-bottom-line" />
              <span>UTKARSH · NARULA INSTITUTE OF TECHNOLOGY</span>
            </div>
          </section>

          {/* STATS */}
          <section className="nb-stats-grid" aria-label="Notice summary">
            <div className="nb-stat-card">
              <span className="nb-stat-icon nb-stat-icon-saffron">
                <Bell size={18} />
              </span>

              <div className="nb-stat-copy">
                <span className="nb-stat-label">Total Notices</span>
                <strong>{loading ? "—" : notices.length}</strong>
                <small>Available announcements</small>
              </div>
            </div>

            <div className="nb-stat-card">
              <span className="nb-stat-icon nb-stat-icon-blue">
                <Layers3 size={18} />
              </span>

              <div className="nb-stat-copy">
                <span className="nb-stat-label">Categories</span>
                <strong>{loading ? "—" : Math.max(categories.length - 1, 0)}</strong>
                <small>Notice classifications</small>
              </div>
            </div>

            <div className="nb-stat-card">
              <span className="nb-stat-icon nb-stat-icon-red">
                <AlertTriangle size={18} />
              </span>

              <div className="nb-stat-copy">
                <span className="nb-stat-label">Important</span>
                <strong>{loading ? "—" : importantCount}</strong>
                <small>Marked priority notices</small>
              </div>
            </div>

            <div className="nb-stat-card nb-stat-card-latest">
              <span className="nb-stat-icon nb-stat-icon-green">
                <CalendarDays size={18} />
              </span>

              <div className="nb-stat-copy">
                <span className="nb-stat-label">Latest Notice</span>
                <strong className="nb-stat-date">
                  {loading
                    ? "Loading"
                    : latestNotice
                      ? formatNoticeDate(getNoticeDateValue(latestNotice))
                      : "No notices"}
                </strong>
                <small>Based on available notice dates</small>
              </div>
            </div>
          </section>

          {/* BOARD HEADING */}
          <section className="nb-board-heading">
            <div className="nb-board-heading-copy">
              <div className="nb-section-kicker">
                <span className="nb-section-kicker-mark" />
                NOTICE ARCHIVE
              </div>

              <h2>Latest Announcements</h2>

              <p>
                Browse published notices, search by keyword, or filter
                by category and importance.
              </p>
            </div>

            <div className="nb-board-heading-actions">
              <div className="nb-feed-status">
                <span className="nb-feed-status-dot" />
                Notice feed
              </div>

              <button
                type="button"
                className="nb-refresh-button"
                onClick={() => loadNotices({ manual: true })}
                disabled={loading || refreshing}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "nb-spin" : ""}
                />
                <span>{refreshing ? "Refreshing" : "Refresh"}</span>
              </button>
            </div>
          </section>

          {/* FILTER TOOLBAR */}
          <section className="nb-toolbar" aria-label="Notice filters">
            <div className="nb-search-wrap">
              <Search size={18} className="nb-search-icon" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notices, topics or keywords..."
                aria-label="Search notices"
                className="nb-search-input"
              />

              {search && (
                <button
                  type="button"
                  className="nb-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="nb-toolbar-controls">
              <button
                type="button"
                className={`nb-filter-button ${
                  importantOnly ? "nb-filter-button-active" : ""
                }`}
                onClick={() => setImportantOnly((value) => !value)}
                aria-pressed={importantOnly}
              >
                <Filter size={15} />
                Important
                <span className="nb-filter-count">
                  {loading ? "—" : importantCount}
                </span>
              </button>

              <label className="nb-sort-control">
                <Clock3 size={15} />
                <span className="nb-sort-label">Sort</span>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  aria-label="Sort notices"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
          </section>

          {/* CATEGORY FILTERS */}
          <section className="nb-category-section" aria-label="Notice categories">
            <div className="nb-category-heading">
              <span className="nb-category-heading-label">
                <Layers3 size={15} />
                Browse by category
              </span>

              <span className="nb-result-count">
                {loading
                  ? "Loading notices..."
                  : `${filteredNotices.length} ${
                      filteredNotices.length === 1 ? "notice" : "notices"
                    }`}
              </span>
            </div>

            <div className="nb-category-list">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`nb-category-filter ${
                    activeCategory === category
                      ? "nb-category-filter-active"
                      : ""
                  }`}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={activeCategory === category}
                >
                  {category === "All" ? (
                    <Sparkles size={14} />
                  ) : (
                    <Layers3 size={14} />
                  )}
                  {category}
                  {category === "All" && (
                    <span className="nb-category-filter-count">
                      {loading ? "—" : notices.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div className="nb-error-banner" role="alert">
              <span className="nb-error-icon">
                <AlertTriangle size={18} />
              </span>

              <div className="nb-error-copy">
                <strong>Notice feed message</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                className="nb-error-retry"
                onClick={() => loadNotices({ manual: true })}
                disabled={refreshing}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "nb-spin" : ""}
                />
                Retry
              </button>
            </div>
          )}

          {/* NOTICE LIST */}
          {loading ? (
            <section className="nb-notice-grid" aria-label="Loading notices">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="nb-skeleton-card" key={index}>
                  <div className="nb-skeleton-top">
                    <span />
                    <span />
                  </div>
                  <div className="nb-skeleton-title" />
                  <div className="nb-skeleton-line" />
                  <div className="nb-skeleton-line nb-skeleton-line-short" />
                  <div className="nb-skeleton-bottom">
                    <span />
                    <span />
                  </div>
                </div>
              ))}
            </section>
          ) : filteredNotices.length > 0 ? (
            <section className="nb-notice-grid" aria-label="Published notices">
              {filteredNotices.map((notice, index) => (
                <NoticeCard
                  key={getNoticeIdentity(notice, index)}
                  notice={notice}
                  index={index}
                  onOpen={setSelectedNotice}
                />
              ))}
            </section>
          ) : (
            <section className="nb-empty-state">
              <div className="nb-empty-art">
                <div className="nb-empty-art-ring" />
                <div className="nb-empty-art-icon">
                  {hasActiveFilters ? (
                    <Search size={29} />
                  ) : (
                    <Bell size={29} />
                  )}
                </div>
                <span className="nb-empty-art-spark nb-empty-art-spark-one" />
                <span className="nb-empty-art-spark nb-empty-art-spark-two" />
              </div>

              <div className="nb-empty-copy">
                <span className="nb-empty-kicker">
                  {hasActiveFilters ? "NO MATCHES FOUND" : "NOTICE BOARD"}
                </span>

                <h3>
                  {hasActiveFilters
                    ? "No notices match your filters"
                    : "No notices published yet"}
                </h3>

                <p>
                  {hasActiveFilters
                    ? "Try changing your search term or clearing the selected filters to see more notices."
                    : "New college announcements will appear here when they are available."}
                </p>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="nb-empty-reset"
                    onClick={clearFilters}
                  >
                    <RefreshCw size={15} />
                    Clear all filters
                  </button>
                )}
              </div>
            </section>
          )}

          {/* FOOTER NOTE */}
          <footer className="nb-page-footer">
            <div className="nb-footer-mark">
              <ShieldCheck size={17} />
            </div>

            <div className="nb-footer-copy">
              <strong>Stay informed. Stay organised.</strong>
              <span>
                Check this board regularly for academic announcements
                and college updates.
              </span>
            </div>

            <div className="nb-footer-brand">
              <span className="nb-footer-tricolour">
                <i />
                <i />
                <i />
              </span>
              <span>UTKARSH</span>
            </div>
          </footer>
        </div>

        <NoticeModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
        />
      </main>

      <style jsx global>{`
        .nb-page {
          --nb-ink: #15263a;
          --nb-muted: #718096;
          --nb-line: #e8edf2;
          --nb-saffron: #f28c28;
          --nb-green: #16834a;
          --nb-navy: #234b7a;
          width: 100%;
          min-height: 100%;
          padding: 24px 24px 40px;
          background:
            radial-gradient(
              circle at 2% 2%,
              rgba(255, 153, 51, 0.055),
              transparent 24%
            ),
            radial-gradient(
              circle at 98% 38%,
              rgba(22, 131, 74, 0.045),
              transparent 26%
            ),
            #f6f8fb;
          color: var(--nb-ink);
          box-sizing: border-box;
        }

        .nb-page *,
        .nb-page *::before,
        .nb-page *::after {
          box-sizing: border-box;
        }

        .nb-container {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
        }

        /* HERO */

        .nb-hero {
          isolation: isolate;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 270px;
          overflow: hidden;
          padding: 34px 42px 46px;
          border: 1px solid rgba(228, 235, 242, 0.9);
          border-radius: 24px;
          background:
            linear-gradient(
              112deg,
              #ffffff 0%,
              #ffffff 48%,
              #f4f9f7 100%
            );
          box-shadow:
            0 16px 45px rgba(25, 47, 74, 0.055),
            0 2px 7px rgba(25, 47, 74, 0.025);
        }

        .nb-hero::before {
          position: absolute;
          z-index: -1;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          content: "";
          background: linear-gradient(
            180deg,
            #f28c28 0%,
            #ffffff 48%,
            #16834a 100%
          );
        }

        .nb-hero-pattern {
          position: absolute;
          z-index: -1;
          inset: 0;
          opacity: 0.33;
          pointer-events: none;
          background-image: radial-gradient(
            rgba(36, 75, 122, 0.11) 0.7px,
            transparent 0.7px
          );
          background-size: 18px 18px;
          mask-image: linear-gradient(
            90deg,
            transparent 10%,
            #000 75%,
            #000 100%
          );
        }

        .nb-hero-orb {
          position: absolute;
          z-index: -1;
          border-radius: 50%;
          pointer-events: none;
        }

        .nb-hero-orb-one {
          top: -130px;
          right: 25%;
          width: 260px;
          height: 260px;
          border: 1px solid rgba(242, 140, 40, 0.12);
          box-shadow:
            0 0 0 26px rgba(242, 140, 40, 0.025),
            0 0 0 52px rgba(242, 140, 40, 0.018);
        }

        .nb-hero-orb-two {
          right: 9%;
          bottom: -205px;
          width: 300px;
          height: 300px;
          border: 1px solid rgba(22, 131, 74, 0.12);
          box-shadow: 0 0 0 34px rgba(22, 131, 74, 0.025);
        }

        .nb-hero-copy {
          position: relative;
          z-index: 2;
          width: min(680px, 67%);
        }

        .nb-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 17px;
          color: #66778a;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 0.17em;
        }

        .nb-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--nb-green);
          box-shadow: 0 0 0 4px rgba(22, 131, 74, 0.1);
        }

        .nb-hero h1 {
          margin: 0;
          color: #15263a;
          font-size: clamp(30px, 3.2vw, 46px);
          font-weight: 850;
          line-height: 1.1;
          letter-spacing: -0.045em;
        }

        .nb-hero h1 span {
          color: #1a684b;
        }

        .nb-hero-copy > p {
          max-width: 620px;
          margin: 15px 0 20px;
          color: #68788b;
          font-size: 14px;
          font-weight: 450;
          line-height: 1.75;
        }

        .nb-hero-pills {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .nb-hero-pills span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          border: 1px solid #e9eff0;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.78);
          color: #506477;
          font-size: 11px;
          font-weight: 700;
        }

        .nb-hero-pills span:first-child svg {
          color: var(--nb-green);
        }

        .nb-hero-pills span:last-child svg {
          color: var(--nb-saffron);
        }

        .nb-hero-art {
          position: relative;
          display: grid;
          flex: 0 0 290px;
          min-height: 206px;
          place-items: center;
          margin-right: 12px;
        }

        .nb-art-halo {
          position: absolute;
          width: 210px;
          height: 210px;
          border: 1px solid rgba(22, 131, 74, 0.13);
          border-radius: 50%;
          box-shadow:
            0 0 0 17px rgba(22, 131, 74, 0.028),
            0 0 0 37px rgba(242, 140, 40, 0.025);
        }

        .nb-art-board {
          position: relative;
          z-index: 2;
          width: 174px;
          padding: 0 12px 13px;
          border: 1px solid #dfe8e7;
          border-radius: 12px;
          background: linear-gradient(145deg, #ffffff, #f7faf9);
          box-shadow:
            0 23px 35px rgba(30, 57, 77, 0.13),
            0 5px 13px rgba(30, 57, 77, 0.055);
          transform: rotate(-4deg);
        }

        .nb-art-board-top {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 26px;
          border-bottom: 1px solid #eaf0ef;
        }

        .nb-art-board-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #d4dedb;
        }

        .nb-art-board-dot:first-child {
          background: #f0a24f;
        }

        .nb-art-board-label {
          margin-left: auto;
          color: #729183;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .nb-art-paper {
          position: relative;
          min-height: 139px;
          margin-top: 10px;
          padding: 13px 11px;
          border: 1px solid #edf1ef;
          border-radius: 6px;
          background: #fff;
        }

        .nb-art-paper-seal {
          display: grid;
          width: 32px;
          height: 32px;
          margin-bottom: 9px;
          place-items: center;
          border-radius: 50%;
          background: #fff4e9;
          color: #d77d24;
        }

        .nb-art-paper-title {
          width: 73%;
          height: 6px;
          margin-bottom: 10px;
          border-radius: 5px;
          background: #284c6c;
          opacity: 0.82;
        }

        .nb-art-paper-line {
          width: 82%;
          height: 4px;
          margin-top: 6px;
          border-radius: 4px;
          background: #e0e8e7;
        }

        .nb-art-paper-line-long {
          width: 100%;
        }

        .nb-art-paper-line-short {
          width: 58%;
        }

        .nb-art-paper-stamp {
          position: absolute;
          right: 9px;
          bottom: 9px;
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 4px 6px;
          border: 1px solid #b8dbc5;
          border-radius: 4px;
          color: #23804c;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: 0.08em;
          transform: rotate(-5deg);
        }

        .nb-art-board-foot {
          display: flex;
          justify-content: space-between;
          margin-top: 9px;
        }

        .nb-art-board-foot span {
          width: 28px;
          height: 3px;
          border-radius: 4px;
          background: #e6ece9;
        }

        .nb-art-floating {
          position: absolute;
          z-index: 3;
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          border: 1px solid rgba(235, 241, 239, 0.9);
          border-radius: 13px;
          background: #fff;
          box-shadow: 0 10px 23px rgba(29, 61, 72, 0.1);
        }

        .nb-art-floating-bell {
          top: 28px;
          right: 28px;
          color: #e58a2d;
          transform: rotate(7deg);
        }

        .nb-art-floating-check {
          bottom: 26px;
          left: 25px;
          color: #269259;
          transform: rotate(-8deg);
        }

        .nb-art-tricolour {
          position: absolute;
          right: 32px;
          bottom: 8px;
          display: flex;
          gap: 4px;
          opacity: 0.88;
          transform: rotate(-4deg);
        }

        .nb-art-tricolour span {
          width: 19px;
          height: 4px;
          border-radius: 5px;
        }

        .nb-art-tricolour span:nth-child(1) {
          background: #f28c28;
        }

        .nb-art-tricolour span:nth-child(2) {
          background: #8aa1b2;
        }

        .nb-art-tricolour span:nth-child(3) {
          background: #16834a;
        }

        .nb-hero-bottom {
          position: absolute;
          right: 27px;
          bottom: 17px;
          left: 42px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #8997a3;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.15em;
        }

        .nb-hero-bottom-line {
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

        .nb-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-top: 18px;
        }

        .nb-stat-card {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
          padding: 17px 18px;
          border: 1px solid #e9eef3;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(25, 47, 74, 0.035);
        }

        .nb-stat-icon {
          display: grid;
          flex: 0 0 42px;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 13px;
        }

        .nb-stat-icon-saffron {
          background: #fff4e8;
          color: #dd8129;
        }

        .nb-stat-icon-blue {
          background: #edf4ff;
          color: #3b6fa8;
        }

        .nb-stat-icon-red {
          background: #fff0ee;
          color: #d65b4f;
        }

        .nb-stat-icon-green {
          background: #eaf7ef;
          color: #23824d;
        }

        .nb-stat-copy {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 2px;
        }

        .nb-stat-label {
          overflow: hidden;
          color: #738194;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.045em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nb-stat-copy strong {
          overflow: hidden;
          color: #1b2f43;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.25;
          letter-spacing: -0.04em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nb-stat-copy small {
          overflow: hidden;
          color: #9aa5b0;
          font-size: 9px;
          font-weight: 550;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nb-stat-copy .nb-stat-date {
          font-size: 16px;
          letter-spacing: -0.025em;
        }

        /* BOARD HEADER */

        .nb-board-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin: 35px 1px 17px;
        }

        .nb-section-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #82909f;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .nb-section-kicker-mark {
          width: 18px;
          height: 3px;
          border-radius: 4px;
          background: linear-gradient(
            90deg,
            #f28c28 0 33%,
            #dce4e4 33% 66%,
            #16834a 66%
          );
        }

        .nb-board-heading h2 {
          margin: 0;
          color: #1b2e42;
          font-size: 24px;
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: -0.04em;
        }

        .nb-board-heading-copy > p {
          margin: 7px 0 0;
          color: #7b8998;
          font-size: 12px;
          line-height: 1.6;
        }

        .nb-board-heading-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .nb-feed-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #748394;
          font-size: 10px;
          font-weight: 750;
        }

        .nb-feed-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #27a05a;
          box-shadow: 0 0 0 4px rgba(39, 160, 90, 0.1);
        }

        .nb-refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 36px;
          padding: 0 13px;
          border: 1px solid #dfe7ed;
          border-radius: 10px;
          background: #fff;
          color: #3e566b;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition:
            background 160ms ease,
            border-color 160ms ease,
            transform 160ms ease;
        }

        .nb-refresh-button:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #c8d8df;
          background: #f9fbfc;
        }

        .nb-refresh-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .nb-spin {
          animation: nb-spin 0.85s linear infinite;
        }

        @keyframes nb-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* TOOLBAR */

        .nb-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border: 1px solid #e7edf2;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 5px 20px rgba(25, 47, 74, 0.025);
        }

        .nb-search-wrap {
          position: relative;
          display: flex;
          flex: 1;
          align-items: center;
          min-width: 170px;
        }

        .nb-search-icon {
          position: absolute;
          left: 13px;
          color: #92a0ae;
          pointer-events: none;
        }

        .nb-search-input {
          width: 100%;
          height: 40px;
          padding: 0 38px 0 41px;
          border: 1px solid #edf1f4;
          border-radius: 10px;
          outline: none;
          background: #f8fafc;
          color: #253b50;
          font: inherit;
          font-size: 11px;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .nb-search-input::placeholder {
          color: #a1acb7;
        }

        .nb-search-input:focus {
          border-color: #9abca9;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(22, 131, 74, 0.08);
        }

        .nb-search-clear {
          position: absolute;
          right: 9px;
          display: grid;
          width: 25px;
          height: 25px;
          place-items: center;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #8995a3;
          cursor: pointer;
        }

        .nb-search-clear:hover {
          background: #edf2f4;
          color: #40556a;
        }

        .nb-toolbar-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .nb-filter-button,
        .nb-sort-control {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 40px;
          padding: 0 11px;
          border: 1px solid #e8edf1;
          border-radius: 10px;
          background: #fff;
          color: #637487;
          font-size: 10px;
          font-weight: 800;
        }

        .nb-filter-button {
          cursor: pointer;
          transition: 160ms ease;
        }

        .nb-filter-button:hover {
          border-color: #f0cba4;
          background: #fffaf4;
          color: #b96e22;
        }

        .nb-filter-button-active {
          border-color: #f0c18b;
          background: #fff6eb;
          color: #b96e22;
        }

        .nb-filter-count {
          display: inline-grid;
          min-width: 19px;
          height: 19px;
          padding: 0 4px;
          place-items: center;
          border-radius: 6px;
          background: #fff0df;
          color: #b96e22;
          font-size: 9px;
          font-weight: 900;
        }

        .nb-sort-control {
          gap: 6px;
          padding-right: 8px;
          color: #8b99a7;
        }

        .nb-sort-control select {
          max-width: 112px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #4d6175;
          font: inherit;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        /* CATEGORY FILTERS */

        .nb-category-section {
          margin: 21px 0 17px;
        }

        .nb-category-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 11px;
        }

        .nb-category-heading-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #637487;
          font-size: 10px;
          font-weight: 850;
        }

        .nb-category-heading-label svg {
          color: #47745f;
        }

        .nb-result-count {
          color: #98a3ae;
          font-size: 10px;
          font-weight: 700;
        }

        .nb-category-list {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .nb-category-filter {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 32px;
          padding: 0 11px;
          border: 1px solid #e7edf1;
          border-radius: 9px;
          background: #fff;
          color: #738294;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
          transition: 150ms ease;
        }

        .nb-category-filter svg {
          color: #93a0ad;
        }

        .nb-category-filter:hover {
          border-color: #c7d8d0;
          background: #fbfdfc;
          color: #326b4c;
        }

        .nb-category-filter-active {
          border-color: #b9d6c4;
          background: #eef8f1;
          color: #207346;
          box-shadow: 0 2px 7px rgba(22, 131, 74, 0.055);
        }

        .nb-category-filter-active svg {
          color: #207346;
        }

        .nb-category-filter-count {
          display: inline-grid;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          place-items: center;
          border-radius: 5px;
          background: rgba(22, 131, 74, 0.09);
          font-size: 9px;
          font-weight: 900;
        }

        /* ERROR */

        .nb-error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0 16px;
          padding: 13px 15px;
          border: 1px solid #f1d3ad;
          border-radius: 12px;
          background: #fff9f1;
          color: #86521d;
        }

        .nb-error-icon {
          display: grid;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 10px;
          background: #ffefd9;
          color: #c37a26;
        }

        .nb-error-copy {
          min-width: 0;
          flex: 1;
        }

        .nb-error-copy strong {
          display: block;
          margin-bottom: 3px;
          color: #7e501f;
          font-size: 11px;
          font-weight: 850;
        }

        .nb-error-copy p {
          margin: 0;
          color: #997347;
          font-size: 10px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .nb-error-retry {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 32px;
          padding: 0 10px;
          border: 1px solid #ead0aa;
          border-radius: 8px;
          background: #fff;
          color: #97601f;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        .nb-error-retry:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* NOTICE GRID + CARDS */

        .nb-notice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .nb-notice-card {
          position: relative;
          display: flex;
          min-width: 0;
          overflow: hidden;
          flex-direction: column;
          border: 1px solid #e7edf2;
          border-radius: 15px;
          background: #fff;
          box-shadow: 0 6px 20px rgba(25, 47, 74, 0.035);
          animation: nb-card-in 300ms ease both;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        @keyframes nb-card-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .nb-notice-card:hover {
          transform: translateY(-2px);
          border-color: #d3e1db;
          box-shadow: 0 13px 27px rgba(25, 47, 74, 0.075);
        }

        .nb-notice-card-important {
          border-color: #f0e1d2;
        }

        .nb-card-accent {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 3px;
          background: linear-gradient(
            180deg,
            #f28c28 0%,
            #e9edea 45%,
            #16834a 100%
          );
          opacity: 0.72;
        }

        .nb-notice-card-important .nb-card-accent {
          background: linear-gradient(180deg, #e45d4f, #f3b65d);
          opacity: 0.95;
        }

        .nb-card-content {
          display: flex;
          min-height: 218px;
          height: 100%;
          flex-direction: column;
          padding: 17px 18px 15px 20px;
        }

        .nb-card-topline {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .nb-card-badges,
        .nb-modal-badges {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }

        .nb-category-badge,
        .nb-important-badge,
        .nb-pinned-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          max-width: 100%;
          min-height: 23px;
          padding: 0 8px;
          border: 1px solid transparent;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 850;
          line-height: 1;
          overflow-wrap: anywhere;
        }

        .nb-category-general {
          border-color: #e4ebf0;
          background: #f5f8fa;
          color: #667b8e;
        }

        .nb-category-academic {
          border-color: #d7e5fb;
          background: #eff5ff;
          color: #4771a7;
        }

        .nb-category-exam {
          border-color: #f3dfc7;
          background: #fff5e9;
          color: #b8782f;
        }

        .nb-category-event {
          border-color: #e4daf5;
          background: #f7f2ff;
          color: #8060a7;
        }

        .nb-category-important {
          border-color: #f4d7d4;
          background: #fff0ee;
          color: #b95048;
        }

        .nb-important-badge {
          border-color: #f4d7d4;
          background: #fff1ef;
          color: #bb5149;
        }

        .nb-pinned-badge {
          border-color: #f2e0c8;
          background: #fff8eb;
          color: #ad792e;
        }

        .nb-card-index {
          flex-shrink: 0;
          color: #bac3cc;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .nb-card-title {
          display: -webkit-box;
          overflow: hidden;
          margin: 14px 0 7px;
          color: #1e3347;
          font-size: 15px;
          font-weight: 850;
          line-height: 1.4;
          letter-spacing: -0.025em;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .nb-card-description {
          display: -webkit-box;
          overflow: hidden;
          margin: 0 0 17px;
          color: #778698;
          font-size: 11px;
          font-weight: 450;
          line-height: 1.7;
          overflow-wrap: anywhere;
          white-space: pre-line;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .nb-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f0f3f5;
        }

        .nb-card-date {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          color: #8b98a6;
          font-size: 9px;
          font-weight: 700;
        }

        .nb-card-date svg {
          flex-shrink: 0;
          color: #9ba8b3;
        }

        .nb-card-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          flex-shrink: 0;
        }

        .nb-attachment-button,
        .nb-read-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-height: 31px;
          padding: 0 9px;
          border: 1px solid #e4ebef;
          border-radius: 8px;
          background: #fff;
          color: #687b8c;
          font-size: 9px;
          font-weight: 850;
          text-decoration: none;
          white-space: nowrap;
          cursor: pointer;
          transition: 150ms ease;
        }

        .nb-attachment-button:hover {
          border-color: #c9d8e2;
          background: #f7fafc;
          color: #365d7a;
        }

        .nb-read-button {
          border-color: #d5e7db;
          background: #eff8f2;
          color: #28744a;
        }

        .nb-read-button:hover {
          border-color: #b4d4c0;
          background: #e4f3e9;
          color: #175d36;
        }

        /* SKELETON */

        .nb-skeleton-card {
          min-height: 218px;
          padding: 18px;
          border: 1px solid #e9eef2;
          border-radius: 15px;
          background: #fff;
        }

        .nb-skeleton-card span,
        .nb-skeleton-title,
        .nb-skeleton-line {
          display: block;
          border-radius: 7px;
          background: linear-gradient(
            90deg,
            #f0f3f5 20%,
            #f8fafb 45%,
            #f0f3f5 70%
          );
          background-size: 220% 100%;
          animation: nb-shimmer 1.3s ease infinite;
        }

        @keyframes nb-shimmer {
          to {
            background-position: -220% 0;
          }
        }

        .nb-skeleton-top {
          display: flex;
          gap: 7px;
        }

        .nb-skeleton-top span:first-child {
          width: 82px;
          height: 22px;
        }

        .nb-skeleton-top span:last-child {
          width: 62px;
          height: 22px;
        }

        .nb-skeleton-title {
          width: 72%;
          height: 17px;
          margin-top: 19px;
        }

        .nb-skeleton-line {
          width: 100%;
          height: 9px;
          margin-top: 13px;
        }

        .nb-skeleton-line-short {
          width: 61%;
          margin-top: 8px;
        }

        .nb-skeleton-bottom {
          display: flex;
          justify-content: space-between;
          margin-top: 28px;
          padding-top: 12px;
          border-top: 1px solid #f0f3f5;
        }

        .nb-skeleton-bottom span:first-child {
          width: 90px;
          height: 12px;
        }

        .nb-skeleton-bottom span:last-child {
          width: 82px;
          height: 28px;
        }

        /* EMPTY STATE */

        .nb-empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          min-height: 255px;
          padding: 30px;
          border: 1px dashed #dce5e9;
          border-radius: 17px;
          background:
            radial-gradient(
              circle at 25% 50%,
              rgba(242, 140, 40, 0.04),
              transparent 28%
            ),
            #fff;
          text-align: left;
        }

        .nb-empty-art {
          position: relative;
          display: grid;
          flex: 0 0 105px;
          width: 105px;
          height: 105px;
          place-items: center;
        }

        .nb-empty-art-ring {
          position: absolute;
          inset: 0;
          border: 1px solid #e5eee8;
          border-radius: 35px;
          background: linear-gradient(145deg, #f4faf6, #fff8f0);
          transform: rotate(-7deg);
        }

        .nb-empty-art-icon {
          position: relative;
          display: grid;
          width: 61px;
          height: 61px;
          place-items: center;
          border: 1px solid #e7eee9;
          border-radius: 21px;
          background: #fff;
          color: #5c9272;
          box-shadow: 0 9px 20px rgba(31, 79, 51, 0.08);
        }

        .nb-empty-art-spark {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 3px;
          background: #f2aa58;
          transform: rotate(45deg);
        }

        .nb-empty-art-spark-one {
          top: 9px;
          right: 5px;
        }

        .nb-empty-art-spark-two {
          bottom: 8px;
          left: 5px;
          width: 6px;
          height: 6px;
          background: #8cbf9c;
        }

        .nb-empty-copy {
          max-width: 390px;
        }

        .nb-empty-kicker {
          color: #a0aab5;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.17em;
        }

        .nb-empty-copy h3 {
          margin: 8px 0 6px;
          color: #273c50;
          font-size: 17px;
          font-weight: 850;
          letter-spacing: -0.03em;
        }

        .nb-empty-copy p {
          margin: 0;
          color: #82909e;
          font-size: 11px;
          line-height: 1.7;
        }

        .nb-empty-reset {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          margin-top: 15px;
          padding: 0 11px;
          border: 1px solid #d6e7dc;
          border-radius: 9px;
          background: #eff8f2;
          color: #2c774b;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .nb-empty-reset:hover {
          background: #e3f3e8;
        }

        /* FOOTER */

        .nb-page-footer {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 20px;
          padding: 14px 16px;
          border: 1px solid #e9eef1;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.75);
        }

        .nb-footer-mark {
          display: grid;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 10px;
          background: #edf7f0;
          color: #27814d;
        }

        .nb-footer-copy {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 3px;
        }

        .nb-footer-copy strong {
          color: #506477;
          font-size: 10px;
          font-weight: 850;
        }

        .nb-footer-copy span {
          color: #96a2ad;
          font-size: 9px;
          line-height: 1.5;
        }

        .nb-footer-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #607285;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.15em;
        }

        .nb-footer-tricolour {
          display: flex;
          gap: 2px;
        }

        .nb-footer-tricolour i {
          display: block;
          width: 3px;
          height: 15px;
          border-radius: 3px;
        }

        .nb-footer-tricolour i:nth-child(1) {
          background: #f28c28;
        }

        .nb-footer-tricolour i:nth-child(2) {
          background: #a1b1bd;
        }

        .nb-footer-tricolour i:nth-child(3) {
          background: #16834a;
        }

        /* MODAL */

        .nb-modal-backdrop {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 20px;
          background: rgba(14, 27, 40, 0.46);
          backdrop-filter: blur(5px);
          animation: nb-fade-in 150ms ease both;
        }

        @keyframes nb-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .nb-modal {
          position: relative;
          width: min(100%, 620px);
          max-height: min(88vh, 820px);
          overflow: auto;
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 28px 85px rgba(10, 28, 43, 0.25);
          animation: nb-modal-in 180ms ease both;
        }

        @keyframes nb-modal-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .nb-modal-top-accent {
          height: 5px;
          background: linear-gradient(
            90deg,
            #f28c28 0%,
            #f7c18c 33%,
            #dfe8e3 50%,
            #80b993 75%,
            #16834a 100%
          );
        }

        .nb-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 25px 0;
        }

        .nb-modal-icon {
          display: grid;
          width: 46px;
          height: 46px;
          place-items: center;
          border: 1px solid #f4e2cf;
          border-radius: 14px;
          background: #fff6eb;
          color: #d9842b;
        }

        .nb-modal-close {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 1px solid #e9eef2;
          border-radius: 10px;
          background: #fff;
          color: #778695;
          cursor: pointer;
          transition: 150ms ease;
        }

        .nb-modal-close:hover {
          border-color: #e4b9b5;
          background: #fff4f3;
          color: #b95048;
        }

        .nb-modal-body {
          padding: 20px 25px 25px;
        }

        .nb-modal-title {
          margin: 14px 0 10px;
          color: #1c3044;
          font-size: clamp(21px, 4vw, 28px);
          font-weight: 900;
          line-height: 1.25;
          letter-spacing: -0.04em;
          overflow-wrap: anywhere;
        }

        .nb-modal-date {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #8997a4;
          font-size: 11px;
          font-weight: 700;
        }

        .nb-modal-date svg {
          color: #9ba8b3;
        }

        .nb-modal-divider {
          height: 1px;
          margin: 20px 0;
          background: #edf1f3;
        }

        .nb-modal-description {
          color: #56697c;
          font-size: 13px;
          font-weight: 450;
          line-height: 1.9;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .nb-modal-attachment {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 23px;
          padding: 12px;
          border: 1px solid #e4ece8;
          border-radius: 12px;
          background: #f9fcfa;
          color: inherit;
          text-decoration: none;
          transition: 150ms ease;
        }

        .nb-modal-attachment:hover {
          border-color: #bcd7c7;
          background: #f2faf5;
        }

        .nb-modal-attachment-icon {
          display: grid;
          flex: 0 0 39px;
          width: 39px;
          height: 39px;
          place-items: center;
          border-radius: 10px;
          background: #eaf5ee;
          color: #2a8050;
        }

        .nb-modal-attachment-copy {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 4px;
        }

        .nb-modal-attachment-copy strong {
          overflow: hidden;
          color: #3b5c4a;
          font-size: 11px;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .nb-modal-attachment-copy small {
          color: #8c9b91;
          font-size: 9px;
          font-weight: 600;
        }

        .nb-modal-attachment-action {
          display: grid;
          flex: 0 0 32px;
          width: 32px;
          height: 32px;
          place-items: center;
          border: 1px solid #e1ede5;
          border-radius: 9px;
          background: #fff;
          color: #47805e;
        }

        .nb-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 25px;
          border-top: 1px solid #edf1f3;
          background: #fbfcfd;
        }

        .nb-modal-security {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #91a097;
          font-size: 9px;
          font-weight: 750;
        }

        .nb-modal-security svg {
          color: #4b9666;
        }

        .nb-modal-done {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 36px;
          padding: 0 13px;
          border: 1px solid #cfe3d5;
          border-radius: 9px;
          background: #edf8f1;
          color: #267448;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .nb-modal-done:hover {
          background: #e0f2e6;
        }

        /* FOCUS */

        .nb-page button:focus-visible,
        .nb-page a:focus-visible,
        .nb-page input:focus-visible,
        .nb-page select:focus-visible,
        .nb-modal button:focus-visible,
        .nb-modal a:focus-visible {
          outline: 3px solid rgba(49, 133, 82, 0.27);
          outline-offset: 2px;
        }

        /* RESPONSIVE */

        @media (max-width: 1120px) {
          .nb-hero {
            padding-right: 25px;
            padding-left: 32px;
          }

          .nb-hero-art {
            flex-basis: 245px;
            margin-right: 0;
          }

          .nb-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .nb-page {
            padding: 16px 14px 28px;
          }

          .nb-hero {
            min-height: 0;
            padding: 26px 22px 48px;
            border-radius: 19px;
          }

          .nb-hero-copy {
            width: 100%;
          }

          .nb-hero h1 {
            max-width: 460px;
            font-size: clamp(29px, 7vw, 39px);
          }

          .nb-hero-copy > p {
            max-width: 540px;
            font-size: 12px;
          }

          .nb-hero-art {
            display: none;
          }

          .nb-hero-bottom {
            right: 15px;
            bottom: 15px;
            left: 22px;
            font-size: 7px;
          }

          .nb-stats-grid {
            gap: 10px;
            margin-top: 13px;
          }

          .nb-stat-card {
            gap: 10px;
            padding: 13px;
            border-radius: 13px;
          }

          .nb-stat-icon {
            flex-basis: 36px;
            width: 36px;
            height: 36px;
            border-radius: 11px;
          }

          .nb-stat-icon svg {
            width: 16px;
            height: 16px;
          }

          .nb-stat-copy strong {
            font-size: 21px;
          }

          .nb-stat-copy .nb-stat-date {
            font-size: 13px;
          }

          .nb-board-heading {
            align-items: flex-start;
            margin-top: 28px;
          }

          .nb-board-heading h2 {
            font-size: 21px;
          }

          .nb-board-heading-copy > p {
            max-width: 410px;
            font-size: 11px;
          }

          .nb-feed-status {
            display: none;
          }

          .nb-notice-grid {
            grid-template-columns: 1fr;
            gap: 11px;
          }

          .nb-card-content {
            min-height: 0;
          }

          .nb-card-title {
            font-size: 14px;
          }

          .nb-card-description {
            -webkit-line-clamp: 4;
          }

          .nb-empty-state {
            min-height: 220px;
            gap: 17px;
            padding: 22px;
          }

          .nb-empty-art {
            flex-basis: 78px;
            width: 78px;
            height: 78px;
          }

          .nb-empty-art-ring {
            border-radius: 26px;
          }

          .nb-empty-art-icon {
            width: 49px;
            height: 49px;
            border-radius: 16px;
          }

          .nb-empty-art-icon svg {
            width: 23px;
            height: 23px;
          }
        }

        @media (max-width: 520px) {
          .nb-page {
            padding: 12px 10px 24px;
          }

          .nb-hero {
            padding: 23px 17px 47px;
            border-radius: 16px;
          }

          .nb-eyebrow {
            margin-bottom: 13px;
            font-size: 8px;
          }

          .nb-hero h1 {
            font-size: 29px;
          }

          .nb-hero-copy > p {
            margin: 11px 0 15px;
            font-size: 11px;
            line-height: 1.65;
          }

          .nb-hero-pills {
            gap: 6px;
          }

          .nb-hero-pills span {
            padding: 7px 9px;
            font-size: 9px;
          }

          .nb-hero-bottom {
            left: 17px;
            font-size: 6px;
          }

          .nb-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }

          .nb-stat-card {
            gap: 8px;
            padding: 11px 9px;
          }

          .nb-stat-icon {
            flex-basis: 31px;
            width: 31px;
            height: 31px;
            border-radius: 9px;
          }

          .nb-stat-copy {
            gap: 1px;
          }

          .nb-stat-label {
            font-size: 8px;
          }

          .nb-stat-copy strong {
            font-size: 19px;
          }

          .nb-stat-copy .nb-stat-date {
            font-size: 11px;
          }

          .nb-stat-copy small {
            font-size: 8px;
          }

          .nb-board-heading {
            gap: 8px;
            margin: 24px 1px 13px;
          }

          .nb-board-heading h2 {
            font-size: 19px;
          }

          .nb-board-heading-copy > p {
            max-width: 290px;
            font-size: 10px;
          }

          .nb-refresh-button {
            min-height: 33px;
            gap: 5px;
            padding: 0 9px;
            font-size: 9px;
          }

          .nb-toolbar {
            align-items: stretch;
            flex-direction: column;
            gap: 9px;
            padding: 9px;
            border-radius: 12px;
          }

          .nb-search-wrap {
            width: 100%;
          }

          .nb-search-input {
            height: 38px;
            font-size: 10px;
          }

          .nb-toolbar-controls {
            justify-content: space-between;
          }

          .nb-filter-button,
          .nb-sort-control {
            flex: 1;
            min-height: 35px;
            font-size: 9px;
          }

          .nb-sort-control {
            justify-content: flex-start;
            padding-left: 10px;
          }

          .nb-sort-control select {
            max-width: none;
            flex: 1;
            font-size: 9px;
          }

          .nb-category-section {
            margin: 16px 0 13px;
          }

          .nb-category-heading-label,
          .nb-result-count {
            font-size: 9px;
          }

          .nb-category-list {
            gap: 6px;
          }

          .nb-category-filter {
            min-height: 30px;
            gap: 5px;
            padding: 0 8px;
            font-size: 9px;
          }

          .nb-category-filter svg {
            width: 12px;
            height: 12px;
          }

          .nb-card-content {
            padding: 14px 13px 13px 16px;
          }

          .nb-card-title {
            margin-top: 12px;
            font-size: 13px;
          }

          .nb-card-description {
            margin-bottom: 13px;
            font-size: 10px;
          }

          .nb-card-footer {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .nb-card-actions {
            width: 100%;
            justify-content: flex-end;
          }

          .nb-attachment-button,
          .nb-read-button {
            min-height: 30px;
            font-size: 9px;
          }

          .nb-page-footer {
            gap: 8px;
            padding: 11px;
          }

          .nb-footer-copy strong {
            font-size: 9px;
          }

          .nb-footer-copy span {
            font-size: 8px;
          }

          .nb-footer-brand {
            gap: 5px;
            font-size: 7px;
          }

          .nb-modal-backdrop {
            align-items: flex-end;
            padding: 9px;
          }

          .nb-modal {
            max-height: 91vh;
            border-radius: 18px;
          }

          .nb-modal-header {
            padding: 17px 17px 0;
          }

          .nb-modal-body {
            padding: 16px 17px 19px;
          }

          .nb-modal-title {
            font-size: 21px;
          }

          .nb-modal-description {
            font-size: 12px;
            line-height: 1.8;
          }

          .nb-modal-footer {
            padding: 12px 17px;
          }

          .nb-modal-security {
            font-size: 8px;
          }
        }

        @media (max-width: 370px) {
          .nb-stat-card {
            gap: 6px;
            padding: 9px 7px;
          }

          .nb-stat-icon {
            flex-basis: 28px;
            width: 28px;
            height: 28px;
          }

          .nb-stat-copy strong {
            font-size: 17px;
          }

          .nb-stat-copy .nb-stat-date {
            font-size: 10px;
          }

          .nb-board-heading-actions {
            gap: 5px;
          }

          .nb-refresh-button {
            padding: 0 7px;
          }

          .nb-empty-state {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nb-page *,
          .nb-page *::before,
          .nb-page *::after,
          .nb-modal *,
          .nb-modal *::before,
          .nb-modal *::after {
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