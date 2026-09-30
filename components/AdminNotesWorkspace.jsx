"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Folder,
  FolderPlus,
  Search,
  RefreshCw,
  Plus,
  FileText,
} from "lucide-react";

export default function AdminNotesWorkspace({
  subjects = [],
  notes = [],
  loading = false,
  onRefresh,
  onCreateSubject,
  onOpenSubject,
  onUploadMaterial,
}) {
  const [search, setSearch] = useState("");

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return subjects;

    return subjects.filter((subject) =>
      `${subject.subject_code || ""} ${subject.subject_name || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [subjects, search]);

  const getMaterialCount = (subjectId) =>
    notes.filter((note) => note.subject_id === subjectId).length;

  return (
    <div className="admin-notes-workspace">
      <header className="notes-page-heading">
        <div>
          <span className="notes-eyebrow">ADMIN CONTROL CENTER</span>
          <h1>Study Material</h1>
          <p>Organize academic materials subject-wise.</p>
        </div>

        <button
          type="button"
          className="notes-primary-button"
          onClick={onCreateSubject}
        >
          <Plus size={18} />
          <span>Create Subject Folder</span>
        </button>
      </header>

      <section className="notes-library">
        <div className="notes-section-heading">
          <div>
            <span className="notes-section-kicker">ACADEMIC LIBRARY</span>
            <h2>Subject Folders</h2>
            <p>Choose a subject to manage its study materials.</p>
          </div>

          <span className="notes-count-badge">
            {subjects.length} {subjects.length === 1 ? "subject" : "subjects"}
          </span>
        </div>

        <div className="notes-toolbar">
          <label className="notes-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search subject code or subject name..."
              aria-label="Search subject folders"
            />
          </label>

          <button
            type="button"
            className="notes-refresh-button"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "notes-spinning" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="notes-empty-state">
            <div className="notes-empty-icon">
              <Folder size={30} />
            </div>
            <h3>Loading subject folders...</h3>
            <p>Please wait while the academic library loads.</p>
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="notes-subject-grid">
            {filteredSubjects.map((subject) => (
              <button
                type="button"
                key={subject.id}
                className="notes-subject-card"
                onClick={() => onOpenSubject?.(subject)}
              >
                <div className="notes-folder-icon">
                  <Folder size={27} />
                </div>

                <div className="notes-subject-info">
                  <span className="notes-subject-code">
                    {subject.subject_code}
                  </span>
                  <h3>{subject.subject_name}</h3>
                  <span className="notes-material-count">
                    <FileText size={14} />
                    {getMaterialCount(subject.id)} materials
                  </span>
                </div>

                <ArrowLeft
                  size={17}
                  className="notes-subject-arrow"
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="notes-empty-state">
            <div className="notes-empty-icon">
              {search ? <Search size={30} /> : <FolderPlus size={30} />}
            </div>

            <h3>
              {search ? "No matching subjects" : "No subject folders yet"}
            </h3>

            <p>
              {search
                ? "Try another subject code or name."
                : "Create your first subject folder to start organizing study materials."}
            </p>

            {search && (
              <button
                type="button"
                className="notes-secondary-button"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}