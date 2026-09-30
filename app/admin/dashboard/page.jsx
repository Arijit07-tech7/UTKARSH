
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Users,
  BookOpen,
  ClipboardCheck,
  MessageCircle,
  ArrowUpRight,
  UserPlus,
  FileText,
  Megaphone,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { StatCard, Status } from "@/components/ui";

const QUICK_ACTIONS = [
  [UserPlus, "Add Student", "/admin/students", "blue"],
  [FileText, "Upload Note", "/admin/notes", "violet"],
  [ClipboardCheck, "Add Assignment", "/admin/assignments", "green"],
  [Megaphone, "Post Notice", "/admin/notices", "pink"],
  [CalendarDays, "Edit Routine", "/admin/routine", "cyan"],
  [MessageCircle, "Open Queries", "/admin/queries", "orange"],
];

const RESOURCE_CONFIG = [
  {
    key: "students",
    resource: "students",
    label: "Student",
    icon: UserPlus,
    tone: "blue",
    description: "Approved student records",
  },
  {
    key: "notes",
    resource: "notes",
    label: "Note",
    icon: FileText,
    tone: "violet",
    description: "Study materials",
  },
  {
    key: "assignments",
    resource: "assignments",
    label: "Assignment",
    icon: ClipboardCheck,
    tone: "green",
    description: "Academic tasks",
  },
  {
    key: "queries",
    resource: "queries",
    label: "Query",
    icon: MessageCircle,
    tone: "pink",
    description: "Student queries",
  },
];

async function fetchResource(resource) {
  const response = await fetch(
    `/api/data?resource=${encodeURIComponent(resource)}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    }
  );

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(`Invalid response while loading ${resource}.`);
  }

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.message || `Could not load ${resource}.`
    );
  }

  return {
    data: Array.isArray(result.data) ? result.data : [],
    unavailable: Boolean(result.unavailable),
  };
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRelativeTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatDate(date);
}

function getActivityItems(resources) {
  const items = [];

  const definitions = [
    {
      key: "students",
      title: "Student record available",
      detail: (record) =>
        record.name
          ? `${record.name} is listed in approved students`
          : "An approved student record is available",
      icon: UserPlus,
      tone: "blue",
    },
    {
      key: "notes",
      title: "Study note available",
      detail: (record) =>
        record.title || record.subject || "A study note is available",
      icon: FileText,
      tone: "violet",
    },
    {
      key: "assignments",
      title: "Assignment available",
      detail: (record) =>
        record.title || record.subject || "An assignment is available",
      icon: ClipboardCheck,
      tone: "green",
    },
    {
      key: "queries",
      title: "Student query available",
      detail: (record) =>
        record.title || record.subject || "A student query is available",
      icon: MessageCircle,
      tone: "pink",
    },
  ];

  for (const definition of definitions) {
    const records = resources[definition.key]?.data || [];

    for (const record of records) {
      const timestamp =
        record.created_at ||
        record.updated_at ||
        record.createdAt ||
        record.updatedAt;

      if (!timestamp) continue;

      items.push({
        id: `${definition.key}-${record.id || timestamp}`,
        title: definition.title,
        detail: definition.detail(record),
        timestamp,
        icon: definition.icon,
        tone: definition.tone,
      });
    }
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
    )
    .slice(0, 5);
}

export default function AdminDashboard() {
  const [name, setName] = useState("Administrator");
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    try {
      const session = JSON.parse(
        sessionStorage.getItem("utkarsh_admin") || "null"
      );

      if (session?.name) {
        setName(session.name);
      }
    } catch {
      // Keep the default administrator name.
    }

    setToday(formatDate(new Date()));
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.all(
        RESOURCE_CONFIG.map(async ({ key, resource }) => {
          try {
            const result = await fetchResource(resource);
            return [key, result];
          } catch (err) {
            return [
              key,
              {
                data: [],
                unavailable: true,
                error: err?.message || `Could not load ${resource}.`,
              },
            ];
          }
        })
      );

      const nextResources = Object.fromEntries(results);
      setResources(nextResources);
      setLastUpdated(new Date());

      const failed = results.filter(
        ([, result]) => result.error
      );

      if (failed.length === results.length) {
        setError(
          "Dashboard data could not be loaded. Check your session and API connection."
        );
      }
    } catch {
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const getCount = (key) => {
    const item = resources[key];

    if (!item || item.unavailable) return "—";

    return item.data.length;
  };

  const isAvailable = (key) =>
    Boolean(resources[key] && !resources[key].unavailable);

  const activity = useMemo(
    () => getActivityItems(resources),
    [resources]
  );

  const stats = [
    {
      icon: Users,
      title: "Total Students",
      value: getCount("students"),
      caption: isAvailable("students")
        ? "Approved student records"
        : "Student data unavailable",
      tone: "blue",
    },
    {
      icon: Users,
      title: "Active Students",
      value: "—",
      caption: "Active status field not configured",
      tone: "cyan",
    },
    {
      icon: BookOpen,
      title: "Notes",
      value: getCount("notes"),
      caption: isAvailable("notes")
        ? "Study materials"
        : "Notes data unavailable",
      tone: "violet",
    },
    {
      icon: ClipboardCheck,
      title: "Assignments",
      value: getCount("assignments"),
      caption: isAvailable("assignments")
        ? "Academic tasks"
        : "Table unavailable or not configured",
      tone: "green",
    },
    {
      icon: MessageCircle,
      title: "Pending Queries",
      value: isAvailable("queries") ? "—" : "—",
      caption: isAvailable("queries")
        ? "Query status field needs verification"
        : "Queries table unavailable",
      tone: "pink",
    },
  ];

  const overview = [
    {
      icon: Users,
      label: "Students",
      value: getCount("students"),
      available: isAvailable("students"),
    },
    {
      icon: BookOpen,
      label: "Learning Content",
      value: getCount("notes"),
      available: isAvailable("notes"),
    },
    {
      icon: ClipboardCheck,
      label: "Assignments",
      value: getCount("assignments"),
      available: isAvailable("assignments"),
    },
    {
      icon: MessageCircle,
      label: "Queries",
      value: getCount("queries"),
      available: isAvailable("queries"),
    },
  ];

  return (
    <AppShell
      role="admin"
      title="Dashboard"
      subtitle="Administration"
    >
      <div className="dashboard-page admin-dashboard-page">
        <section className="admin-welcome">
          <div>
            <span>ADMINISTRATION • COMMAND CENTER</span>
            <h2>Welcome, {name}</h2>
            <p>
              Manage the UTKARSH academic workspace from one
              secure control center.
            </p>
          </div>

          <div className="admin-date">
            {today || "—"}
          </div>
        </section>

        {error && (
          <div
            className="status-banner"
            role="alert"
            style={{ marginBottom: 16 }}
          >
            <span>
              <AlertCircle size={21} />
            </span>
            <div>
              <small>DATA CONNECTION</small>
              <b>{error}</b>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              aria-label="Retry loading dashboard"
              className="dashboard-retry-button"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        <div className="stats-grid">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              icon={stat.icon}
              title={stat.title}
              value={loading ? "…" : stat.value}
              caption={stat.caption}
              tone={stat.tone}
            />
          ))}
        </div>

        <div className="admin-grid">
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>MANAGEMENT</span>
                <h3>Quick actions</h3>
              </div>
            </div>

            <div className="admin-actions">
              {QUICK_ACTIONS.map(([Icon, title, href, tone]) => (
                <Link
                  href={href}
                  key={title}
                  className={`admin-action ${tone}`}
                >
                  <span>
                    <Icon size={19} />
                  </span>
                  <div>
                    <b>{title}</b>
                    <small>Open management</small>
                  </div>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <span>OVERVIEW</span>
                <h3>Workspace status</h3>
              </div>
              <TrendingUp size={18} />
            </div>

            <div className="admin-overview">
              {overview.map(({ icon: Icon, label, value, available }) => (
                <div key={label}>
                  <span>
                    <Icon />
                  </span>
                  <b>{label}</b>
                  <strong>
                    {loading ? "…" : value}
                  </strong>
                  {!loading && !available && (
                    <small>Unavailable</small>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="panel-title">
            <div>
              <span>RECENT ACTIVITY</span>
              <h3>Latest updates</h3>
            </div>

            <Link href="/notifications">
              View all <ArrowUpRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="dashboard-empty-state">
              <RefreshCw size={18} className="dashboard-spin" />
              <span>Loading workspace activity…</span>
            </div>
          ) : activity.length > 0 ? (
            <div className="activity-table">
              {activity.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.id}>
                    <span className={`activity-dot ${item.tone}`}>
                      <Icon size={15} />
                    </span>
                    <b>{item.title}</b>
                    <small>{item.detail}</small>
                    <em>{formatRelativeTime(item.timestamp)}</em>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <MessageCircle size={20} />
              <span>
                No timestamped activity is available yet.
              </span>
              <small>
                Activity will appear here when records include
                created_at or updated_at timestamps.
              </small>
            </div>
          )}
        </section>

        <div className="status-banner">
          <span>
            <CheckCircle2 size={21} />
          </span>
          <div>
            <small>SYSTEM STATUS</small>
            <b>
              {loading
                ? "Checking workspace data…"
                : error
                  ? "Some dashboard data could not be loaded."
                  : "Dashboard connection check completed."}
            </b>
            {lastUpdated && (
              <small>
                Last checked: {lastUpdated.toLocaleTimeString("en-IN")}
              </small>
            )}
          </div>
          <Status tone={error ? "orange" : "green"}>
            {loading ? "Checking" : error ? "Check" : "Connected"}
          </Status>
        </div>
      </div>
    </AppShell>
  );
}