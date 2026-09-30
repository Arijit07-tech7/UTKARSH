<div align="center">

# 🇮🇳 UTKARSH • उत्कर्ष

### Your Academic Command Center

**India's Spirit. One Academic Future.**

<p>
  <img src="https://img.shields.io/badge/INDIA-×-ACADEMIA-ff9933?style=for-the-badge&labelColor=0b0f14" />
  <img src="https://img.shields.io/badge/NARULA_INSTITUTE_OF_TECHNOLOGY-IT--C-138808?style=for-the-badge&labelColor=0b0f14" />
  <img src="https://img.shields.io/badge/2026-ACADEMIC_PLATFORM-ffffff?style=for-the-badge&labelColor=0b0f14" />
</p>

<img
  src="https://capsule-render.vercel.app/api?type=waving&color=0:ff9933,50:ffffff,100:138808&height=190&section=header&text=UTKARSH&fontSize=62&fontColor=111827&animation=fadeIn&fontAlignY=42"
  width="100%"
/>

</div>

---

## ✦ About UTKARSH

> **UTKARSH — उत्कर्ष — represents progress, growth and excellence.**

UTKARSH is a premium academic command center created for the **Information Technology • IT-C** student community of **Narula Institute of Technology**.

It brings essential academic workflows into one focused digital environment — helping students access, organize and manage academic information without depending on scattered platforms.

<div align="center">

### 🎓 Learn · Organize · Track · Progress

</div>

---

# 🪷 India × Academia

UTKARSH combines three ideas into one visual identity:

<div align="center">

| 🇮🇳 | 🎓 | ⚡ |
|:---:|:---:|:---:|
| **Indian Identity** | **Academic Purpose** | **Modern Technology** |
| Tricolour-inspired accents | Student-first workflow | Premium digital experience |

</div>

The design keeps the Indian identity **subtle, elegant and modern**, using saffron, white and green as visual accents rather than overwhelming the interface.

---

# 🚀 Platform at a Glance

<div align="center">

<table>
<tr>

<td align="center" width="25%">

## 📚

### Study

Notes, syllabus and learning resources

</td>

<td align="center" width="25%">

## 📝

### Manage

Assignments and academic tasks

</td>

<td align="center" width="25%">

## 🕐

### Organize

Routine, notices and schedules

</td>

<td align="center" width="25%">

## 🔐

### Protect

Role-based academic access

</td>

</tr>
</table>

</div>

---

# 🧠 Academic Intelligence

UTKARSH is designed as an **academic ecosystem**, not simply another dashboard.

### 📖 Study Space

A focused place for academic notes, resources and learning material.

### 📝 Assignments

A structured environment for academic tasks and submission-related information.

### 🗂️ Syllabus

Keep important syllabus information centralized and easier to access.

### 🕐 Class Routine

Quick access to class scheduling information.

### 📢 Notices

Keep important academic announcements visible and organized.

### 📄 Previous Questions

Create a structured academic resource for previous question papers and revision.

---

# 🧊 Platform Architecture

<div align="center">

```mermaid
flowchart TB

    U["🇮🇳 UTKARSH<br/><b>Academic Command Center</b>"]

    U --> S["👨‍🎓 Student Access"]
    U --> A["🛡️ Admin Access"]

    S --> SA["📚 Academic Space"]
    S --> SN["🔔 Student Information"]

    A --> AM["👥 Student Management"]
    A --> AR["📂 Academic Resources"]
    A --> AN["📢 Notices & Platform Data"]

    SA --> N["📖 Notes"]
    SA --> AS["📝 Assignments"]
    SA --> SY["🗂️ Syllabus"]
    SA --> RT["🕐 Routine"]
    SA --> PQ["📄 Previous Questions"]

    S --> AUTH["🔐 Authentication"]
    A --> AUTH

    AUTH --> DB[("☁️ Supabase<br/>PostgreSQL")]

    DB --> RLS["🛡️ Row Level Security"]

    classDef root fill:#0b0f14,color:#ffffff,stroke:#ff9933,stroke-width:3px;
    classDef student fill:#ffffff,color:#111827,stroke:#138808,stroke-width:2px;
    classDef admin fill:#ffffff,color:#111827,stroke:#ff9933,stroke-width:2px;
    classDef service fill:#f8fafc,color:#111827,stroke:#64748b,stroke-width:2px;
    classDef database fill:#eef2ff,color:#111827,stroke:#6366f1,stroke-width:2px;
    classDef security fill:#ecfdf5,color:#065f46,stroke:#138808,stroke-width:2px;

    class U root;
    class S,SA,SN,N,AS,SY,RT,PQ student;
    class A,AM,AR,AN admin;
    class AUTH service;
    class DB database;
    class RLS security;
