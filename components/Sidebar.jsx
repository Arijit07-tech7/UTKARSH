"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BookOpen, ClipboardCheck, CalendarDays, Layers3, Bell, MessageCircle, LogOut, ShieldCheck, Users, FileText, Megaphone, X, UserCircle } from "lucide-react";

const studentItems = [["/student/dashboard","Dashboard",Home],["/notes","Notes",BookOpen],["/assignments","Assignments",ClipboardCheck],["/routine","Routine",CalendarDays],["/syllabus","Syllabus",Layers3],["/notices","Notices",Bell],["/query","Ask Admin",MessageCircle]];
const adminItems = [["/admin/dashboard","Dashboard",Home],["/admin/students","Students",Users],["/admin/notes","Notes",FileText],["/admin/assignments","Assignments",ClipboardCheck],["/admin/routine","Routine",CalendarDays],["/admin/syllabus","Syllabus",Layers3],["/admin/notices","Notices",Megaphone],["/admin/queries","Queries",MessageCircle],["/notifications","Notifications",Bell]];

export default function Sidebar({ role="student", mobileOpen=false, onClose=()=>{} }) {
  const pathname = usePathname(); const router = useRouter(); const items = role === "admin" ? adminItems : studentItems;
  const active = (href) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  async function logout(){ try { await fetch("/api/auth/logout",{method:"POST"}); } finally { sessionStorage.clear(); router.replace("/"); } }
  return <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
    <div className="sidebar-brand"><Link href={role === "admin" ? "/admin/dashboard" : "/student/dashboard"} onClick={onClose}><span className="logo-mark"><span>U</span></span><span><b>UTKARSH</b><small>उत्कर्ष • IT-C</small></span></Link>{mobileOpen && <button onClick={onClose} aria-label="Close menu"><X size={19}/></button>}</div>
    <div className="role-chip"><ShieldCheck size={14}/><span>{role === "admin" ? "Administrator" : "IT-C Student"}</span></div>
    <nav className="side-nav"><div className="side-label">WORKSPACE</div>{items.map(([href,label,Icon])=><Link key={href} href={href} onClick={onClose} className={active(href)?"active":""}><Icon size={18}/><span>{label}</span>{active(href)&&<i/>}</Link>)}</nav>
    <div className="sidebar-footer"><Link href="/profile" onClick={onClose} className={active("/profile")?"active":""}><UserCircle size={18}/><span>Profile</span></Link><button onClick={logout}><LogOut size={18}/><span>Logout</span></button></div>
  </aside>;
}
