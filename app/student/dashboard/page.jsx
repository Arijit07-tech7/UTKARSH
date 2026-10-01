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
  GraduationCap,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import AppShell from "@/components/AppShell";

/* =========================================================
   ASHOKA CHAKRA — 24 RADIAL SPOKES
========================================================= */

function AshokaChakra({ size = 30, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Ashoka Chakra"
    >
      <circle
        cx="50"
        cy="50"
        r="43"
        stroke="currentColor"
        strokeWidth="4.5"
      />

      {Array.from({ length: 24 }, (_, index) => (
        <line
          key={index}
          x1="50"
          y1="50"
          x2="50"
          y2="10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          transform={`rotate(${index * 15} 50 50)`}
        />
      ))}

      <circle
        cx="50"
        cy="50"
        r="8.5"
        fill="currentColor"
      />

      <circle
        cx="50"
        cy="50"
        r="3"
        fill="#ffffff"
      />
    </svg>
  );
}

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

export default function StudentDashboard() {
  const [student, setStudent] = useState({
    name: "Student",
    rollNo: "—",
    section: "IT-C",
    semester: "3rd Semester",
  });

  const [notes, setNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [routine, setRoutine] = useState([]);
  const [notices, setNotices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [smileCount, setSmileCount] = useState(0);

  /* ---------------------------------------------------------
     STUDENT SESSION
  --------------------------------------------------------- */

  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("utkarsh_student") || "null"
      );

      if (saved) {
        setStudent((previous) => ({
          ...previous,
          ...saved,
          name: saved.name || previous.name,
          rollNo:
            saved.rollNo ||
            saved.roll_no ||
            previous.rollNo,
          section:
            saved.section ||
            previous.section,
          semester:
            saved.semester ||
            previous.semester,
        }));
      }
    } catch (error) {
      console.error(
        "Student session read error:",
        error
      );
    }
  }, []);

  /* ---------------------------------------------------------
     LOAD DASHBOARD DATA
  --------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const resources = [
          "notes",
          "assignments",
          "routine",
          "notices",
        ];

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
                json?.error ||
                  `Failed to load ${resource}`
              );
            }

            return {
              resource,
              data: Array.isArray(json.data)
                ? json.data
                : [],
            };
          })
        );

        if (cancelled) return;

        const mapped = Object.fromEntries(
          results.map(({ resource, data }) => [
            resource,
            data,
          ])
        );

        setNotes(mapped.notes || []);
        setAssignments(mapped.assignments || []);
        setRoutine(mapped.routine || []);
        setNotices(mapped.notices || []);
      } catch (error) {
        console.error(
          "Student dashboard load error:",
          error
        );

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

  /* ---------------------------------------------------------
     GREETING AND DATE
  --------------------------------------------------------- */

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const todayName = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    }).format(new Date());
  }, []);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date());
  }, []);

  /* ---------------------------------------------------------
     STUDENT INITIALS
  --------------------------------------------------------- */

  const initials = useMemo(() => {
    const parts = String(student.name || "Student")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!parts.length) return "S";

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${
      parts[parts.length - 1][0]
    }`.toUpperCase();
  }, [student.name]);

  /* ---------------------------------------------------------
     TODAY'S CLASSES
  --------------------------------------------------------- */

  const todayClasses = useMemo(() => {
    const today = todayName.toLowerCase();

    return routine
      .filter((item) => {
        const day = String(item.day || "")
          .trim()
          .toLowerCase();

        return (
          day === today ||
          day === today.slice(0, 3) ||
          day.includes(today)
        );
      })
      .sort((a, b) => {
        const timeA = String(
          a.time ||
            a.start_time ||
            a.class_time ||
            ""
        );

        const timeB = String(
          b.time ||
            b.start_time ||
            b.class_time ||
            ""
        );

        return timeA.localeCompare(timeB);
      });
  }, [routine, todayName]);

  /* ---------------------------------------------------------
     PENDING ASSIGNMENTS
  --------------------------------------------------------- */

  const pendingAssignments = useMemo(() => {
    const now = new Date();

    return assignments.filter((item) => {
      const status = String(item.status || "")
        .toLowerCase()
        .trim();

      if (
        ["completed", "submitted", "done"].includes(
          status
        )
      ) {
        return false;
      }

      const dueDate =
        item.due_date ||
        item.dueDate ||
        item.deadline;

      if (!dueDate) return true;

      const date = new Date(dueDate);

      return (
        Number.isNaN(date.getTime()) ||
        date >= now
      );
    });
  }, [assignments]);

  const upcomingAssignments = useMemo(() => {
    return [...pendingAssignments]
      .sort((a, b) => {
        const dateA = new Date(
          a.due_date ||
            a.dueDate ||
            a.deadline ||
            "9999-12-31"
        ).getTime();

        const dateB = new Date(
          b.due_date ||
            b.dueDate ||
            b.deadline ||
            "9999-12-31"
        ).getTime();

        return dateA - dateB;
      })
      .slice(0, 3);
  }, [pendingAssignments]);

  /* ---------------------------------------------------------
     LATEST NOTICES
  --------------------------------------------------------- */

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

  /* ---------------------------------------------------------
     FORMATTERS
  --------------------------------------------------------- */

  const formatTime = (value) => {
    if (!value) return "Time not set";

    const text = String(value).trim();

    if (/^\d{1,2}:\d{2}$/.test(text)) {
      const [hour, minute] = text
        .split(":")
        .map(Number);

      const date = new Date();
      date.setHours(hour, minute, 0, 0);

      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return text;
  };

  const formatDueDate = (item) => {
    const raw =
      item.due_date ||
      item.dueDate ||
      item.deadline;

    if (!raw) return "No deadline";

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return String(raw);
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
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

  const getAssignmentState = (item) => {
    const status = String(
      item.status || ""
    ).toLowerCase();

    if (
      status.includes("urgent") ||
      status.includes("overdue")
    ) {
      return {
        label: item.status || "Urgent",
        tone: "urgent",
      };
    }

    if (
      status.includes("progress") ||
      status.includes("pending")
    ) {
      return {
        label: item.status || "In Progress",
        tone: "progress",
      };
    }

    return {
      label: item.status || "Pending",
      tone: "normal",
    };
  };

  /* ---------------------------------------------------------
     QUICK LINKS
  --------------------------------------------------------- */

  const quickLinks = [
    {
      icon: BookOpen,
      title: "Notes",
      subtitle: "Study material",
      href: "/notes",
      tone: "saffron",
    },
    {
      icon: ClipboardCheck,
      title: "Assignments",
      subtitle: "Track your tasks",
      href: "/assignments",
      tone: "green",
    },
    {
      icon: CalendarDays,
      title: "Routine",
      subtitle: "Class schedule",
      href: "/routine",
      tone: "blue",
    },
    {
      icon: Sparkles,
      title: "Syllabus",
      subtitle: "Semester subjects",
      href: "/syllabus",
      tone: "violet",
    },
    {
      icon: Bell,
      title: "Notices",
      subtitle: "Latest updates",
      href: "/notices",
      tone: "orange",
    },
    {
      icon: MessageCircle,
      title: "Ask Admin",
      subtitle: "Need some help?",
      href: "/query",
      tone: "navy",
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <AppShell
      role="student"
      title="Dashboard"
      subtitle="Your academic command center"
    >
      <div className="student-dashboard-redesign">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="fd-hero">
          <div
            className="fd-hero-decoration"
            aria-hidden="true"
          >
            <span className="fd-orbit fd-orbit-one" />
            <span className="fd-orbit fd-orbit-two" />
            <span className="fd-orbit fd-orbit-three" />
          </div>

          <div className="fd-hero-content">
            <div className="fd-kicker">
              <span className="fd-kicker-dot" />
              STUDENT SPACE
              <span className="fd-kicker-divider">•</span>
              {student.section || "IT-C"}
            </div>

            <h1>
              {greeting},
              <br />
              <span>{student.name || "Student"}</span>
              <span className="fd-wave">👋</span>
            </h1>

            <p>
              Ready for your next class?
              <br />
              Everything important is waiting
              in one place.
            </p>

            <div className="fd-hero-actions">
              <Link
                href="/routine"
                className="fd-primary-button"
              >
                <CalendarDays size={16} />
                View Today&apos;s Schedule
                <ArrowUpRight size={15} />
              </Link>

              <Link
                href="/notes"
                className="fd-secondary-button"
              >
                <BookOpen size={16} />
                Study Material
              </Link>
            </div>

            <div className="fd-hero-meta">
              <span>
                <CheckCircle2 size={13} />
                Approved Student
              </span>

              <span>{todayLabel}</span>
            </div>
          </div>

          {/* STUDENT ID CARD */}

          <div className="fd-student-card">
            <div className="fd-student-card-top">
              <span className="fd-card-label">
                YOUR ACADEMIC ID
              </span>

              <span className="fd-approved">
                <CheckCircle2 size={12} />
                APPROVED
              </span>
            </div>

            <div className="fd-profile-row">
              <div
                className="fd-avatar"
                aria-label={`${student.name || "Student"} profile initials: ${initials}`}
                title={student.name || "Student"}
              >
                <span>{initials}</span>
              </div>

              <div className="fd-profile-copy">
                <strong>
                  {student.name || "Student"}
                </strong>

                <span>
                  {student.semester ||
                    "3rd Semester"}
                </span>
              </div>
            </div>

            <div className="fd-profile-details">
              <div>
                <span>ROLL NO.</span>
                <strong>
                  {student.rollNo || "—"}
                </strong>
              </div>

              <div>
                <span>SECTION</span>
                <strong>
                  {student.section || "IT-C"}
                </strong>
              </div>
            </div>

            <div className="fd-course">
              <GraduationCap size={17} />

              <div>
                <span>PROGRAMME</span>
                <strong>
                  Information Technology
                </strong>
              </div>
            </div>
          </div>

          {/* CLICKABLE PIKACHU-STYLE MASCOT */}

          <div className="fd-pika-wrap">
            <div
              className="fd-pika-smiles"
              aria-live="polite"
              aria-label={`${smileCount} smile emojis`}
            >
              {Array.from(
                { length: Math.min(smileCount, 6) },
                (_, index) => (
                  <span
                    key={index}
                    className="fd-smile"
                  >
                    🙂
                  </span>
                )
              )}

              {smileCount > 6 && (
                <strong>
                  +{smileCount - 6}
                </strong>
              )}
            </div>

            <button
              type="button"
              className="fd-pika-button"
              onClick={() =>
                setSmileCount((count) => count + 1)
              }
              aria-label="Click Pikachu to add a smile emoji"
              title="Click for more smiles!"
            >
              <span
                className="fd-pika-character"
                aria-hidden="true"
              >
                🐭
              </span>

              <span
                className="fd-pika-lightning"
                aria-hidden="true"
              >
                ⚡
              </span>

              <span className="fd-pika-label">
                <strong>Pikachu!</strong>
                <small>Click for a smile</small>
              </span>

              <span
                className="fd-pika-counter"
                aria-hidden="true"
              >
                😊 {smileCount}
              </span>
            </button>
          </div>

          <div className="fd-tricolour-edge" />
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="fd-stats">
          <article className="fd-stat-card saffron">
            <div className="fd-stat-icon">
              <BookOpen size={19} />
            </div>

            <div className="fd-stat-copy">
              <span>NOTES AVAILABLE</span>
              <strong>
                {loading ? "…" : notes.length}
              </strong>
              <small>Study resources</small>
            </div>

            <ArrowUpRight
              size={15}
              className="fd-stat-arrow"
            />
          </article>

          <article className="fd-stat-card green">
            <div className="fd-stat-icon">
              <ClipboardCheck size={19} />
            </div>

            <div className="fd-stat-copy">
              <span>PENDING ASSIGNMENTS</span>
              <strong>
                {loading
                  ? "…"
                  : pendingAssignments.length}
              </strong>
              <small>Need attention</small>
            </div>

            <ArrowUpRight
              size={15}
              className="fd-stat-arrow"
            />
          </article>

          <article className="fd-stat-card blue">
            <div className="fd-stat-icon">
              <CalendarDays size={19} />
            </div>

            <div className="fd-stat-copy">
              <span>TODAY&apos;S CLASSES</span>
              <strong>
                {loading
                  ? "…"
                  : todayClasses.length}
              </strong>
              <small>Scheduled today</small>
            </div>

            <ArrowUpRight
              size={15}
              className="fd-stat-arrow"
            />
          </article>

          <article className="fd-stat-card violet">
            <div className="fd-stat-icon">
              <Bell size={19} />
            </div>

            <div className="fd-stat-copy">
              <span>LATEST NOTICES</span>
              <strong>
                {loading
                  ? "…"
                  : latestNotices.length}
              </strong>
              <small>Recent updates</small>
            </div>

            <ArrowUpRight
              size={15}
              className="fd-stat-arrow"
            />
          </article>
        </section>

        {/* =====================================================
            QUICK ACCESS
        ===================================================== */}

        <section className="fd-section">
          <div className="fd-section-header">
            <div>
              <span>STUDENT WORKSPACE</span>
              <h2>
                Everything you need, one place.
              </h2>
            </div>

            <p>
              Quick access to your academic tools.
            </p>
          </div>

          <div className="fd-quick-grid">
            {quickLinks.map(
              ({
                icon: Icon,
                title,
                subtitle,
                href,
                tone,
              }) => (
                <Link
                  key={title}
                  href={href}
                  className={`fd-quick-card ${tone}`}
                >
                  <div className="fd-quick-icon">
                    <Icon size={19} />
                  </div>

                  <div className="fd-quick-copy">
                    <strong>{title}</strong>
                    <span>{subtitle}</span>
                  </div>

                  <span className="fd-quick-arrow">
                    <ArrowUpRight size={14} />
                  </span>
                </Link>
              )
            )}
          </div>
        </section>

        {/* =====================================================
            SCHEDULE + NOTICES
        ===================================================== */}

        <section className="fd-lower-grid">

          {/* TODAY'S SCHEDULE */}

          <article className="fd-panel">
            <div className="fd-panel-head">
              <div>
                <span>TODAY&apos;S SCHEDULE</span>
                <h2>Your next classes</h2>
              </div>

              <Link
                href="/routine"
                className="fd-panel-link"
              >
                View All
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="fd-panel-body fd-schedule-body">
              {loading ? (
                <div className="fd-empty">
                  <div className="fd-loader" />
                  <span>
                    Loading schedule...
                  </span>
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="fd-empty">
                  <div className="fd-empty-icon blue">
                    <CalendarDays size={18} />
                  </div>

                  <div>
                    <strong>No classes today</strong>
                    <span>
                      Your routine has no class
                      scheduled for today.
                    </span>
                  </div>
                </div>
              ) : (
                todayClasses
                  .slice(0, 5)
                  .map((item, index) => {
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
                      <div
                        key={item.id || index}
                        className={`fd-class-row ${
                          index === 0 ? "current" : ""
                        }`}
                      >
                        <div className="fd-class-time">
                          <strong>
                            {formatTime(time)}
                          </strong>

                          <span>
                            {index === 0
                              ? "UP NEXT"
                              : `CLASS ${index + 1}`}
                          </span>
                        </div>

                        <div className="fd-class-marker">
                          <i />
                          <span />
                        </div>

                        <div className="fd-class-info">
                          <strong>{subject}</strong>

                          <span>
                            {room}
                            {code ? ` • ${code}` : ""}
                          </span>
                        </div>

                        <ChevronRight
                          size={15}
                          className="fd-class-arrow"
                        />
                      </div>
                    );
                  })
              )}
            </div>
          </article>

          {/* LATEST NOTICES */}

          <article className="fd-panel">
            <div className="fd-panel-head">
              <div>
                <span>LATEST NOTICES</span>
                <h2>Stay informed</h2>
              </div>

              <Link
                href="/notices"
                className="fd-panel-link"
              >
                View All
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="fd-panel-body">
              {loading ? (
                <div className="fd-empty">
                  <div className="fd-loader" />
                  <span>
                    Loading notices...
                  </span>
                </div>
              ) : latestNotices.length === 0 ? (
                <div className="fd-empty">
                  <div className="fd-empty-icon saffron">
                    <Bell size={18} />
                  </div>

                  <div>
                    <strong>No notices yet</strong>
                    <span>
                      New academic announcements
                      will appear here.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="fd-notice-list">
                  {latestNotices.map(
                    (notice, index) => (
                      <Link
                        key={notice.id || index}
                        href="/notices"
                        className={`fd-notice-row ${
                          index === 0 ? "featured" : ""
                        }`}
                      >
                        <div className="fd-notice-icon">
                          <Bell size={16} />
                        </div>

                        <div className="fd-notice-copy">
                          <div className="fd-notice-meta">
                            <span>
                              {notice.category ||
                                notice.type ||
                                "Academic"}
                            </span>

                            <time>
                              {formatNoticeDate(notice)}
                            </time>
                          </div>

                          <strong>
                            {notice.title ||
                              notice.subject ||
                              "Untitled Notice"}
                          </strong>

                          <p>
                            {notice.content ||
                              notice.description ||
                              "Open the notice to read the complete announcement."}
                          </p>
                        </div>

                        <ChevronRight
                          size={15}
                          className="fd-notice-arrow"
                        />
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          </article>
        </section>

        {/* =====================================================
            UPCOMING ASSIGNMENTS
        ===================================================== */}

        <section className="fd-panel fd-assignment-panel">
          <div className="fd-panel-head">
            <div>
              <span>UPCOMING ASSIGNMENTS</span>
              <h2>Stay ahead of your deadlines</h2>
            </div>

            <Link
              href="/assignments"
              className="fd-panel-link"
            >
              View All
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="fd-assignment-list">
            {loading ? (
              <div className="fd-empty">
                <div className="fd-loader" />
                <span>
                  Loading assignments...
                </span>
              </div>
            ) : upcomingAssignments.length === 0 ? (
              <div className="fd-empty">
                <div className="fd-empty-icon green">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <strong>
                    No pending assignments
                  </strong>
                  <span>
                    You&apos;re all caught up for now.
                  </span>
                </div>
              </div>
            ) : (
              upcomingAssignments.map(
                (item, index) => {
                  const state =
                    getAssignmentState(item);

                  const subject =
                    item.subject ||
                    item.subject_name ||
                    "Academic";

                  const title =
                    item.title ||
                    item.name ||
                    "Assignment";

                  const dueLabel =
                    formatDueDate(item);

                  return (
                    <Link
                      key={item.id || index}
                      href="/assignments"
                      className="fd-assignment-row"
                    >
                      <div
                        className={`fd-assignment-date ${state.tone}`}
                      >
                        <strong>
                          {dueLabel.split(" ")[0]}
                        </strong>

                        <span>
                          {dueLabel
                            .split(" ")
                            .slice(1)
                            .join(" ") || "DATE"}
                        </span>
                      </div>

                      <div className="fd-assignment-copy">
                        <span>{subject}</span>
                        <strong>{title}</strong>
                        <p>
                          {item.instructions ||
                            item.description ||
                            "Open the assignment workspace to see complete details."}
                        </p>
                      </div>

                      <div className="fd-assignment-status">
                        <span
                          className={`fd-status ${state.tone}`}
                        >
                          {state.label}
                        </span>

                        <small>
                          <Clock3 size={12} />
                          {dueLabel}
                        </small>
                      </div>

                      <ChevronRight
                        size={15}
                        className="fd-assignment-arrow"
                      />
                    </Link>
                  );
                }
              )
            )}
          </div>
        </section>

        {/* =====================================================
            FOOTER STRIP
        ===================================================== */}

        <div className="fd-footer-line">
          <div>
            <span className="fd-footer-emblem">
              <AshokaChakra size={18} />
            </span>

            <span className="fd-footer-copy">
              <strong>UTKARSH</strong>
              <small>INDIA × ACADEMIA</small>
            </span>
          </div>

          <Link href="/profile">
            View Profile
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* =====================================================
            LIGHT INDIAN TRICOLOUR THEME
            Dashboard-specific styles in this JSX file.
        ===================================================== */}

        <style jsx global>{`

          /* =====================================================
             COLOUR SYSTEM
          ===================================================== */

          .student-dashboard-redesign {
            --in-saffron: #ff9933;
            --in-saffron-dark: #d96b13;
            --in-saffron-soft: #fff2e5;

            --in-white: #ffffff;
            --in-paper: #f7f9f7;
            --in-surface: #ffffff;

            --in-green: #138808;
            --in-green-dark: #096b32;
            --in-green-soft: #eaf6ec;

            --in-chakra: #000080;
            --in-chakra-soft: #edf2ff;

            --in-ink: #18251e;
            --in-muted: #68776d;
            --in-faint: #87948b;
            --in-line: #e3eae4;

            width: 100%;
            max-width: 1440px;
            margin: 0 auto;

            color: var(--in-ink);
            overflow: visible;
          }

          .student-dashboard-redesign,
          .student-dashboard-redesign *,
          .student-dashboard-redesign *::before,
          .student-dashboard-redesign *::after {
            box-sizing: border-box;
          }

          /* =====================================================
             STUDENT APP SHELL — LIGHT
          ===================================================== */

          .app-shell:has(.student-dashboard-redesign) {
            min-height: 100vh;
            width: 100%;
            overflow-x: hidden;

            background:
              radial-gradient(
                circle at 85% 0%,
                rgba(19, 136, 8, 0.045),
                transparent 25%
              ),
              #f7f9f7 !important;

            color: #18251e !important;
          }

          .app-shell:has(.student-dashboard-redesign) .app-main {
            margin-left: 266px !important;
            width: auto !important;
            min-width: 0 !important;
            flex: 1 1 auto !important;

            background: #f7f9f7 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .app-content {
            width: 100% !important;
            min-height: calc(100vh - 76px) !important;

            padding: 26px 28px 44px !important;

            background: #f7f9f7 !important;
          }

          /* =====================================================
             STUDENT SIDEBAR — WHITE WITH TRICOLOUR ACCENTS
          ===================================================== */

          .app-shell:has(.student-dashboard-redesign) .sidebar {
            width: 266px !important;
            min-width: 266px !important;

            background: #ffffff !important;

            border-right:
              1px solid #e4eae5 !important;

            box-shadow:
              8px 0 30px rgba(22, 55, 32, 0.035) !important;

            color: #53645a !important;

            padding: 18px 14px !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar-brand {
            min-height: 68px !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .logo-mark {
            background:
              linear-gradient(
                145deg,
                #ff9933 0%,
                #ff9933 31%,
                #ffffff 31%,
                #ffffff 66%,
                #138808 66%,
                #138808 100%
              ) !important;

            border:
              1px solid #d7e3d9 !important;

            box-shadow:
              0 5px 14px rgba(28, 75, 40, 0.08) !important;

            color: #000080 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .logo-mark::before,
          .app-shell:has(.student-dashboard-redesign) .sidebar .logo-mark::after {
            display: none !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .logo-mark span {
            background: transparent !important;
            color: #123b24 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .brand-copy b {
            color: #17251d !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .brand-copy small {
            color: #8a978e !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .role-chip {
            background:
              linear-gradient(
                100deg,
                rgba(255, 153, 51, 0.09),
                rgba(19, 136, 8, 0.055)
              ) !important;

            border:
              1px solid #dcebdc !important;

            color: #65736a !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .role-chip svg {
            color: var(--in-green) !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .side-label {
            color: #9aa69d !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .side-nav > a,
          .app-shell:has(.student-dashboard-redesign) .sidebar .sidebar-footer > a,
          .app-shell:has(.student-dashboard-redesign) .sidebar .sidebar-footer > button {
            color: #67776c !important;
            background: transparent !important;
            border-color: transparent !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .side-nav > a:hover,
          .app-shell:has(.student-dashboard-redesign) .sidebar .sidebar-footer > a:hover {
            background: #f5f8f5 !important;
            color: #184f2b !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .side-nav > a.active {
            color: #126b30 !important;

            background:
              linear-gradient(
                90deg,
                #fff8ee,
                #eff8ef
              ) !important;

            border:
              1px solid #d9e9d7 !important;

            box-shadow:
              0 5px 14px rgba(27, 91, 40, 0.045) !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .side-nav > a.active .nav-icon {
            color: var(--in-green) !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .side-nav > a.active i {
            background:
              linear-gradient(
                180deg,
                #ff9933 0%,
                #ff9933 33%,
                #ffffff 33%,
                #ffffff 66%,
                #138808 66%,
                #138808 100%
              ) !important;

            box-shadow:
              0 0 9px rgba(19, 136, 8, 0.12) !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .sidebar-footer {
            border-top:
              1px solid #e7ece8 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .sidebar .sidebar-footer > button {
            color: #c4535d !important;
          }

          /* =====================================================
             STUDENT TOPBAR — LIGHT
          ===================================================== */

          .app-shell:has(.student-dashboard-redesign) .topbar {
            height: 76px !important;
            min-height: 76px !important;

            padding: 0 28px !important;

            background: rgba(255, 255, 255, 0.94) !important;

            border-bottom:
              1px solid #e4eae5 !important;

            box-shadow:
              0 5px 20px rgba(28, 58, 36, 0.035) !important;

            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
          }

          .app-shell:has(.student-dashboard-redesign) .topbar-copy h1 {
            color: #19271f !important;
          }

          .app-shell:has(.student-dashboard-redesign) .topbar-copy p {
            color: #7c8a80 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .top-search {
            background: #ffffff !important;
            border: 1px solid #e0e8e1 !important;
            color: #77867c !important;
          }

          .app-shell:has(.student-dashboard-redesign) .top-search input {
            color: #243229 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .icon-button {
            background: #ffffff !important;
            border: 1px solid #e2e9e3 !important;
            color: #56685b !important;
          }

          .app-shell:has(.student-dashboard-redesign) .user-chip b {
            color: #1a2b20 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .user-chip small {
            color: #829087 !important;
          }

          .app-shell:has(.student-dashboard-redesign) .user-chip > span {
            background:
              linear-gradient(
                135deg,
                #ff9933,
                #138808
              ) !important;

            color: #ffffff !important;

            box-shadow:
              0 4px 12px rgba(19, 136, 8, 0.12);
          }

          /* =====================================================
             HERO — LIGHT TRICOLOUR
          ===================================================== */

          .fd-hero {
            position: relative;

            display: grid;

            grid-template-columns:
              minmax(0, 1fr)
              300px;

            gap: 22px;

            min-height: 252px;

            padding: 30px;

            border:
              1px solid #e0e8e1;

            border-radius: 22px;

            overflow: hidden;

            color: #19271f;

            background:
              radial-gradient(
                circle at 78% 40%,
                rgba(0, 0, 128, 0.055),
                transparent 24%
              ),
              linear-gradient(
                110deg,
                #fffaf3 0%,
                #ffffff 47%,
                #f2faf2 100%
              );

            box-shadow:
              0 14px 38px rgba(28, 64, 35, 0.065);
          }

          .fd-hero::before {
            content: "";

            position: absolute;
            inset: 0;

            pointer-events: none;

            background:
              linear-gradient(
                115deg,
                rgba(255, 153, 51, 0.09),
                transparent 37%,
                rgba(19, 136, 8, 0.07)
              );
          }

          .fd-hero-decoration {
            position: absolute;
            inset: 0;

            pointer-events: none;
            overflow: hidden;
          }

          .fd-orbit {
            position: absolute;

            border:
              1px solid rgba(0, 0, 128, 0.075);

            border-radius: 50%;
          }

          .fd-orbit-one {
            width: 300px;
            height: 300px;

            right: -62px;
            top: -120px;
          }

          .fd-orbit-two {
            width: 220px;
            height: 220px;

            right: -22px;
            top: -80px;
          }

          .fd-orbit-three {
            width: 145px;
            height: 145px;

            right: 16px;
            top: -42px;
          }

          .fd-hero-content {
            position: relative;
            z-index: 2;

            min-width: 0;

            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .fd-kicker {
            display: flex;
            align-items: center;

            flex-wrap: wrap;

            gap: 8px;

            color: #65766a;

            font-size: 9px;
            font-weight: 850;

            letter-spacing: 0.13em;
          }

          .fd-kicker-dot {
            width: 7px;
            height: 7px;

            flex: 0 0 auto;

            border-radius: 50%;

            background: #ff9933;

            box-shadow:
              0 0 0 4px rgba(255, 153, 51, 0.12);
          }

          .fd-kicker-divider {
            color: #a4b0a6;
          }

          .fd-hero h1 {
            margin: 16px 0 10px;

            color: #1a2a20;

            font-size:
              clamp(29px, 3.3vw, 43px);

            font-weight: 850;

            letter-spacing: -0.052em;

            line-height: 1.06;
          }

          .fd-hero h1 > span:first-of-type {
            color: #137b35;
          }

          .fd-wave {
            display: inline-block;
            margin-left: 7px;
          }

          .fd-hero-content > p {
            margin: 0;

            color: #66766b;

            font-size: 12px;
            line-height: 1.7;
          }

          .fd-hero-actions {
            display: flex;
            flex-wrap: wrap;

            gap: 9px;

            margin-top: 18px;
          }

          .fd-primary-button,
          .fd-secondary-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;

            gap: 7px;

            min-height: 39px;

            padding: 0 12px;

            border-radius: 10px;

            font-size: 9px;
            font-weight: 800;

            text-decoration: none;

            transition:
              transform 0.18s ease,
              box-shadow 0.18s ease;
          }

          .fd-primary-button {
            color: #ffffff;

            background:
              linear-gradient(
                100deg,
                #137b35,
                #159447
              );

            box-shadow:
              0 7px 18px rgba(19, 136, 8, 0.17);
          }

          .fd-secondary-button {
            color: #173e29;

            border:
              1px solid #dce8dc;

            background: #ffffff;
          }

          .fd-primary-button:hover,
          .fd-secondary-button:hover {
            transform: translateY(-2px);
          }

          .fd-primary-button:hover {
            box-shadow:
              0 10px 22px rgba(19, 136, 8, 0.21);
          }

          .fd-hero-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;

            gap: 14px;

            margin-top: 18px;
          }

          .fd-hero-meta span {
            display: inline-flex;
            align-items: center;

            gap: 5px;

            color: #849187;

            font-size: 8px;
            font-weight: 700;
          }

          .fd-hero-meta span:first-child {
            color: #17803c;
          }

          /* =====================================================
             PIKACHU-STYLE MASCOT BUTTON
          ===================================================== */

          .fd-pika-wrap {
            position: absolute;
            z-index: 5;

            left: 50%;
            bottom: 10px;

            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;

            transform: translateX(-50%);
          }

          .fd-pika-smiles {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 2px;

            min-height: 15px;
            max-width: 180px;

            color: #138808;
            font-size: 13px;
            line-height: 1;
          }

          .fd-smile {
            display: inline-block;
            animation:
              fd-smile-pop 220ms ease-out both;
          }

          .fd-pika-smiles strong {
            color: #137b35;
            font-size: 9px;
          }

          .fd-pika-button {
            position: relative;

            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;

            min-height: 42px;
            padding: 5px 10px;

            border: 1px solid #f2cf91;
            border-radius: 14px;

            background:
              linear-gradient(
                135deg,
                #fff4d9,
                #ffffff
              );

            color: #26372b;

            box-shadow:
              0 5px 15px rgba(153, 105, 26, 0.12);

            cursor: pointer;

            transition:
              transform 180ms ease,
              box-shadow 180ms ease,
              background 180ms ease;
          }

          .fd-pika-button:hover {
            transform: translateY(-2px);

            background:
              linear-gradient(
                135deg,
                #ffe9a8,
                #ffffff
              );

            box-shadow:
              0 8px 20px rgba(153, 105, 26, 0.2);
          }

          .fd-pika-button:active {
            transform: scale(0.96);
          }

          .fd-pika-button:focus-visible {
            outline: 3px solid #000080;
            outline-offset: 3px;
          }

          .fd-pika-character {
            display: grid;
            place-items: center;

            width: 31px;
            height: 31px;

            flex: 0 0 auto;

            border-radius: 50%;

            background: #ffe16a;

            font-size: 21px;
            line-height: 1;
          }

          .fd-pika-lightning {
            position: absolute;
            top: -5px;
            left: 27px;

            font-size: 13px;

            pointer-events: none;
          }

          .fd-pika-label {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }

          .fd-pika-label strong {
            color: #8d5912;
            font-size: 9px;
            font-weight: 850;
          }

          .fd-pika-label small {
            color: #8a978e;
            font-size: 7px;
          }

          .fd-pika-counter {
            display: inline-flex;
            align-items: center;
            gap: 3px;

            margin-left: 2px;
            padding: 4px 6px;

            border: 1px solid #f3dfb7;
            border-radius: 999px;

            background: #fffaf0;

            color: #956116;

            font-size: 8px;
            font-weight: 800;
            white-space: nowrap;
          }

          @keyframes fd-smile-pop {
            from {
              opacity: 0;
              transform: translateY(5px) scale(0.5);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .fd-tricolour-edge {
            position: absolute;

            left: 0;
            right: 0;
            bottom: 0;

            height: 4px;

            background:
              linear-gradient(
                90deg,
                #ff9933 0%,
                #ff9933 33.333%,
                #ffffff 33.333%,
                #ffffff 66.666%,
                #138808 66.666%,
                #138808 100%
              );
          }

          /* =====================================================
             STUDENT ID CARD — CLEAN MONOGRAM AVATAR
          ===================================================== */

          .fd-student-card {
            position: relative;
            z-index: 2;

            align-self: center;

            min-width: 0;

            padding: 18px;

            border:
              1px solid #e3eae4;

            border-radius: 17px;

            background:
              linear-gradient(
                145deg,
                #ffffff,
                #f9fcf9
              );

            box-shadow:
              0 12px 28px rgba(29, 66, 37, 0.075);
          }

          .fd-student-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 8px;

            margin-bottom: 15px;
          }

          .fd-card-label {
            color: #8b988e;

            font-size: 7px;
            font-weight: 850;

            letter-spacing: 0.12em;
          }

          .fd-approved {
            display: inline-flex;
            align-items: center;

            gap: 4px;

            padding: 5px 7px;

            border:
              1px solid #d2e8d6;

            border-radius: 999px;

            color: #16803b;

            background: #eff8ef;

            font-size: 6px;
            font-weight: 850;

            letter-spacing: 0.04em;

            white-space: nowrap;
          }

          .fd-profile-row {
            display: flex;
            align-items: center;

            gap: 11px;
          }

          .fd-avatar {
            position: relative;

            display: grid;
            place-items: center;

            width: 50px;
            height: 50px;

            flex: 0 0 auto;

            border: 3px solid transparent;
            border-radius: 50%;

            background:
              linear-gradient(
                #ffffff,
                #ffffff
              ) padding-box,
              linear-gradient(
                135deg,
                #ff9933 0%,
                #ff9933 33.333%,
                #ffffff 33.333%,
                #ffffff 66.666%,
                #138808 66.666%,
                #138808 100%
              ) border-box;

            color: #000080;

            box-shadow:
              0 0 0 1px #e3eae4,
              0 6px 15px rgba(30, 66, 40, 0.09);
          }

          .fd-avatar > span {
            display: block;

            color: #000080;

            font-size: 13px;
            font-weight: 900;

            line-height: 1;
            letter-spacing: -0.04em;

            user-select: none;
          }

          .fd-profile-copy {
            min-width: 0;

            display: flex;
            flex-direction: column;
          }

          .fd-profile-copy strong {
            overflow: hidden;

            color: #1a2a20;

            font-size: 13px;
            font-weight: 850;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .fd-profile-copy span {
            margin-top: 3px;

            color: #7d8c81;

            font-size: 8px;
          }

          .fd-profile-details {
            display: grid;
            grid-template-columns: 1fr 1fr;

            gap: 8px;

            margin-top: 16px;
          }

          .fd-profile-details > div {
            padding: 9px 10px;

            border:
              1px solid #e5ece6;

            border-radius: 10px;

            background:
              linear-gradient(
                100deg,
                #fffaf3,
                #f5faf5
              );
          }

          .fd-profile-details span,
          .fd-profile-details strong {
            display: block;
          }

          .fd-profile-details span {
            color: #879489;

            font-size: 6px;
            font-weight: 850;

            letter-spacing: 0.1em;
          }

          .fd-profile-details strong {
            color: #24372a;

            font-size: 9px;

            margin-top: 4px;
          }

          .fd-course {
            display: flex;
            align-items: center;

            gap: 9px;

            margin-top: 11px;
            padding-top: 12px;

            border-top:
              1px solid #e6ece7;
          }

          .fd-course > svg {
            color: #000080;
            flex: 0 0 auto;
          }

          .fd-course span,
          .fd-course strong {
            display: block;
          }

          .fd-course span {
            color: #8a978d;

            font-size: 6px;
            font-weight: 850;

            letter-spacing: 0.11em;
          }

          .fd-course strong {
            color: #23372a;

            font-size: 8px;

            margin-top: 3px;
          }

          /* =====================================================
             STATS
          ===================================================== */

          .fd-stats {
            display: grid;

            grid-template-columns:
              repeat(4, minmax(0, 1fr));

            gap: 12px;

            margin-top: 16px;
          }

          .fd-stat-card {
            position: relative;

            min-width: 0;

            display: flex;
            align-items: center;

            gap: 11px;

            min-height: 88px;

            padding: 13px;

            border:
              1px solid #e2e9e3;

            border-radius: 15px;

            background: #ffffff;

            box-shadow:
              0 7px 20px rgba(28, 60, 36, 0.035);

            overflow: hidden;

            transition:
              transform 0.18s ease,
              box-shadow 0.18s ease;
          }

          .fd-stat-card:hover {
            transform: translateY(-2px);

            box-shadow:
              0 12px 26px rgba(28, 60, 36, 0.075);
          }

          .fd-stat-card.saffron {
            border-top: 2px solid #ff9933;
          }

          .fd-stat-card.green {
            border-top: 2px solid #138808;
          }

          .fd-stat-card.blue {
            border-top: 2px solid #000080;
          }

          .fd-stat-card.violet {
            border-top: 2px solid #8b5cf6;
          }

          .fd-stat-icon {
            display: grid;
            place-items: center;

            width: 39px;
            height: 39px;

            flex: 0 0 auto;

            border-radius: 11px;
          }

          .fd-stat-card.saffron .fd-stat-icon {
            color: #db711b;
            background: #fff1e5;
          }

          .fd-stat-card.green .fd-stat-icon {
            color: #138808;
            background: #eaf6ec;
          }

          .fd-stat-card.blue .fd-stat-icon {
            color: #000080;
            background: #edf2ff;
          }

          .fd-stat-card.violet .fd-stat-icon {
            color: #7153b8;
            background: #f2edff;
          }

          .fd-stat-copy {
            min-width: 0;
          }

          .fd-stat-copy span,
          .fd-stat-copy strong,
          .fd-stat-copy small {
            display: block;
          }

          .fd-stat-copy span {
            overflow: hidden;

            color: #758279;

            font-size: 7px;
            font-weight: 850;

            letter-spacing: 0.075em;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .fd-stat-copy strong {
            color: #19281f;

            font-size: 22px;
            font-weight: 850;

            line-height: 1;

            margin: 5px 0 4px;

            letter-spacing: -0.04em;
          }

          .fd-stat-copy small {
            color: #96a198;

            font-size: 7px;
          }

          .fd-stat-arrow {
            align-self: flex-start;

            margin-left: auto;

            color: #96a399;
          }

          /* =====================================================
             SECTION HEADERS
          ===================================================== */

          .fd-section {
            margin-top: 29px;
          }

          .fd-section-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;

            gap: 20px;

            margin-bottom: 13px;
          }

          .fd-section-header > div > span,
          .fd-panel-head > div > span {
            color: #929e94;

            font-size: 7px;
            font-weight: 850;

            letter-spacing: 0.15em;
          }

          .fd-section-header h2,
          .fd-panel-head h2 {
            margin: 5px 0 0;

            color: #1d2d22;

            font-size: 17px;
            font-weight: 850;

            letter-spacing: -0.035em;
          }

          .fd-section-header p {
            margin: 0 0 2px;

            color: #849187;

            font-size: 9px;
          }

          /* =====================================================
             QUICK ACCESS GRID
          ===================================================== */

          .fd-quick-grid {
            display: grid;

            grid-template-columns:
              repeat(3, minmax(0, 1fr));

            gap: 10px;
          }

          .fd-quick-card {
            position: relative;

            min-width: 0;

            display: flex;
            align-items: center;

            gap: 10px;

            min-height: 74px;

            padding: 11px 12px;

            border:
              1px solid #e2e9e3;

            border-radius: 14px;

            background: #ffffff;

            text-decoration: none;

            box-shadow:
              0 5px 16px rgba(28, 60, 36, 0.025);

            transition:
              border-color 0.18s ease,
              transform 0.18s ease,
              box-shadow 0.18s ease;
          }

          .fd-quick-card:hover {
            transform: translateY(-2px);

            border-color: #c9dccb;

            box-shadow:
              0 10px 24px rgba(28, 60, 36, 0.065);
          }

          .fd-quick-icon {
            display: grid;
            place-items: center;

            width: 39px;
            height: 39px;

            flex: 0 0 auto;

            border-radius: 11px;
          }

          .fd-quick-card.saffron .fd-quick-icon {
            color: #db711b;
            background: #fff1e5;
          }

          .fd-quick-card.green .fd-quick-icon {
            color: #138808;
            background: #eaf6ec;
          }

          .fd-quick-card.blue .fd-quick-icon {
            color: #000080;
            background: #edf2ff;
          }

          .fd-quick-card.violet .fd-quick-icon {
            color: #7657b9;
            background: #f2edff;
          }

          .fd-quick-card.orange .fd-quick-icon {
            color: #d96b13;
            background: #fff2e5;
          }

          .fd-quick-card.navy .fd-quick-icon {
            color: #000080;
            background: #edf2ff;
          }

          .fd-quick-copy {
            min-width: 0;
          }

          .fd-quick-copy strong,
          .fd-quick-copy span {
            display: block;
          }

          .fd-quick-copy strong {
            color: #25362a;

            font-size: 10px;
            font-weight: 800;
          }

          .fd-quick-copy span {
            color: #849187;

            font-size: 7px;

            margin-top: 3px;
          }

          .fd-quick-arrow {
            display: grid;
            place-items: center;

            width: 27px;
            height: 27px;

            margin-left: auto;

            flex: 0 0 auto;

            border:
              1px solid #e8eee8;

            border-radius: 50%;

            color: #76847a;

            background: #f8faf8;
          }

          /* =====================================================
             LOWER PANELS
          ===================================================== */

          .fd-lower-grid {
            display: grid;

            grid-template-columns:
              minmax(0, 1.2fr)
              minmax(0, 0.8fr);

            gap: 16px;

            margin-top: 25px;
          }

          .fd-panel {
            min-width: 0;

            border:
              1px solid #e2e9e3;

            border-radius: 17px;

            background: #ffffff;

            overflow: hidden;

            box-shadow:
              0 9px 24px rgba(28, 60, 36, 0.035);
          }

          .fd-panel-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;

            gap: 15px;

            padding: 17px 18px 14px;

            background:
              linear-gradient(
                105deg,
                #fffdf9,
                #ffffff 53%,
                #f7fbf7
              );
          }

          .fd-panel-link {
            display: inline-flex;
            align-items: center;

            gap: 4px;

            color: #14783a;

            font-size: 8px;
            font-weight: 800;

            text-decoration: none;

            white-space: nowrap;
          }

          .fd-panel-body {
            border-top:
              1px solid #e8eee9;
          }

          /* =====================================================
             CLASS SCHEDULE
          ===================================================== */

          .fd-schedule-body {
            padding: 3px 17px 9px;
          }

          .fd-class-row {
            display: grid;

            grid-template-columns:
              74px
              15px
              minmax(0, 1fr)
              15px;

            gap: 10px;

            min-height: 70px;

            padding: 10px 0 7px;

            border-bottom:
              1px solid #edf1ed;

            position: relative;
          }

          .fd-class-row:last-child {
            border-bottom: 0;
          }

          .fd-class-time strong,
          .fd-class-time span {
            display: block;
          }

          .fd-class-time strong {
            color: #243529;

            font-size: 9px;
            font-weight: 800;
          }

          .fd-class-time span {
            margin-top: 4px;

            color: #8b988e;

            font-size: 6px;
            font-weight: 850;

            letter-spacing: 0.07em;
          }

          .fd-class-row.current .fd-class-time span {
            color: #d96b13;
          }

          .fd-class-marker {
            position: relative;

            display: flex;
            justify-content: center;
          }

          .fd-class-marker::before {
            content: "";

            position: absolute;

            width: 1px;

            top: 4px;
            bottom: -10px;

            background: #e5ece6;
          }

          .fd-class-row:last-child .fd-class-marker::before {
            display: none;
          }

          .fd-class-marker i {
            position: relative;
            z-index: 2;

            width: 8px;
            height: 8px;

            margin-top: 2px;

            border-radius: 50%;

            background: #ffffff;

            border:
              2px solid #9daea1;
          }

          .fd-class-row.current .fd-class-marker i {
            background: #ff9933;

            border-color: #ff9933;

            box-shadow:
              0 0 0 3px #fff2e5;
          }

          .fd-class-info {
            min-width: 0;
          }

          .fd-class-info strong,
          .fd-class-info span {
            display: block;
          }

          .fd-class-info strong {
            overflow: hidden;

            color: #223328;

            font-size: 10px;
            font-weight: 800;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .fd-class-info span {
            color: #859289;

            font-size: 7px;

            margin-top: 4px;
          }

          .fd-class-arrow {
            align-self: center;

            color: #9aa69c;
          }

          /* =====================================================
             NOTICES
          ===================================================== */

          .fd-notice-list {
            display: flex;
            flex-direction: column;
          }

          .fd-notice-row {
            display: grid;

            grid-template-columns:
              38px
              minmax(0, 1fr)
              15px;

            gap: 9px;

            min-height: 90px;

            padding: 13px 16px;

            border-bottom:
              1px solid #edf1ed;

            text-decoration: none;

            transition:
              background 0.18s ease;
          }

          .fd-notice-row:last-child {
            border-bottom: 0;
          }

          .fd-notice-row:hover {
            background: #fbfdfb;
          }

          .fd-notice-row.featured {
            background:
              linear-gradient(
                90deg,
                #fffaf3,
                #ffffff 60%
              );
          }

          .fd-notice-icon {
            display: grid;
            place-items: center;

            width: 36px;
            height: 36px;

            border-radius: 10px;

            color: #138808;

            background: #eaf6ec;
          }

          .fd-notice-row.featured .fd-notice-icon {
            color: #d96b13;
            background: #fff1e5;
          }

          .fd-notice-copy {
            min-width: 0;
          }

          .fd-notice-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 8px;
          }

          .fd-notice-meta span {
            color: #d96b13;

            font-size: 6px;
            font-weight: 850;

            letter-spacing: 0.08em;

            text-transform: uppercase;
          }

          .fd-notice-meta time {
            color: #8c998f;

            font-size: 6px;
          }

          .fd-notice-copy > strong {
            display: block;

            margin-top: 6px;

            color: #26372b;

            font-size: 9px;
            font-weight: 800;

            line-height: 1.4;
          }

          .fd-notice-copy p {
            display: -webkit-box;

            margin: 4px 0 0;

            overflow: hidden;

            color: #77847a;

            font-size: 7px;
            line-height: 1.5;

            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .fd-notice-arrow {
            align-self: center;

            color: #9ba79d;
          }

          /* =====================================================
             ASSIGNMENTS
          ===================================================== */

          .fd-assignment-panel {
            margin-top: 16px;
          }

          .fd-assignment-list {
            border-top:
              1px solid #e8eee9;
          }

          .fd-assignment-row {
            display: grid;

            grid-template-columns:
              48px
              minmax(0, 1fr)
              auto
              15px;

            align-items: center;

            gap: 12px;

            min-height: 88px;

            padding: 11px 17px;

            border-bottom:
              1px solid #edf1ed;

            text-decoration: none;

            transition:
              background 0.18s ease;
          }

          .fd-assignment-row:last-child {
            border-bottom: 0;
          }

          .fd-assignment-row:hover {
            background: #fbfdfb;
          }

          .fd-assignment-date {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            width: 45px;
            height: 45px;

            border-radius: 11px;

            background: #f4f7f4;

            border:
              1px solid #e6ece6;
          }

          .fd-assignment-date strong {
            color: #243529;

            font-size: 15px;
            line-height: 1;
          }

          .fd-assignment-date span {
            color: #89958b;

            font-size: 6px;
            font-weight: 850;

            margin-top: 4px;

            text-transform: uppercase;
          }

          .fd-assignment-date.urgent {
            background: #fff2e5;
            border-color: #ffe0c1;
          }

          .fd-assignment-copy {
            min-width: 0;
          }

          .fd-assignment-copy > span {
            display: block;

            color: #14783a;

            font-size: 6px;
            font-weight: 850;

            letter-spacing: 0.08em;

            text-transform: uppercase;
          }

          .fd-assignment-copy > strong {
            display: block;

            margin-top: 4px;

            overflow: hidden;

            color: #25362a;

            font-size: 10px;

            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .fd-assignment-copy p {
            display: -webkit-box;

            margin: 4px 0 0;

            overflow: hidden;

            color: #7d8a80;

            font-size: 7px;

            line-height: 1.45;

            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .fd-assignment-status {
            display: flex;
            flex-direction: column;
            align-items: flex-end;

            gap: 6px;
          }

          .fd-status {
            display: inline-flex;

            border-radius: 999px;

            padding: 4px 7px;

            font-size: 6px;
            font-weight: 850;

            text-transform: uppercase;
          }

          .fd-status.urgent {
            color: #b85f16;
            background: #fff1e5;
          }

          .fd-status.progress {
            color: #6550a8;
            background: #f1ecff;
          }

          .fd-status.normal {
            color: #137b35;
            background: #eaf6ec;
          }

          .fd-assignment-status small {
            display: inline-flex;
            align-items: center;

            gap: 4px;

            color: #859187;

            font-size: 6px;

            white-space: nowrap;
          }

          .fd-assignment-arrow {
            color: #98a49a;
          }

          /* =====================================================
             EMPTY AND LOADING STATES
          ===================================================== */

          .fd-empty {
            display: flex;
            align-items: center;

            gap: 11px;

            min-height: 100px;

            padding: 20px 18px;
          }

          .fd-empty strong,
          .fd-empty span {
            display: block;
          }

          .fd-empty strong {
            color: #28392d;

            font-size: 9px;
          }

          .fd-empty > div:last-child span,
          .fd-empty > span {
            color: #839086;

            font-size: 7px;

            margin-top: 3px;
          }

          .fd-empty-icon {
            display: grid;
            place-items: center;

            width: 36px;
            height: 36px;

            flex: 0 0 auto;

            border-radius: 10px;

            color: #000080;
            background: #edf2ff;
          }

          .fd-empty-icon.saffron {
            color: #d96b13;
            background: #fff1e5;
          }

          .fd-empty-icon.green {
            color: #138808;
            background: #eaf6ec;
          }

          .fd-loader {
            width: 18px;
            height: 18px;

            flex: 0 0 auto;

            border-radius: 50%;

            border:
              2px solid #e7eee7;

            border-top-color:
              #138808;

            animation:
              fd-spin 0.8s linear infinite;
          }

          @keyframes fd-spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* =====================================================
             FOOTER — TRICOLOUR BRANDING
          ===================================================== */

          .fd-footer-line {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 12px;

            margin-top: 15px;
            padding: 12px 14px;

            border:
              1px solid #e2e9e3;

            border-radius: 12px;

            background:
              linear-gradient(
                100deg,
                #fffaf3,
                #ffffff 49%,
                #f2faf2
              );
          }

          .fd-footer-line > div,
          .fd-footer-line > a {
            display: inline-flex;
            align-items: center;

            gap: 8px;
          }

          .fd-footer-emblem {
            display: grid;
            place-items: center;

            width: 34px;
            height: 34px;

            flex: 0 0 auto;

            color: #000080;

            border:
              1px solid #e2e9e3;

            border-radius: 9px;

            background:
              linear-gradient(
                180deg,
                #ff9933 0%,
                #ff9933 33.333%,
                #ffffff 33.333%,
                #ffffff 66.666%,
                #138808 66.666%,
                #138808 100%
              );
          }

          .fd-footer-copy {
            display: flex;
            flex-direction: column;

            gap: 3px;
          }

          .fd-footer-copy strong {
            color: #26372b;

            font-size: 8px;
            font-weight: 850;

            letter-spacing: 0.12em;
          }

          .fd-footer-copy small {
            color: #829087;

            font-size: 6px;
            font-weight: 750;

            letter-spacing: 0.09em;
          }

          .fd-footer-line > a {
            color: #137b35;

            font-size: 7px;
            font-weight: 850;

            text-decoration: none;
          }

          /* =====================================================
             TABLET
          ===================================================== */

          @media (max-width: 1180px) {
            .app-shell:has(.student-dashboard-redesign) .app-main {
              margin-left: 250px !important;
            }

            .app-shell:has(.student-dashboard-redesign) .sidebar {
              width: 250px !important;
              min-width: 250px !important;
            }

            .fd-hero {
              grid-template-columns:
                minmax(0, 1fr)
                270px;

              gap: 15px;
              padding: 24px;
            }

            .fd-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .fd-lower-grid {
              grid-template-columns: 1fr;
            }

            .fd-pika-wrap {
              left: 54%;
            }
          }

          /* =====================================================
             MOBILE
          ===================================================== */

          @media (max-width: 900px) {
            .app-shell:has(.student-dashboard-redesign) .app-main {
              width: 100% !important;
              margin-left: 0 !important;
            }

            .app-shell:has(.student-dashboard-redesign) .sidebar {
              width: 276px !important;
              min-width: 276px !important;
            }

            .app-shell:has(.student-dashboard-redesign) .topbar {
              height: 68px !important;
              min-height: 68px !important;

              padding: 0 16px !important;
            }

            .app-shell:has(.student-dashboard-redesign) .app-content {
              min-height: calc(100vh - 68px) !important;

              padding: 18px 15px 90px !important;
            }

            .fd-hero {
              grid-template-columns: 1fr;

              gap: 17px;

              min-height: auto;

              padding: 22px;
            }

            .fd-hero h1 {
              font-size: 33px;
            }

            .fd-student-card {
              width: 100%;
            }

            .fd-pika-wrap {
              position: relative;

              left: auto;
              right: auto;
              bottom: auto;

              margin: 0 auto;

              transform: none;
            }

            .fd-quick-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .fd-lower-grid {
              grid-template-columns: 1fr;
            }
          }

          /* =====================================================
             SMALL MOBILE
          ===================================================== */

          @media (max-width: 640px) {
            .student-dashboard-redesign {
              width: 100%;
            }

            .fd-hero {
              padding: 19px;
              border-radius: 18px;
            }

            .fd-hero h1 {
              font-size: 29px;
              margin-top: 13px;
            }

            .fd-hero-content > p {
              font-size: 10px;
            }

            .fd-hero-actions {
              display: grid;
              grid-template-columns: 1fr;
            }

            .fd-primary-button,
            .fd-secondary-button {
              width: 100%;
              min-height: 42px;
            }

            .fd-hero-meta {
              margin-top: 15px;
              gap: 9px;
            }

            .fd-hero-meta span {
              font-size: 7px;
            }

            .fd-student-card {
              padding: 14px;
              border-radius: 15px;
            }

            .fd-avatar {
              width: 46px;
              height: 46px;
            }

            .fd-profile-copy strong {
              font-size: 12px;
            }

            .fd-stats {
              gap: 8px;
              margin-top: 10px;
            }

            .fd-stat-card {
              min-height: 82px;
              padding: 10px;
              gap: 8px;
            }

            .fd-stat-icon {
              width: 34px;
              height: 34px;
            }

            .fd-stat-copy span {
              font-size: 6px;
              white-space: normal;
              line-height: 1.3;
            }

            .fd-stat-copy strong {
              font-size: 18px;
            }

            .fd-stat-copy small {
              font-size: 6px;
            }

            .fd-stat-arrow {
              display: none;
            }

            .fd-section {
              margin-top: 23px;
            }

            .fd-section-header {
              display: block;
              margin-bottom: 11px;
            }

            .fd-section-header h2,
            .fd-panel-head h2 {
              font-size: 15px;
            }

            .fd-section-header p {
              margin-top: 5px;
              font-size: 8px;
            }

            .fd-quick-grid {
              gap: 8px;
            }

            .fd-quick-card {
              min-height: 68px;
              padding: 9px;
              gap: 8px;
            }

            .fd-quick-icon {
              width: 33px;
              height: 33px;
            }

            .fd-quick-copy strong {
              font-size: 9px;
            }

            .fd-quick-copy span {
              font-size: 6px;
            }

            .fd-quick-arrow {
              width: 23px;
              height: 23px;
            }

            .fd-lower-grid {
              margin-top: 20px;
              gap: 12px;
            }

            .fd-panel {
              border-radius: 15px;
            }

            .fd-panel-head {
              padding: 14px 14px 12px;
            }

            .fd-panel-link {
              font-size: 7px;
            }

            .fd-schedule-body {
              padding: 2px 12px 7px;
            }

            .fd-class-row {
              grid-template-columns:
                58px
                13px
                minmax(0, 1fr)
                12px;

              gap: 7px;
              min-height: 67px;
            }

            .fd-class-time strong {
              font-size: 8px;
            }

            .fd-class-info strong {
              font-size: 9px;
            }

            .fd-class-info span {
              font-size: 6px;
            }

            .fd-notice-row {
              grid-template-columns:
                33px
                minmax(0, 1fr)
                12px;

              gap: 8px;
              min-height: 84px;
              padding: 11px 12px;
            }

            .fd-notice-icon {
              width: 32px;
              height: 32px;
            }

            .fd-notice-copy > strong {
              font-size: 8px;
            }

            .fd-notice-copy p {
              font-size: 6px;
            }

            .fd-assignment-panel {
              margin-top: 12px;
            }

            .fd-assignment-row {
              grid-template-columns:
                40px
                minmax(0, 1fr)
                13px;

              gap: 8px;
              min-height: 83px;
              padding: 10px 12px;
            }

            .fd-assignment-date {
              width: 39px;
              height: 39px;
            }

            .fd-assignment-date strong {
              font-size: 13px;
            }

            .fd-assignment-copy > strong {
              font-size: 9px;
            }

            .fd-assignment-copy p {
              font-size: 6px;
            }

            .fd-assignment-status {
              display: none;
            }

            .fd-footer-line {
              margin-top: 12px;
            }

            .fd-pika-wrap {
              margin-top: 2px;
            }
          }

          /* =====================================================
             VERY SMALL MOBILE
          ===================================================== */

          @media (max-width: 430px) {
            .fd-quick-grid {
              grid-template-columns: 1fr 1fr;
            }

            .fd-hero {
              padding: 17px;
            }

            .fd-hero h1 {
              font-size: 27px;
            }

            .fd-stats {
              grid-template-columns: 1fr 1fr;
            }

            .fd-footer-copy strong {
              font-size: 7px;
            }

            .fd-footer-line > a {
              font-size: 6px;
            }

            .fd-pika-button {
              gap: 5px;
              min-height: 38px;
              padding: 4px 8px;
            }

            .fd-pika-character {
              width: 27px;
              height: 27px;
              font-size: 18px;
            }

            .fd-pika-label strong {
              font-size: 8px;
            }

            .fd-pika-label small {
              font-size: 6px;
            }
          }

          /* =====================================================
             REDUCED MOTION
          ===================================================== */

          @media (prefers-reduced-motion: reduce) {
            .student-dashboard-redesign *,
            .student-dashboard-redesign *::before,
            .student-dashboard-redesign *::after {
              animation: none !important;
              scroll-behavior: auto !important;
              transition: none !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}