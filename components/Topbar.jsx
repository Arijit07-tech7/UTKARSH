"use client";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
export default function Topbar({ title="", subtitle="", onMenu, role="student" }) {
 return <header className="topbar"><button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={21}/></button><div className="topbar-copy"><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div><div className="topbar-actions"><div className="top-search"><Search size={16}/><input placeholder="Search your academic space..."/></div><Link href="/notifications" className="icon-button" aria-label="Notifications"><Bell size={19}/><i/></Link><Link href="/profile" className="user-chip"><span>{role === "admin" ? "A" : "S"}</span><div><b>{role === "admin" ? "UTKARSH Admin" : "IT-C Student"}</b><small>{role === "admin" ? "Administrator" : "Student"}</small></div></Link></div></header>;
}
