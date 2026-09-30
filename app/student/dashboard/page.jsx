"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Bell,
  MessageCircle,
  ArrowUpRight,
  Clock3,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { StatCard, Status } from "@/components/ui";

export default function StudentDashboard() {
  const [student, setStudent] = useState({
    name: "Student",
    rollNo: "—",
    section: "IT-C",
    semester: "",
  });

  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [routine, setRoutine] = useState([]);
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("utkarsh_student") || "null"
      );

      if (saved) {
        setStudent((prev) => ({
          ...prev,
          ...saved,
        }));
      }
    } catch {
      // Keep default student state
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const resources = ["notes", "assignments", "routine", "notices"];

        const results = await Promise.all(
          resources.map(async (resource) => {
            const response = await fetch(
              `/api/data?resource=${encodeURIComponent(resource)}`,
              {
                method: "GET",
                credentials: "include",
                cache: "no-store",
              }
            );

            const json = await response.json();

            if (!response.ok || !json?.success) {
              throw new Error(
                json?.error || `Failed to load ${resource}`
              );
            }

            return {
              resource,
              data: Array.isArray(json.data) ? json.data : [],
            };
          })
        );

        if (cancelled) return;

        const mapped = Object.fromEntries(
          results.map(({ resource, data }) => [resource, data])
        );

        setNotes(mapped.notes || []);
        setAssignments(mapped.assignments || []);
        setRoutine(mapped.routine || []);
        setNotices(mapped.notices || []);
      } catch (error) {
        console.error("Student dashboard load error:", error);

        if (!cancelled) {
          setNotes([]);
          setAssignments([]);
          setRoutine([]);
          setNotices([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayName = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    }).format(new Date());
  }, []);

  const todayClasses = useMemo(() => {
    const today = todayName.toLowerCase();

    return routine
      .filter((item) => {
        const day = String(item.day || "").trim().toLowerCase();

        return (
          day === today ||
          day === today.slice(0, 3) ||
          day.includes(today)
        );
      })
      .sort((a, b) => {
        const timeA = String(
          a.time || a.start_time || a.class_time || ""
        );

        const timeB = String(
          b.time || b.start_time || b.class_time || ""
        );

        return timeA.localeCompare(timeB);
      });
  }, [routine, todayName]);

  const pendingAssignments = useMemo(() => {
    const now = new Date();

    return assignments.filter((item) => {
      const status = String(item.status || "").toLowerCase();

      if (
        ["completed", "submitted", "done"].includes(status)
      ) {
        return false;
      }

      const dueDate =
        item.due_date ||
        item.dueDate ||
        item.deadline;

      if (!dueDate) return true;

      const date = new Date(dueDate);

      return Number.isNaN(date.getTime()) || date >= now;
    });
  }, [assignments]);

  const latestNotices = useMemo(() => {
    return [...notices]
      .sort((a, b) => {
        const dateA = new Date(
          a.created_at ||
            a.createdAt ||
            a.date ||
            0
        ).getTime();

        const dateB = new Date(
          b.created_at ||
            b.createdAt ||
            b.date ||
            0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 3);
  }, [notices]);

  const formatTime = (value) => {
    if (!value) return "Time not set";

    const text = String(value).trim();

    if (/^\d{1,2}:\d{2}$/.test(text)) {
      const [hour, minute] = text.split(":").map(Number);

      const date = new Date();
      date.setHours(hour, minute, 0, 0);

      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return text;
  };

  const formatNoticeDate = (notice) => {
    const raw =
      notice.created_at ||
      notice.createdAt ||
      notice.date;

    if (!raw) return "New";

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return String(raw);
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AppShell
      role="student"
      title="Dashboard"
      subtitle="Your academic command center"
    >
      <div className="dashboard-page">

        {/* HERO */}
        <section className="student-hero">
          <div>
            <span>STUDENT SPACE • {student.section || "IT-C"}</span>

            <h2>
              {greeting}, {student.name} 👋
            </h2>

            <p>
              Ready for your next class? Everything important is
              waiting in one place.
            </p>
          </div>

          <div className="student-id">
            <b>{student.name}</b>

            <small>
              Roll {student.rollNo || "—"} • Section{" "}
              {student.section || "IT-C"}
            </small>

            <Status tone="green">
              Approved Student
            </Status>
          </div>
        </section>

        {/* LIVE STATS */}
        <div className="stats-grid">
          <StatCard
            icon={BookOpen}
            title="Notes Available"
            value={loading ? "…" : notes.length}
            caption="Study materials"
            tone="blue"
          />

          <StatCard
            icon={ClipboardCheck}
            title="Pending Assignments"
            value={loading ? "…" : pendingAssignments.length}
            caption="Need attention"
            tone="violet"
          />

          <StatCard
            icon={CalendarDays}
            title="Today's Classes"
            value={loading ? "…" : todayClasses.length}
            caption="Scheduled today"
            tone="cyan"
          />

          <StatCard
            icon={Bell}
            title="Unread Notices"
            value={loading ? "…" : latestNotices.length}
            caption="New updates"
            tone="pink"
          />
        </div>

        {/* QUICK ACCESS */}
        <section className="dashboard-section">
          <div className="section-title">
            <div>
              <span>QUICK ACCESS</span>
              <h3>Everything at a glance</h3>
            </div>
          </div>

          <div className="quick-grid">
            {[
              [BookOpen, "Notes", "/notes"],
              [ClipboardCheck, "Assignments", "/assignments"],
              [CalendarDays, "Routine", "/routine"],
              [Sparkles, "Syllabus", "/syllabus"],
              [Bell, "Notices", "/notices"],
              [MessageCircle, "Ask Admin", "/query"],
            ].map(([Icon, title, href]) => (
              <Link
                href={href}
                key={title}
                className="quick-card"
              >
                <span>
                  <Icon size={20} />
                </span>

                <div>
                  <b>{title}</b>
                  <small>Open workspace</small>
                </div>

                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>

        {/* TODAY + NOTICES */}
        <div className="two-col">

          {/* TODAY'S SCHEDULE */}
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>TODAY'S SCHEDULE</span>
                <h3>Next classes</h3>
              </div>

              <Link href="/routine">
                View all <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="timeline">
              {loading ? (
                <div className="empty-state">
                  Loading today's schedule...
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="empty-state">
                  No classes scheduled for today.
                </div>
              ) : (
                todayClasses.slice(0, 5).map((item, index) => {
                  const time =
                    item.time ||
                    item.start_time ||
                    item.class_time;

                  const subject =
                    item.subject ||
                    item.title ||
                    "Class";

                  const room =
                    item.room ||
                    item.location ||
                    "Room not set";

                  const code =
                    item.subject_code ||
                    item.code ||
                    "";

                  return (
                    <div key={item.id || index}>
                      <span className="time">
                        {formatTime(time)}
                      </span>

                      <i />

                      <article>
                        <b>{subject}</b>

                        <small>
                          {room}
                          {code ? ` • ${code}` : ""}
                        </small>
                      </article>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* LATEST NOTICES */}
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>LATEST NOTICES</span>
                <h3>Stay informed</h3>
              </div>

              <Link href="/notices">
                View all <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="notice-list">
              {loading ? (
                <div className="empty-state">
                  Loading notices...
                </div>
              ) : latestNotices.length === 0 ? (
                <div className="empty-state">
                  No notices published yet.
                </div>
              ) : (
                latestNotices.map((notice, index) => (
                  <article key={notice.id || index}>
                    <span>
                      <Bell size={16} />
                    </span>

                    <div>
                      <b>
                        {notice.title ||
                          notice.subject ||
                          "Untitled Notice"}
                      </b>

                      <small>
                        {notice.category ||
                          notice.type ||
                          "Academic"}{" "}
                        • {formatNoticeDate(notice)}
                      </small>
                    </div>

                    <ArrowUpRight size={15} />
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ACTIVITY */}
        <section className="activity-strip">
          <div className="activity-icon">
            <Clock3 size={18} />
          </div>

          <div>
            <span>RECENT ACADEMIC ACTIVITY</span>

            <b>
              {loading
                ? "Syncing your academic space..."
                : "Your academic data is synced with the latest information published by admin."}
            </b>
          </div>

          <MessageCircle size={20} />
        </section>
      </div>
    </AppShell>
  );
}