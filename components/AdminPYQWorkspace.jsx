"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ExternalLink,
  FileText,
  FileUp,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import AppShell from "@/components/AppShell";
import { PageHeader, Status } from "@/components/ui";

const MAX_PDF_SIZE = 20 * 1024 * 1024;

function uniqueById(items) {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPYQWorkspace() {
  const [subjects, setSubjects] = useState([]);
  const [years, setYears] = useState([]);
  const [papers, setPapers] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [papersLoading, setPapersLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  const [subjectForm, setSubjectForm] = useState({
    subject_name: "",
    subject_code: "",
  });

  const [yearForm, setYearForm] = useState({
    year: String(new Date().getFullYear()),
  });

  const [paperForm, setPaperForm] = useState({
    title: "",
    serial_no: "1",
    pdf: null,
  });

  /* =========================================================
     LOAD SUBJECTS
  ========================================================= */

  async function loadSubjects() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/pyq?view=subjects",
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            "Could not load PYQ subjects."
        );
      }

      setSubjects(
        uniqueById(result.data)
      );
    } catch (err) {
      console.error(
        "Admin PYQ subjects:",
        err
      );

      setSubjects([]);

      setError(
        err?.message ||
          "Could not load PYQ subjects."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD YEARS
  ========================================================= */

  async function loadYears(subjectId) {
    if (!subjectId) return;

    try {
      setYearsLoading(true);
      setError("");

      const response = await fetch(
        `/api/pyq?view=years&subject_id=${encodeURIComponent(
          subjectId
        )}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            "Could not load PYQ years."
        );
      }

      setYears(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error(
        "Admin PYQ years:",
        err
      );

      setYears([]);

      setError(
        err?.message ||
          "Could not load PYQ years."
      );
    } finally {
      setYearsLoading(false);
    }
  }

  /* =========================================================
     LOAD PAPERS
  ========================================================= */

  async function loadPapers(yearId) {
    if (!yearId) return;

    try {
      setPapersLoading(true);
      setError("");

      const response = await fetch(
        `/api/pyq?view=papers&year_id=${encodeURIComponent(
          yearId
        )}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            "Could not load question papers."
        );
      }

      setPapers(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      console.error(
        "Admin PYQ papers:",
        err
      );

      setPapers([]);

      setError(
        err?.message ||
          "Could not load question papers."
      );
    } finally {
      setPapersLoading(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadSubjects();
  }, []);

  /* =========================================================
     FILTER SUBJECTS
  ========================================================= */

  const filteredSubjects = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    if (!term) {
      return subjects;
    }

    return subjects.filter(
      (subject) =>
        `${subject.subject_code || ""} ${
          subject.subject_name || ""
        }`
          .toLowerCase()
          .includes(term)
    );
  }, [subjects, search]);

  /* =========================================================
     FILTER YEARS
  ========================================================= */

  const filteredYears = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    if (!term) {
      return years;
    }

    return years.filter((year) =>
      String(year.year)
        .toLowerCase()
        .includes(term)
    );
  }, [years, search]);

  /* =========================================================
     FILTER PAPERS
  ========================================================= */

  const filteredPapers = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    if (!term) {
      return papers;
    }

    return papers.filter((paper) =>
      `${paper.title || ""} ${
        paper.file_name || ""
      } ${paper.serial_no || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [papers, search]);

  /* =========================================================
     SUBJECT MODAL
  ========================================================= */

  function openSubjectModal() {
    setSubjectForm({
      subject_name: "",
      subject_code: "",
    });

    setError("");
    setModal("subject");
  }

  /* =========================================================
     YEAR MODAL
  ========================================================= */

  function openYearModal() {
    setYearForm({
      year: String(
        new Date().getFullYear()
      ),
    });

    setError("");
    setModal("year");
  }

  /* =========================================================
     PAPER MODAL
  ========================================================= */

  function openPaperModal() {
    const nextSerial =
      papers.length > 0
        ? Math.max(
            ...papers.map(
              (paper) =>
                Number(
                  paper.serial_no
                ) || 0
            )
          ) + 1
        : 1;

    setPaperForm({
      title: "",
      serial_no:
        String(nextSerial),
      pdf: null,
    });

    setError("");
    setModal("paper");
  }

  function closeModal() {
    if (saving) return;

    setModal(null);
    setError("");
  }

  /* =========================================================
     CREATE SUBJECT
  ========================================================= */

  async function createSubject() {
    const subjectName =
      subjectForm.subject_name.trim();

    const subjectCode =
      subjectForm.subject_code.trim();

    if (!subjectName) {
      setError(
        "Subject name is required."
      );
      return;
    }

    if (!subjectCode) {
      setError(
        "Subject code is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await fetch("/api/pyq", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "same-origin",
          body: JSON.stringify({
            action:
              "create-subject",
            subject_name:
              subjectName,
            subject_code:
              subjectCode,
          }),
        });

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Could not create PYQ subject."
        );
      }

      if (result.data) {
        setSubjects(
          (previous) =>
            uniqueById([
              result.data,
              ...previous,
            ])
        );
      } else {
        await loadSubjects();
      }

      setModal(null);

      setSubjectForm({
        subject_name: "",
        subject_code: "",
      });
    } catch (err) {
      console.error(
        "Create PYQ subject:",
        err
      );

      setError(
        err?.message ||
          "Could not create PYQ subject."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CREATE YEAR
  ========================================================= */

  async function createYear() {
    const year =
      Number(yearForm.year);

    if (!selectedSubject?.id) {
      setError(
        "Select a subject first."
      );
      return;
    }

    if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 2100
    ) {
      setError(
        "Enter a valid year between 1900 and 2100."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await fetch("/api/pyq", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "same-origin",
          body: JSON.stringify({
            action:
              "create-year",
            subject_id:
              selectedSubject.id,
            year,
          }),
        });

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Could not create year folder."
        );
      }

      setModal(null);

      await loadYears(
        selectedSubject.id
      );
    } catch (err) {
      console.error(
        "Create PYQ year:",
        err
      );

      setError(
        err?.message ||
          "Could not create year folder."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     UPLOAD PAPER
  ========================================================= */

  async function uploadPaper() {
    if (!selectedYear?.id) {
      setError(
        "Select a year folder first."
      );
      return;
    }

    const title =
      paperForm.title.trim();

    const serial =
      Number(
        paperForm.serial_no
      );

    const file =
      paperForm.pdf;

    if (!title) {
      setError(
        "Question paper title is required."
      );
      return;
    }

    if (
      !Number.isInteger(serial) ||
      serial < 1
    ) {
      setError(
        "Serial number must be a positive integer."
      );
      return;
    }

    if (!(file instanceof File)) {
      setError(
        "Please select a PDF file."
      );
      return;
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      setError(
        "Only PDF files are allowed."
      );
      return;
    }

    if (file.size <= 0) {
      setError(
        "The selected PDF is empty."
      );
      return;
    }

    if (
      file.size >
      MAX_PDF_SIZE
    ) {
      setError(
        "PDF size must be less than 20 MB."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const formData =
        new FormData();

      formData.append(
        "action",
        "upload-paper"
      );

      formData.append(
        "year_id",
        selectedYear.id
      );

      formData.append(
        "title",
        title
      );

      formData.append(
        "serial_no",
        String(serial)
      );

      formData.append(
        "pdf",
        file
      );

      const response =
        await fetch("/api/pyq", {
          method: "POST",
          credentials:
            "same-origin",
          body: formData,
        });

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Could not upload question paper."
        );
      }

      setModal(null);

      setPaperForm({
        title: "",
        serial_no:
          String(serial + 1),
        pdf: null,
      });

      await loadPapers(
        selectedYear.id
      );
    } catch (err) {
      console.error(
        "Upload PYQ paper:",
        err
      );

      setError(
        err?.message ||
          "Could not upload question paper."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE HELPER
  ========================================================= */

  async function deletePyq(
    action,
    id,
    message,
    afterDelete
  ) {
    if (!id) return;

    const confirmed =
      window.confirm(message);

    if (!confirmed) return;

    try {
      setError("");

      const response =
        await fetch("/api/pyq", {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials:
            "same-origin",
          body: JSON.stringify({
            action,
            id,
          }),
        });

      const result =
        await response
          .json()
          .catch(() => null);

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            "Could not delete PYQ item."
        );
      }

      await afterDelete?.();
    } catch (err) {
      console.error(
        `Delete ${action}:`,
        err
      );

      setError(
        err?.message ||
          "Could not delete PYQ item."
      );
    }
  }

  /* =========================================================
     OPEN SUBJECT
  ========================================================= */

  async function openSubject(
    subject
  ) {
    setSelectedSubject(subject);
    setSelectedYear(null);

    setYears([]);
    setPapers([]);

    setSearch("");
    setError("");

    await loadYears(
      subject.id
    );
  }

  function backToSubjects() {
    setSelectedSubject(null);
    setSelectedYear(null);

    setYears([]);
    setPapers([]);

    setSearch("");
    setError("");
  }

  /* =========================================================
     OPEN YEAR
  ========================================================= */

  async function openYear(year) {
    setSelectedYear(year);
    setPapers([]);

    setSearch("");
    setError("");

    await loadPapers(
      year.id
    );
  }

  function backToYears() {
    setSelectedYear(null);
    setPapers([]);

    setSearch("");
    setError("");
  }

  /* =========================================================
     SUBJECT VIEW
  ========================================================= */

  function renderSubjects() {
    return (
      <>
        <div className="subject-library-header">
          <div>
            <span>
              PYQ REPOSITORY
            </span>

            <h2>
              Previous Year Questions
            </h2>

            <p>
              Manage PYQ subjects,
              examination years and
              question paper PDFs.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={
              openSubjectModal
            }
          >
            <Plus size={17} />
            Create Subject Folder
          </button>
        </div>

        <div className="resource-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search PYQ subjects..."
              type="search"
            />
          </div>

          <button
            type="button"
            className="soft-button"
            onClick={
              loadSubjects
            }
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "dashboard-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map(
              (item) => (
                <div
                  className="skeleton-card"
                  key={item}
                />
              )
            )}
          </div>
        ) : filteredSubjects.length ===
          0 ? (
          <div className="subject-empty-state">
            <div>
              <Folder size={28} />
            </div>

            <h3>
              No PYQ subject folders
            </h3>

            <p>
              Create a subject folder
              to start organizing
              previous year question
              papers.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                openSubjectModal
              }
            >
              <Plus size={17} />
              Create Subject Folder
            </button>
          </div>
        ) : (
          <div className="subject-folder-grid">
            {filteredSubjects.map(
              (subject) => (
                <div
                  className="subject-folder-card"
                  key={subject.id}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openSubject(
                        subject
                      )
                    }
                    style={{
                      appearance:
                        "none",
                      border: 0,
                      background:
                        "transparent",
                      padding: 0,
                      margin: 0,
                      width:
                        "100%",
                      color:
                        "inherit",
                      textAlign:
                        "left",
                      cursor:
                        "pointer",
                    }}
                  >
                    <div className="subject-folder-card-top">
                      <span className="subject-folder-icon">
                        <FolderOpen
                          size={23}
                        />
                      </span>

                      <span className="subject-folder-arrow">
                        <ExternalLink
                          size={14}
                        />
                      </span>
                    </div>

                    <div className="subject-folder-code">
                      {
                        subject.subject_code
                      }
                    </div>

                    <h3>
                      {
                        subject.subject_name
                      }
                    </h3>

                    <p>
                      Open this subject
                      to manage year
                      folders and
                      question papers.
                    </p>
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      deletePyq(
                        "delete-subject",
                        subject.id,
                        `Delete "${subject.subject_name}" and all its years/question papers?`,
                        async () => {
                          if (
                            selectedSubject?.id ===
                            subject.id
                          ) {
                            backToSubjects();
                          }

                          setSubjects(
                            (
                              previous
                            ) =>
                              previous.filter(
                                (item) =>
                                  item.id !==
                                  subject.id
                              )
                          );
                        }
                      )
                    }
                    title="Delete subject folder"
                    aria-label={`Delete ${subject.subject_name}`}
                    style={{
                      marginTop: 14,
                      marginLeft:
                        "auto",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </>
    );
  }

  /* =========================================================
     YEAR VIEW
  ========================================================= */

  function renderYears() {
    return (
      <>
        <div className="subject-workspace-header">
          <button
            type="button"
            className="soft-button"
            onClick={
              backToSubjects
            }
          >
            <ArrowLeft size={17} />
            Back to Subjects
          </button>

          <div className="subject-workspace-title">
            <div className="subject-folder-large">
              <FolderOpen size={25} />
            </div>

            <div>
              <span>
                PYQ SUBJECT
              </span>

              <h2>
                {
                  selectedSubject?.subject_code
                }
              </h2>

              <p>
                {
                  selectedSubject?.subject_name
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={
              openYearModal
            }
          >
            <Plus size={17} />
            Create Year Folder
          </button>
        </div>

        <div className="resource-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search year..."
              type="search"
            />
          </div>

          <button
            type="button"
            className="soft-button"
            onClick={() =>
              loadYears(
                selectedSubject.id
              )
            }
            disabled={
              yearsLoading
            }
          >
            <RefreshCw
              size={16}
              className={
                yearsLoading
                  ? "dashboard-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {yearsLoading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map(
              (item) => (
                <div
                  className="skeleton-card"
                  key={item}
                />
              )
            )}
          </div>
        ) : filteredYears.length ===
          0 ? (
          <div className="subject-empty-state">
            <div>
              <Folder size={28} />
            </div>

            <h3>
              No year folders
            </h3>

            <p>
              Add the examination
              year for this subject.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                openYearModal
              }
            >
              <Plus size={17} />
              Create Year Folder
            </button>
          </div>
        ) : (
          <div className="subject-folder-grid">
            {filteredYears.map(
              (year) => (
                <div
                  className="subject-folder-card"
                  key={year.id}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openYear(year)
                    }
                    style={{
                      appearance:
                        "none",
                      border: 0,
                      background:
                        "transparent",
                      padding: 0,
                      margin: 0,
                      width:
                        "100%",
                      color:
                        "inherit",
                      textAlign:
                        "left",
                      cursor:
                        "pointer",
                    }}
                  >
                    <div className="subject-folder-card-top">
                      <span className="subject-folder-icon">
                        <FolderOpen
                          size={23}
                        />
                      </span>

                      <span className="subject-folder-arrow">
                        <ExternalLink
                          size={14}
                        />
                      </span>
                    </div>

                    <div className="subject-folder-code">
                      PYQ YEAR
                    </div>

                    <h3>
                      {year.year}
                    </h3>

                    <p>
                      Open this year
                      to manage its
                      question papers.
                    </p>
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() =>
                      deletePyq(
                        "delete-year",
                        year.id,
                        `Delete the ${year.year} folder and all question papers inside it?`,
                        async () => {
                          if (
                            selectedYear?.id ===
                            year.id
                          ) {
                            backToYears();
                          }

                          await loadYears(
                            selectedSubject.id
                          );
                        }
                      )
                    }
                    title="Delete year folder"
                    aria-label={`Delete ${year.year}`}
                    style={{
                      marginTop: 14,
                      marginLeft:
                        "auto",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </>
    );
  }

  /* =========================================================
     PAPER VIEW
  ========================================================= */

  function renderPapers() {
    return (
      <>
        <div className="subject-workspace-header">
          <button
            type="button"
            className="soft-button"
            onClick={
              backToYears
            }
          >
            <ArrowLeft size={17} />
            Back to Years
          </button>

          <div className="subject-workspace-title">
            <div className="subject-folder-large">
              <FolderOpen size={25} />
            </div>

            <div>
              <span>
                QUESTION PAPERS
              </span>

              <h2>
                {selectedYear?.year}
              </h2>

              <p>
                {
                  selectedSubject?.subject_code
                }{" "}
                •{" "}
                {
                  selectedSubject?.subject_name
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={
              openPaperModal
            }
          >
            <Upload size={17} />
            Upload Question Paper
          </button>
        </div>

        <div className="resource-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search question papers..."
              type="search"
            />
          </div>

          <button
            type="button"
            className="soft-button"
            onClick={() =>
              loadPapers(
                selectedYear.id
              )
            }
            disabled={
              papersLoading
            }
          >
            <RefreshCw
              size={16}
              className={
                papersLoading
                  ? "dashboard-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        {papersLoading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map(
              (item) => (
                <div
                  className="skeleton-card"
                  key={item}
                />
              )
            )}
          </div>
        ) : filteredPapers.length ===
          0 ? (
          <div className="subject-empty-state">
            <div>
              <FileText size={28} />
            </div>

            <h3>
              No question papers yet
            </h3>

            <p>
              Upload the first question
              paper for{" "}
              {selectedYear?.year}.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                openPaperModal
              }
            >
              <Upload size={17} />
              Upload Question Paper
            </button>
          </div>
        ) : (
          <div className="admin-table-card">
            <div className="table-head">
              <span>
                Question Paper
              </span>

              <span>
                File
              </span>

              <span>
                Status
              </span>

              <span>
                Action
              </span>
            </div>

            {filteredPapers.map(
              (paper) => (
                <div
                  className="table-row"
                  key={paper.id}
                >
                  <div className="table-main">
                    <span className="table-icon">
                      <FileText
                        size={17}
                      />
                    </span>

                    <div>
                      <b>
                        {paper.serial_no}.{" "}
                        {paper.title ||
                          "Question Paper"}
                      </b>

                      <small>
                        {formatDate(
                          paper.created_at
                        )}
                      </small>
                    </div>
                  </div>

                  <span>
                    {
                      paper.file_name ||
                      "PDF"
                    }
                  </span>

                  <Status tone="green">
                    PDF
                  </Status>

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "flex-end",
                      gap: 8,
                    }}
                  >
                    {paper.pdf_url && (
                      <a
                        href={
                          paper.pdf_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="soft-button"
                        style={{
                          minHeight: 36,
                          padding:
                            "0 11px",
                          textDecoration:
                            "none",
                        }}
                      >
                        <ExternalLink
                          size={15}
                        />
                        View
                      </a>
                    )}

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        deletePyq(
                          "delete-paper",
                          paper.id,
                          `Delete "${paper.title || "this question paper"}"?`,
                          async () =>
                            loadPapers(
                              selectedYear.id
                            )
                        )
                      }
                      title="Delete question paper"
                      aria-label="Delete question paper"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </>
    );
  }

  /* =========================================================
     MODAL
  ========================================================= */

  function renderModal() {
    if (!modal) {
      return null;
    }

    const isSubject =
      modal === "subject";

    const isYear =
      modal === "year";

    return (
      <div
        className="modal-backdrop"
        onMouseDown={
          closeModal
        }
      >
        <div
          className="modal resource-modal"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <div className="modal-head">
            <div>
              <span>
                PYQ MANAGEMENT
              </span>

              <h3>
                {isSubject
                  ? "Create Subject Folder"
                  : isYear
                    ? "Create Year Folder"
                    : "Upload Question Paper"}
              </h3>

              {!isSubject &&
                selectedSubject && (
                  <small>
                    {
                      selectedSubject.subject_code
                    }{" "}
                    •{" "}
                    {
                      selectedSubject.subject_name
                    }
                    {!isYear &&
                    selectedYear
                      ? ` • ${selectedYear.year}`
                      : ""}
                  </small>
                )}
            </div>

            <button
              type="button"
              onClick={
                closeModal
              }
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          <div className="resource-form">
            {isSubject && (
              <>
                <label className="resource-form-field">
                  <span>
                    Subject Name{" "}
                    <i>*</i>
                  </span>

                  <input
                    value={
                      subjectForm.subject_name
                    }
                    onChange={(
                      event
                    ) =>
                      setSubjectForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          subject_name:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. Formal Language and Automata Theory"
                    autoComplete="off"
                  />
                </label>

                <label className="resource-form-field">
                  <span>
                    Subject Code{" "}
                    <i>*</i>
                  </span>

                  <input
                    value={
                      subjectForm.subject_code
                    }
                    onChange={(
                      event
                    ) =>
                      setSubjectForm(
                        (
                          previous
                        ) => ({
                          ...previous,
                          subject_code:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. IT302"
                    autoComplete="off"
                  />
                </label>
              </>
            )}

            {isYear && (
              <label className="resource-form-field">
                <span>
                  Examination Year{" "}
                  <i>*</i>
                </span>

                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={
                    yearForm.year
                  }
                  onChange={(
                    event
                  ) =>
                    setYearForm({
                      year:
                        event.target
                          .value,
                    })
                  }
                  placeholder="e.g. 2026"
                />
              </label>
            )}

            {!isSubject &&
              !isYear && (
                <>
                  <label className="resource-form-field">
                    <span>
                      Paper Title{" "}
                      <i>*</i>
                    </span>

                    <input
                      value={
                        paperForm.title
                      }
                      onChange={(
                        event
                      ) =>
                        setPaperForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            title:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="e.g. End Semester Question Paper"
                      autoComplete="off"
                    />
                  </label>

                  <label className="resource-form-field">
                    <span>
                      Serial Number{" "}
                      <i>*</i>
                    </span>

                    <input
                      type="number"
                      min="1"
                      value={
                        paperForm.serial_no
                      }
                      onChange={(
                        event
                      ) =>
                        setPaperForm(
                          (
                            previous
                          ) => ({
                            ...previous,
                            serial_no:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="e.g. 1"
                    />
                  </label>

                  <div className="resource-form-field">
                    <span>
                      Question Paper PDF{" "}
                      <i>*</i>
                    </span>

                    <div className="pdf-upload-box">
                      <input
                        id="admin-pyq-paper-file"
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(
                          event
                        ) =>
                          setPaperForm(
                            (
                              previous
                            ) => ({
                              ...previous,
                              pdf:
                                event
                                  .target
                                  .files?.[0] ||
                                null,
                            })
                          )
                        }
                      />

                      <label
                        htmlFor="admin-pyq-paper-file"
                        className="pdf-upload-content"
                      >
                        <span className="pdf-upload-icon">
                          <FileUp
                            size={22}
                          />
                        </span>

                        <span>
                          <b>
                            {paperForm.pdf
                              ?.name ||
                              "Choose PDF file"}
                          </b>

                          <small>
                            PDF only • Maximum 20 MB
                          </small>
                        </span>

                        <Upload
                          size={18}
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="soft-button"
              onClick={
                closeModal
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={
                isSubject
                  ? createSubject
                  : isYear
                    ? createYear
                    : uploadPaper
              }
              disabled={saving}
            >
              {isSubject ? (
                <Folder size={16} />
              ) : isYear ? (
                <Plus size={16} />
              ) : (
                <Upload size={16} />
              )}

              {saving
                ? isSubject
                  ? "Creating..."
                  : isYear
                    ? "Creating..."
                    : "Uploading..."
                : isSubject
                  ? "Create Folder"
                  : isYear
                    ? "Create Year"
                    : "Upload & Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <AppShell
      role="admin"
      title="PYQ Management"
      subtitle="Previous Year Question Paper Repository"
    >
      <div className="admin-notes-page">
        <PageHeader
          eyebrow="ADMIN CONTROL CENTER"
          title={
            selectedSubject
              ? selectedSubject.subject_code
              : "Previous Year Questions"
          }
          description={
            selectedSubject
              ? selectedSubject.subject_name
              : "Manage PYQ subjects, examination years and question paper PDFs."
          }
        />

        {error && !modal && (
          <div
            className="form-error"
            style={{
              marginBottom: 18,
            }}
          >
            {error}
          </div>
        )}

        {!selectedSubject
          ? renderSubjects()
          : !selectedYear
            ? renderYears()
            : renderPapers()}

        {renderModal()}
      </div>
    </AppShell>
  );
}