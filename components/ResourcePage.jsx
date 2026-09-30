"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  ClipboardCheck,
  CalendarDays,
  Layers3,
  Bell,
  MessageCircle,
  RefreshCw,
  Search,
  X,
  ExternalLink,
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
    return [item?.day, item?.time || item?.start_time || item?.class_time]
      .filter(Boolean)
      .join(" • ") || "Schedule";
  }

  if (resource === "assignments") {
    return item?.due_date ? `Due ${formatDate(item.due_date)}` : "Deadline not set";
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

export default function ResourcePage({ resource }) {
  const config = configs[resource];

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const Icon = config?.icon || FileText;

  const loadItems = useCallback(async () => {
    if (!config) return;

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

  useEffect(() => {
    setLoading(true);
    setItems([]);
    loadItems();
  }, [loadItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return items;

    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(term)
    );
  }, [items, search]);

  if (!config) {
    return null;
  }

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
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${resource}...`}
              type="search"
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
          <div className="resource-error">
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
            {[1, 2, 3, 4].map((i) => (
              <div className="skeleton-card" key={i} />
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

              const tone =
                item?.status?.toLowerCase() === "verified"
                  ? "green"
                  : item?.priority?.toLowerCase() === "important"
                    ? "pink"
                    : "blue";

              return (
                <article
                  className="resource-card"
                  key={item?.id || `${title}-${index}`}
                >
                  <div className="resource-card-top">
                    <span className="resource-icon">
                      <Icon size={19} />
                    </span>

                    <Status tone={tone}>{status}</Status>
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
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-head">
                <div>
                  <span>ACADEMIC ITEM</span>

                  <h3>{getTitle(selected)}</h3>
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

              {(selected.pdf_url || selected.pdf_path) && (
                <a
                  className="primary-button full"
                  href={selected.pdf_url || "#"}
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