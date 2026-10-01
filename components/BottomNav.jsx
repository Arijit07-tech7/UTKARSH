"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Home,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  User,
  FileQuestion,
} from "lucide-react";

const items = [
  ["/student/dashboard", "Home", Home],
  ["/notes", "Notes", BookOpen],
  ["/assignments", "Tasks", ClipboardCheck],
  ["/pyq", "PYQ", FileQuestion],
  ["/routine", "Routine", CalendarDays],
  ["/profile", "Profile", User],
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav className="bottom-nav">
      {items.map(([href, label, Icon]) => {
        const on =
          path === href ||
          (href !== "/student/dashboard" &&
            path.startsWith(`${href}/`));

        return (
          <Link
            href={href}
            key={href}
            className={on ? "active" : ""}
          >
            <Icon size={19} strokeWidth={2.1} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}