"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomNav from "@/components/BottomNav";

export default function AppShell({
  children,
  role = "student",
  title,
  subtitle,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        mobileOpen={open}
        onClose={() => setOpen(false)}
      />

      {open && (
        <button
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="app-main">
        <Topbar
          title={title}
          subtitle={subtitle}
          onMenu={() => setOpen(true)}
          role={role}
        />

        <main className="app-content">
          {children}
        </main>
      </div>

      {role === "student" && <BottomNav />}
    </div>
  );
}