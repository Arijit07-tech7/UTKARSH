"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Home,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Layers3,
  Bell,
  MessageCircle,
  LogOut,
  ShieldCheck,
  Users,
  FileText,
  Megaphone,
  X,
  UserCircle,
  FolderOpen,
} from "lucide-react";

const studentItems = [
  ["/student/dashboard", "Dashboard", Home],
  ["/notes", "Notes", BookOpen],
  ["/assignments", "Assignments", ClipboardCheck],
  ["/pyq", "PYQ", FolderOpen],
  ["/routine", "Routine", CalendarDays],
  ["/syllabus", "Syllabus", Layers3],
  ["/notices", "Notices", Bell],
  ["/query", "Ask Admin", MessageCircle],
];

const adminItems = [
  ["/admin/dashboard", "Dashboard", Home],
  ["/admin/students", "Students", Users],
  ["/admin/notes", "Notes", FileText],
  ["/admin/assignments", "Assignments", ClipboardCheck],
  ["/admin/pyq", "PYQ", FolderOpen],
  ["/admin/routine", "Routine", CalendarDays],
  ["/admin/syllabus", "Syllabus", Layers3],
  ["/admin/notices", "Notices", Megaphone],
  ["/admin/queries", "Queries", MessageCircle],
  ["/notifications", "Notifications", Bell],
];

export default function Sidebar({
  role = "student",
  mobileOpen = false,
  onClose = () => {},
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isStudent = role === "student";

  const items = isStudent ? studentItems : adminItems;

  const active = (href) =>
    pathname === href ||
    (href !== "/" && pathname.startsWith(`${href}/`));

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      sessionStorage.clear();
      router.replace("/");
    }
  }

  return (
    <>
      <aside
        className={`sidebar ${
          isStudent ? "student-sidebar" : ""
        } ${mobileOpen ? "sidebar-open" : ""}`}
      >
        {/* ======================================================
            BRAND
        ====================================================== */}
        <div className="sidebar-brand">
          <Link
            href={
              role === "admin"
                ? "/admin/dashboard"
                : "/student/dashboard"
            }
            onClick={onClose}
            className="sidebar-brand-link"
          >
            <span className="logo-mark">
              <span>U</span>
            </span>

            <span className="brand-copy">
              <b>UTKARSH</b>
              <small>उत्कर्ष • IT-C</small>
            </span>
          </Link>

          {mobileOpen && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="sidebar-close"
            >
              <X size={19} />
            </button>
          )}
        </div>

        {/* ======================================================
            ROLE
        ====================================================== */}
        <div className="role-chip">
          <ShieldCheck size={14} />

          <span>
            {role === "admin"
              ? "Administrator"
              : "IT-C Student"}
          </span>
        </div>

        {/* ======================================================
            NAVIGATION
        ====================================================== */}
        <nav className="side-nav">
          <div className="side-label">
            WORKSPACE
          </div>

          {items.map(([href, label, Icon]) => {
            const isActive = active(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={isActive ? "active" : ""}
              >
                <span className="nav-icon">
                  <Icon size={18} />
                </span>

                <span className="nav-text">
                  {label}
                </span>

                {isActive && <i />}
              </Link>
            );
          })}
        </nav>

        {/* ======================================================
            FOOTER
        ====================================================== */}
        <div className="sidebar-footer">
          <Link
            href="/profile"
            onClick={onClose}
            className={active("/profile") ? "active" : ""}
          >
            <span className="nav-icon">
              <UserCircle size={18} />
            </span>

            <span className="nav-text">
              Profile
            </span>
          </Link>

          <button
            type="button"
            onClick={logout}
          >
            <span className="nav-icon">
              <LogOut size={18} />
            </span>

            <span className="nav-text">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ========================================================
          STUDENT ONLY SIDEBAR STYLES
          Admin sidebar remains untouched.
      ======================================================== */}
      {isStudent && (
        <style jsx>{`
          .student-sidebar {
            width: 274px !important;
            min-width: 274px !important;
            background: #ffffff !important;
            border-right: 1px solid #e5ebe7 !important;
            box-shadow: 12px 0 30px rgba(18, 52, 37, 0.035);
            color: #18231e;
            display: flex !important;
            flex-direction: column !important;
            padding: 0 16px !important;
            position: relative;
            z-index: 100;
          }

          .student-sidebar *,
          .student-sidebar *::before,
          .student-sidebar *::after {
            box-sizing: border-box;
          }

          /* ------------------------------------------------------
             BRAND
          ------------------------------------------------------ */

          .student-sidebar .sidebar-brand {
            align-items: center;
            display: flex;
            justify-content: space-between;
            min-height: 88px;
            padding: 16px 0 12px;
          }

          .student-sidebar .sidebar-brand-link {
            align-items: center;
            display: flex;
            gap: 10px;
            min-width: 0;
            text-decoration: none;
          }

          .student-sidebar .logo-mark {
            align-items: center;
            background:
              linear-gradient(
                145deg,
                #ffffff 0%,
                #ffffff 53%,
                #edf8f1 53%,
                #edf8f1 100%
              );
            border: 1px solid #dbe7df;
            border-radius: 14px;
            box-shadow:
              0 5px 13px rgba(18, 77, 51, 0.08),
              inset 0 0 0 1px rgba(255, 255, 255, 0.8);
            display: flex;
            height: 45px;
            justify-content: center;
            overflow: hidden;
            position: relative;
            width: 45px;
          }

          .student-sidebar .logo-mark::before {
            background: #ff9933;
            border-radius: 999px;
            content: "";
            height: 25px;
            left: -7px;
            position: absolute;
            top: -8px;
            transform: rotate(42deg);
            width: 42px;
          }

          .student-sidebar .logo-mark::after {
            background: #138808;
            border-radius: 999px;
            bottom: -11px;
            content: "";
            height: 26px;
            position: absolute;
            right: -7px;
            transform: rotate(-42deg);
            width: 43px;
          }

          .student-sidebar .logo-mark span {
            align-items: center;
            background: #ffffff;
            border-radius: 10px;
            color: #123f2c;
            display: flex;
            font-size: 17px;
            font-weight: 900;
            height: 28px;
            justify-content: center;
            letter-spacing: -0.06em;
            position: relative;
            width: 28px;
            z-index: 2;
          }

          .student-sidebar .brand-copy {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .student-sidebar .brand-copy b {
            color: #17241e;
            font-size: 15px;
            font-weight: 850;
            letter-spacing: 0.13em;
            line-height: 1;
          }

          .student-sidebar .brand-copy small {
            color: #8a958f;
            font-size: 8px;
            font-weight: 650;
            letter-spacing: 0.02em;
            margin-top: 5px;
          }

          .student-sidebar .sidebar-close {
            align-items: center;
            background: #f5f8f6;
            border: 1px solid #e2e9e4;
            border-radius: 10px;
            color: #52615a;
            cursor: pointer;
            display: flex;
            height: 34px;
            justify-content: center;
            width: 34px;
          }

          /* ------------------------------------------------------
             ROLE CHIP
          ------------------------------------------------------ */

          .student-sidebar .role-chip {
            align-items: center;
            background:
              linear-gradient(
                90deg,
                #fffaf3 0%,
                #f7fcf8 100%
              ) !important;
            border: 1px solid #dcebdc !important;
            border-radius: 13px !important;
            color: #59655e !important;
            display: flex !important;
            font-size: 11px !important;
            font-weight: 760 !important;
            gap: 8px !important;
            min-height: 39px !important;
            padding: 0 12px !important;
          }

          .student-sidebar .role-chip svg {
            color: #138808;
            flex: 0 0 auto;
            stroke-width: 2;
          }

          /* ------------------------------------------------------
             NAVIGATION
          ------------------------------------------------------ */

          .student-sidebar .side-nav {
            display: flex;
            flex: 1;
            flex-direction: column;
            padding-top: 23px;
          }

          .student-sidebar .side-label {
            color: #a1aaa5;
            font-size: 8px;
            font-weight: 850;
            letter-spacing: 0.16em;
            line-height: 1;
            margin: 0 11px 11px;
          }

          .student-sidebar .side-nav > a,
          .student-sidebar .sidebar-footer > a,
          .student-sidebar .sidebar-footer > button {
            align-items: center;
            background: transparent;
            border: 0;
            border-radius: 12px;
            color: #69766f;
            cursor: pointer;
            display: flex;
            font: inherit;
            gap: 11px;
            margin: 2px 0;
            min-height: 45px;
            padding: 0 12px;
            position: relative;
            text-decoration: none;
            transition:
              background 180ms ease,
              color 180ms ease,
              transform 180ms ease;
            width: 100%;
          }

          .student-sidebar .side-nav > a:hover,
          .student-sidebar .sidebar-footer > a:hover,
          .student-sidebar .sidebar-footer > button:hover {
            background: #f7faf8;
            color: #235b42;
            transform: translateX(1px);
          }

          .student-sidebar .nav-icon {
            align-items: center;
            color: currentColor;
            display: flex;
            flex: 0 0 auto;
            justify-content: center;
            width: 21px;
          }

          .student-sidebar .nav-icon svg {
            stroke-width: 1.8;
          }

          .student-sidebar .nav-text {
            font-size: 11px;
            font-weight: 720;
            line-height: 1;
          }

          /* ------------------------------------------------------
             ACTIVE NAVIGATION
          ------------------------------------------------------ */

          .student-sidebar .side-nav > a.active {
            background:
              linear-gradient(
                90deg,
                #fffaf0 0%,
                #f0faef 100%
              );
            box-shadow:
              inset 0 0 0 1px rgba(179, 207, 186, 0.4),
              0 5px 14px rgba(21, 87, 54, 0.045);
            color: #187842;
          }

          .student-sidebar .side-nav > a.active::before {
            background:
              linear-gradient(
                180deg,
                #ff9933 0%,
                #ff9933 31%,
                #ffffff 31%,
                #ffffff 67%,
                #138808 67%,
                #138808 100%
              );
            border-radius: 999px;
            content: "";
            height: 23px;
            left: -1px;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
          }

          .student-sidebar .side-nav > a.active .nav-icon {
            color: #138808;
          }

          .student-sidebar .side-nav > a.active .nav-icon svg {
            stroke-width: 2;
          }

          .student-sidebar .side-nav > a.active i {
            background:
              linear-gradient(
                180deg,
                #ff9933 0%,
                #ff9933 33%,
                #f8faf7 33%,
                #f8faf7 66%,
                #138808 66%,
                #138808 100%
              );
            border-radius: 999px;
            height: 22px;
            margin-left: auto;
            opacity: 0.95;
            width: 4px;
          }

          /* ------------------------------------------------------
             FOOTER
          ------------------------------------------------------ */

          .student-sidebar .sidebar-footer {
            border-top: 1px solid #e8ede9;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 18px 0 16px;
          }

          .student-sidebar .sidebar-footer > button {
            color: #d05b65;
          }

          .student-sidebar .sidebar-footer > button:hover {
            background: #fff7f7;
            color: #c44754;
          }

          .student-sidebar .sidebar-footer > a.active {
            background: #f5f9f6;
            color: #187842;
          }

          /* ------------------------------------------------------
             DESKTOP HEIGHT
          ------------------------------------------------------ */

          @media (min-width: 901px) {
            .student-sidebar {
              height: 100vh !important;
              position: sticky !important;
              top: 0;
            }
          }

          /* ------------------------------------------------------
             TABLET
          ------------------------------------------------------ */

          @media (max-width: 900px) {
            .student-sidebar {
              box-shadow: 18px 0 45px rgba(10, 27, 19, 0.12);
            }
          }

          /* ------------------------------------------------------
             MOBILE DRAWER
          ------------------------------------------------------ */

          @media (max-width: 760px) {
            .student-sidebar {
              height: 100dvh !important;
              left: 0;
              max-width: 84vw;
              min-width: 0 !important;
              position: fixed !important;
              top: 0;
              transform: translateX(-105%);
              transition: transform 240ms ease;
              width: 276px !important;
              z-index: 1000;
            }

            .student-sidebar.sidebar-open {
              transform: translateX(0);
            }

            .student-sidebar .sidebar-brand {
              min-height: 80px;
            }

            .student-sidebar .side-nav {
              padding-top: 18px;
            }

            .student-sidebar .side-nav > a,
            .student-sidebar .sidebar-footer > a,
            .student-sidebar .sidebar-footer > button {
              min-height: 48px;
            }

            .student-sidebar .nav-text {
              font-size: 12px;
            }
          }

          /* ------------------------------------------------------
             REDUCED MOTION
          ------------------------------------------------------ */

          @media (prefers-reduced-motion: reduce) {
            .student-sidebar *,
            .student-sidebar *::before,
            .student-sidebar *::after {
              scroll-behavior: auto !important;
              transition: none !important;
            }
          }
        `}</style>
      )}
    </>
  );
}