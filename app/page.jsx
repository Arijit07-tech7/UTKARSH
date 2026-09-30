"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import { useEffect, useState } from "react";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Bell,
  MessageCircle,
  ShieldCheck,
  Layers3,
  Smartphone,
  CheckCircle2,
  LockKeyhole,
  Menu,
  X,
  Sparkles,
  Users,
  Flag,
  Building2,
  CircleCheck,
} from "lucide-react";

/* =========================================================
   FEATURES
========================================================= */

const features = [
  {
    icon: BookOpen,
    title: "Notes & Study Material",
    description:
      "Access organized study materials and academic PDFs from one dedicated space.",
    tone: "green",
  },
  {
    icon: ClipboardCheck,
    title: "Assignments",
    description:
      "Keep track of assignments, deadlines and academic submission status.",
    tone: "saffron",
  },
  {
    icon: CalendarDays,
    title: "Class Routine",
    description:
      "Stay updated with your daily class schedule and academic routine.",
    tone: "green",
  },
  {
    icon: Layers3,
    title: "Complete Syllabus",
    description:
      "Explore your academic syllabus and keep your semester resources organized.",
    tone: "saffron",
  },
  {
    icon: Bell,
    title: "College Notices",
    description:
      "Important academic announcements stay accessible in one place.",
    tone: "green",
  },
  {
    icon: MessageCircle,
    title: "Ask Administration",
    description:
      "Send academic queries directly through the platform.",
    tone: "saffron",
  },
  {
    icon: Sparkles,
    title: "Notifications",
    description:
      "Keep important academic updates within easy reach.",
    tone: "green",
  },
  {
    icon: ShieldCheck,
    title: "Secure Access",
    description:
      "Role-based access keeps student and administrative spaces separated.",
    tone: "saffron",
  },
];

/* =========================================================
   PROCESS
========================================================= */

const processSteps = [
  {
    number: "01",
    icon: Smartphone,
    title: "Access",
    description:
      "Use your approved student number to enter your academic space.",
  },
  {
    number: "02",
    icon: Layers3,
    title: "Explore",
    description:
      "Find notes, assignments, routine, syllabus and important notices.",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "Stay Connected",
    description:
      "Keep up with academic updates and communicate with administration.",
  },
];

/* =========================================================
   API RESPONSE
========================================================= */

async function apiJSON(res) {
  const text = await res.text();

  if (!text) {
    return {
      success: false,
      message: "Server returned an empty response.",
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: "Server returned an invalid response.",
    };
  }
}

/* =========================================================
   INDIAN FLAG
========================================================= */

function IndianFlag({ compact = false }) {
  return (
    <div
      className={`indian-flag ${
        compact ? "indian-flag-compact" : ""
      }`}
      aria-label="Indian tricolour"
      role="img"
    >
      <span className="flag-band flag-saffron" />

      <span className="flag-band flag-white">
        <span className="ashoka-chakra">
          <span className="chakra-center" />

          {Array.from({ length: 24 }).map((_, index) => (
            <i
              key={index}
              style={{
                transform: `rotate(${index * 15}deg)`,
              }}
            />
          ))}
        </span>
      </span>

      <span className="flag-band flag-green" />
    </div>
  );
}

function Splash({ done }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      done?.();
    }, 2700);

    return () => clearTimeout(timer);
  }, [done]);

  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="splash-grid" />

      <motion.div
        className="splash-orb orb-a"
        animate={{
          x: [0, 45, -25, 0],
          y: [0, -30, 25, 0],
          scale: [1, 1.12, 0.94, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="splash-orb orb-b"
        animate={{
          x: [0, -40, 25, 0],
          y: [0, 30, -25, 0],
          scale: [1, 0.92, 1.1, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="splash-orb orb-c"
        animate={{
          x: [0, 25, -30, 0],
          y: [0, 25, -20, 0],
          scale: [1, 1.06, 0.96, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="splash-center">
        <motion.div
          className="splash-identity"
          initial={{
            opacity: 0,
            y: -18,
            letterSpacing: "0.32em",
          }}
          animate={{
            opacity: 1,
            y: 0,
            letterSpacing: "0.18em",
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span className="splash-india-dot" />
          INDIA
          <span>×</span>
          ACADEMIA
        </motion.div>

        <motion.div
          className="splash-emblem"
          initial={{
            opacity: 0,
            scale: 0.65,
            rotate: -12,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          transition={{
            duration: 1,
            delay: 0.15,
            type: "spring",
            stiffness: 110,
            damping: 14,
          }}
        >
          <motion.div
            className="splash-chakra"
            animate={{ rotate: 360 }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </motion.div>

          <motion.div
            className="splash-cap"
            animate={{
              boxShadow: [
                "0 0 35px rgba(26,77,155,.14)",
                "0 0 75px rgba(26,77,155,.30)",
                "0 0 35px rgba(26,77,155,.14)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <GraduationCap size={52} strokeWidth={1.7} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.75,
            delay: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div className="splash-word">UTKARSH</div>

          <motion.div
            className="splash-hindi"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.7 }}
          >
            उत्कर्ष
          </motion.div>

          <motion.div
            className="splash-flag-line"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{
              duration: 0.7,
              delay: 0.78,
              ease: "easeOut",
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
          >
            Where India's spirit meets academic ambition.
          </motion.p>
        </motion.div>

        <motion.div
          className="splash-institute"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.65,
            delay: 1,
          }}
        >
          <strong>NARULA INSTITUTE OF TECHNOLOGY</strong>
          <span>INFORMATION TECHNOLOGY • IT-C</span>
        </motion.div>

        <motion.div
          className="splash-loading"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            delay: 1.2,
          }}
        >
          <span>Preparing your academic space</span>

          <i>
            <motion.b
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 2.15,
                delay: 1.25,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </i>
        </motion.div>
      </div>

      <motion.div
        className="splash-bottom"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 1.35,
        }}
      >
        <span>MADE FOR INDIAN ACADEMIC EXCELLENCE</span>
        <small>UTKARSH • IT-C</small>
      </motion.div>
    </motion.div>
  );
}

/* =========================================================
   LOGIN CARD
========================================================= */

function LoginCard({ initialType = "student" }) {
  const [type, setType] = useState(initialType);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  async function login() {
    setMsg("");

    const digits = phone.replace(/\D/g, "");

    if (digits.length !== 10) {
      setMsg(
        "Enter a valid 10-digit mobile number."
      );

      return;
    }

    if (type === "admin" && !password) {
      setMsg(
        "Enter your admin password."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/auth/${type}-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            type === "admin"
              ? {
                  phone: digits,
                  password,
                }
              : {
                  phone: digits,
                }
          ),
        }
      );

      const data = await apiJSON(response);

      if (!response.ok || !data.success) {
        setMsg(
          data.message || "Login failed."
        );

        return;
      }

      sessionStorage.setItem(
        type === "admin"
          ? "utkarsh_admin"
          : "utkarsh_student",
        JSON.stringify(data[type])
      );

      window.location.href =
        type === "admin"
          ? "/admin/dashboard"
          : "/student/dashboard";
    } catch (error) {
      console.error(error);

      setMsg(
        "Unable to connect to server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="login-card"
      initial={{
        opacity: 0,
        y: 20,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.65,
      }}
    >
      <div className="login-card-accent">
        <span className="saffron" />
        <span className="white" />
        <span className="green" />
      </div>

      <div className="login-card-top">
        <div className="login-icon">
          <ShieldCheck size={23} />
        </div>

        <IndianFlag compact />
      </div>

      <div className="login-title">
        <span>
          SECURE ACCESS
        </span>

        <h2>
          Enter UTKARSH
        </h2>

        <p>
          Choose your access type
          to continue to your
          academic workspace.
        </p>
      </div>

      <div className="login-tabs">
        <button
          type="button"
          className={
            type === "student"
              ? "active"
              : ""
          }
          onClick={() => {
            setType("student");
            setMsg("");
          }}
        >
          <GraduationCap size={16} />
          STUDENT
        </button>

        <button
          type="button"
          className={
            type === "admin"
              ? "active"
              : ""
          }
          onClick={() => {
            setType("admin");
            setMsg("");
          }}
        >
          <ShieldCheck size={16} />
          ADMIN
        </button>
      </div>

      <div className="login-form">
        <label htmlFor="utkarsh-phone">
          Mobile Number
        </label>

        <div className="phone-field">
          <span>
            +91
          </span>

          <input
            id="utkarsh-phone"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10)
              )
            }
            placeholder="Enter 10-digit mobile number"
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>

        {type === "admin" && (
          <>
            <label htmlFor="utkarsh-password">
              Password
            </label>

            <div className="password-field">
              <LockKeyhole size={17} />

              <input
                id="utkarsh-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </div>
          </>
        )}

        <button
          type="button"
          className="login-submit"
          disabled={loading}
          onClick={login}
        >
          <span>
            {loading
              ? "Verifying..."
              : type === "admin"
                ? "Secure Admin Login"
                : "Continue to Dashboard"}
          </span>

          <ArrowRight size={18} />
        </button>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div
            className="login-message"
            initial={{
              opacity: 0,
              height: 0,
              y: -5,
            }}
            animate={{
              opacity: 1,
              height: "auto",
              y: 0,
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="login-security">
        <ShieldCheck size={15} />

        <span>
          {type === "admin"
            ? "Protected administrative access"
            : "Only approved student numbers can access UTKARSH."}
        </span>
      </div>
    </motion.div>
  );
}

/* =========================================================
   DEVELOPER CARD
========================================================= */

function DeveloperCard({
  image,
  initials,
  name,
  role,
  description,
  className = "",
}) {
  return (
    <motion.article
      className={`developer-card ${className}`}
      whileHover={{
        y: -8,
      }}
      transition={{
        duration: 0.3,
      }}
    >
      <div className="developer-card-top">
        <span className="developer-index">
          DEVELOPER
        </span>

        <ArrowUpRight size={18} />
      </div>

      {/* =====================================================
          DEVELOPER PHOTO
          Put actual image paths here:
          /images/arijit.jpg
          /images/abir.jpg
      ===================================================== */}

      <div className="developer-photo-wrap">
        <div className="developer-photo-ring">
          <div className="developer-photo">
            {image ? (
              <img
                src={image}
                alt={name}
              />
            ) : (
              <span>
                {initials}
              </span>
            )}
          </div>
        </div>

        <div className="developer-photo-dot" />
      </div>

      <div className="developer-info">
        <span className="developer-role">
          {role}
        </span>

        <h3>
          {name}
        </h3>

        <p>
          {description}
        </p>
      </div>

      <div className="developer-bottom">
        <span>
          <CircleCheck size={15} />
          UTKARSH
        </span>

        <span>
          IT-C
        </span>
      </div>
    </motion.article>
  );
}

/* =========================================================
   AMBIENT BACKGROUND
========================================================= */

function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="ambient-background"
      aria-hidden="true"
    >
      <div className="ambient-grid" />

      <motion.div
        className="ambient-orb ambient-saffron"
        animate={
          reduceMotion
            ? {}
            : {
                x: [0, 90, -30, 0],
                y: [0, -60, 30, 0],
                scale: [1, 1.12, 0.95, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="ambient-orb ambient-green"
        animate={
          reduceMotion
            ? {}
            : {
                x: [0, -70, 30, 0],
                y: [0, 40, -50, 0],
                scale: [1, 0.9, 1.08, 1],
              }
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="ambient-orb ambient-blue"
        animate={
          reduceMotion
            ? {}
            : {
                rotate: [0, 360],
                scale: [1, 1.08, 1],
              }
        }
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <div className="ambient-tricolour-line">
        <i className="saffron" />
        <i className="white" />
        <i className="green" />
      </div>
    </div>
  );
}


/* =========================================================
   UTKARSH — FIGMA-INSPIRED PREMIUM HOME
   Existing authentication, developer components and backend
   integrations remain unchanged.
========================================================= */

function AcademicVisual() {
  const items = [
    ["Notes", "Study material"],
    ["Assignments", "Stay on track"],
    ["Routine", "Plan your day"],
    ["Notices", "Always updated"],
  ];

  return (
    <div className="utx-hero-visual">
      <div className="utx-visual-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <motion.div
        className="utx-academic-card"
        initial={{ opacity: 0, y: 30, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="utx-card-top">
          <div>
            <span className="utx-card-kicker">ACADEMIC SPACE</span>
            <strong>UTKARSH</strong>
            <small>उत्कर्ष • IT-C</small>
          </div>

          <div className="utx-card-mark">
            <GraduationCap size={21} />
          </div>
        </div>

        <div className="utx-card-rule">
          <i />
          <i />
          <i />
        </div>

        <div className="utx-card-title">
          <span>YOUR</span>
          <b>ACADEMIC<br />FUTURE.</b>
        </div>

        <div className="utx-resource-grid">
          {items.map(([title, subtitle], index) => (
            <div className={`utx-resource utx-resource-${index + 1}`} key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <b>{title}</b>
                <small>{subtitle}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="utx-card-bottom">
          <span>INFORMATION TECHNOLOGY</span>
          <strong>IT-C</strong>
        </div>
      </motion.div>

      <motion.div
        className="utx-float-card utx-float-student"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="utx-live-dot" />
        <div>
          <b>Student Access</b>
          <small>Secure academic space</small>
        </div>
      </motion.div>

      <motion.div
        className="utx-float-card utx-float-resource"
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <span className="utx-mini-icon"><BookOpen size={15} /></span>
        <div>
          <b>Resources</b>
          <small>Always within reach</small>
        </div>
      </motion.div>
    </div>
  );
}

function UtxFeatureCard({ number, icon: Icon, title, description, accent = "green" }) {
  return (
    <motion.article
      className={`utx-feature-card utx-accent-${accent}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.65 }}
      whileHover={{ y: -6 }}
    >
      <div className="utx-feature-head">
        <span>{number}</span>
        <div className="utx-feature-icon"><Icon size={20} /></div>
      </div>
      <div className="utx-feature-body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="utx-feature-arrow"><ArrowUpRight size={19} /></div>
    </motion.article>
  );
}

function UtxProcessStep({ number, title, text, icon: Icon }) {
  return (
    <motion.div
      className="utx-process-step"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
    >
      <div className="utx-process-number">{number}</div>
      <div className="utx-process-icon"><Icon size={20} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </motion.div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(false);
  const [loginType, setLoginType] = useState("student");
  const reduceMotion = useReducedMotion();

  const scroll = (id) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const openLogin = (type = "student") => {
    setLoginType(type);
    setMenu(false);
    window.setTimeout(() => {
      document.getElementById("login")?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 60);
  };

  const featureItems = [
    {
      number: "01",
      icon: BookOpen,
      title: "Notes & Study Material",
      description: "Access organized study materials and academic resources from one dedicated space.",
      accent: "saffron",
    },
    {
      number: "02",
      icon: ClipboardCheck,
      title: "Assignments",
      description: "Keep academic work, deadlines and submission-focused resources within reach.",
      accent: "green",
    },
    {
      number: "03",
      icon: CalendarDays,
      title: "Class Routine",
      description: "Stay oriented with your daily classes and the academic rhythm of IT-C.",
      accent: "saffron",
    },
    {
      number: "04",
      icon: Layers3,
      title: "Complete Syllabus",
      description: "Keep semester topics, learning material and academic planning organized.",
      accent: "green",
    },
    {
      number: "05",
      icon: Bell,
      title: "College Notices",
      description: "Important academic announcements stay accessible when you need them.",
      accent: "saffron",
    },
    {
      number: "06",
      icon: MessageCircle,
      title: "Ask Administration",
      description: "Keep academic communication closer to the workspace where you study.",
      accent: "green",
    },
  ];

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <Splash key="splash" done={() => setLoading(false)} />
      ) : (
        <motion.main
          key="home"
          className="home-page utx-new-home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55 }}
        >
          {/* NAVIGATION */}
          <header className="utx-nav">
            <button className="utx-brand" type="button" onClick={() => scroll("home")}>
              <span className="utx-brand-symbol"><GraduationCap size={20} /></span>
              <span>
                <b>UTKARSH</b>
                <small>उत्कर्ष <i>•</i> IT-C</small>
              </span>
            </button>

            <nav className="utx-nav-links" aria-label="Primary navigation">
              <button onClick={() => scroll("home")}>Home</button>
              <button onClick={() => scroll("features")}>Features</button>
              <button onClick={() => scroll("process")}>How it works</button>
              <button onClick={() => scroll("developers")}>Developers</button>
            </nav>

            <div className="utx-nav-right">
              <button className="utx-nav-login" onClick={() => openLogin("student")}>
                Login <ArrowRight size={15} />
              </button>
              <button
                className="utx-menu-button"
                onClick={() => setMenu((v) => !v)}
                aria-label="Toggle navigation"
                aria-expanded={menu}
              >
                {menu ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

            <div className={`utx-mobile-menu ${menu ? "is-open" : ""}`}>
              <div className="utx-mobile-menu-inner">
                {[
                  ["Home", "home"],
                  ["Features", "features"],
                  ["How it works", "process"],
                  ["Developers", "developers"],
                ].map(([label, id]) => (
                  <button key={id} onClick={() => scroll(id)}>
                    <span>{label}</span>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
                <button className="utx-mobile-login" onClick={() => openLogin("student")}>
                  Login <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </header>

          {/* HERO */}
          <section className="utx-hero" id="home">
            <div className="utx-hero-grid" aria-hidden="true" />
            <div className="utx-hero-glow utx-glow-saffron" aria-hidden="true" />
            <div className="utx-hero-glow utx-glow-green" aria-hidden="true" />

            <div className="utx-container utx-hero-layout">
              <div className="utx-hero-copy">
                <div className="utx-eyebrow">
                  <span className="utx-tricolor-dots"><i /><i /><i /></span>
                  INDIA × ACADEMIA
                </div>

                <h1>
                  <span className="utx-saffron">India&apos;s Spirit.</span>
                  <span>One Academic</span>
                  <em className="utx-green">Future.</em>
                </h1>

                <p>
                  A modern academic command center connecting learning,
                  resources, communication and student life in one secure platform.
                </p>

                <div className="utx-hero-actions">
                  <button className="utx-primary-btn" onClick={() => openLogin("student")}>
                    Student Access <ArrowRight size={18} />
                  </button>
                  <button className="utx-secondary-btn" onClick={() => openLogin("admin")}>
                    Admin Access <ArrowUpRight size={17} />
                  </button>
                </div>

                <div className="utx-hero-trust">
                  <span className="utx-trust-mark"><ShieldCheck size={15} /></span>
                  <span><b>Secure academic access</b> · Information Technology • IT-C</span>
                </div>
              </div>

              <AcademicVisual />
            </div>

            <div className="utx-scroll-cue">
              <span>SCROLL TO EXPLORE</span>
              <i />
            </div>
          </section>

          {/* INDIA / ACADEMIA BREAK */}
          <section className="utx-india-section">
            <div className="utx-container utx-india-layout">
              <div className="utx-india-copy">
                <span className="utx-section-label">INDIA × ACADEMIA</span>
                <h2>Built for <em>Indian academic excellence.</em></h2>
                <p>
                  A focused digital space shaped around the everyday academic
                  flow of Information Technology • IT-C.
                </p>
              </div>

              <div className="utx-india-art" aria-hidden="true">
                <div className="utx-india-ring ring-one" />
                <div className="utx-india-ring ring-two" />
                <div className="utx-india-ring ring-three" />
                <div className="utx-chakra">
                  <span />
                  {Array.from({ length: 24 }).map((_, i) => (
                    <i key={i} style={{ transform: `rotate(${i * 15}deg)` }} />
                  ))}
                </div>
                <div className="utx-india-word">INDIA</div>
              </div>
            </div>
            <div className="utx-wide-tricolor"><i /><i /><i /></div>
          </section>

          {/* FEATURES */}
          <section className="utx-section utx-features-section" id="features">
            <div className="utx-container">
              <div className="utx-section-intro">
                <div>
                  <span className="utx-section-label">ACADEMIC INTELLIGENCE</span>
                  <h2>Everything your academic<br /><em>life needs.</em></h2>
                </div>
                <p>
                  One polished workspace for the everyday academic flow
                  of Information Technology • IT-C.
                </p>
              </div>

              <div className="utx-feature-grid">
                {featureItems.map((item) => (
                  <UtxFeatureCard key={item.number} {...item} />
                ))}
              </div>
            </div>
          </section>

          {/* PRODUCT STORY */}
          <section className="utx-product-section">
            <div className="utx-container utx-product-layout">
              <div className="utx-product-copy">
                <span className="utx-section-label">ACADEMIC SPACE</span>
                <h2>Everything important,<br /><em>in one place.</em></h2>
                <p>
                  From study material to notices, UTKARSH keeps the everyday
                  academic flow connected without turning it into another complicated system.
                </p>
                <div className="utx-product-list">
                  <span><CheckCircle2 size={16} /> Focused for IT-C</span>
                  <span><CheckCircle2 size={16} /> Designed around student life</span>
                  <span><CheckCircle2 size={16} /> Secure access by role</span>
                </div>
              </div>

              <div className="utx-product-visual">
                <div className="utx-product-panel">
                  <div className="utx-panel-header">
                    <span>UTKARSH</span>
                    <small>ACADEMIC SPACE</small>
                  </div>
                  <div className="utx-panel-title">YOUR EVERYDAY<br /><b>ACADEMIC FLOW.</b></div>
                  <div className="utx-panel-stack">
                    <div><span>01</span><b>Notes & Study Material</b><ArrowUpRight size={15} /></div>
                    <div><span>02</span><b>Assignments</b><ArrowUpRight size={15} /></div>
                    <div><span>03</span><b>Class Routine</b><ArrowUpRight size={15} /></div>
                    <div><span>04</span><b>Notices</b><ArrowUpRight size={15} /></div>
                  </div>
                  <div className="utx-panel-footer">
                    <IndianFlag compact />
                    <span>INFORMATION TECHNOLOGY • IT-C</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PROCESS */}
          <section className="utx-section utx-process-section" id="process">
            <div className="utx-container">
              <div className="utx-process-heading">
                <div>
                  <span className="utx-section-label">SIMPLE & SECURE</span>
                  <h2>From your phone to<br /><em>your academic space.</em></h2>
                </div>
                <p>A simple workflow designed around your everyday academic needs.</p>
              </div>

              <div className="utx-process-grid">
                <UtxProcessStep number="01" title="ACCESS" text="Enter your approved academic space." icon={Smartphone} />
                <UtxProcessStep number="02" title="ORGANIZE" text="Find your notes, assignments and routine." icon={Layers3} />
                <UtxProcessStep number="03" title="STAY AHEAD" text="Keep up with your academic journey." icon={Sparkles} />
              </div>
            </div>
          </section>

          {/* ACCESS */}
          <section className="utx-access-section" id="login">
            <div className="utx-access-bg" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="utx-container">
              <div className="utx-access-heading">
                <span className="utx-section-label">YOUR ACADEMIC COMMAND CENTER</span>
                <h2>One secure doorway.<br /><em>Two ways in.</em></h2>
                <p>
                  Student access stays simple. Administration gets a dedicated
                  protected workspace.
                </p>
              </div>

              <div className="utx-access-grid">
                <div className="utx-access-copy">
                  <div className="utx-access-card utx-student-access">
                    <span className="utx-access-number">01</span>
                    <GraduationCap size={24} />
                    <h3>STUDENT ACCESS</h3>
                    <p>Your focused academic space for everyday learning.</p>
                    <div className="utx-access-points">
                      <span>Notes & resources</span>
                      <span>Assignments</span>
                      <span>Class routine</span>
                    </div>
                    <button onClick={() => openLogin("student")}>Enter Student Space <ArrowRight size={16} /></button>
                  </div>

                  <div className="utx-access-card utx-admin-access">
                    <span className="utx-access-number">02</span>
                    <ShieldCheck size={24} />
                    <h3>ADMIN ACCESS</h3>
                    <p>A protected workspace for academic administration.</p>
                    <div className="utx-access-points">
                      <span>Academic management</span>
                      <span>Notices & resources</span>
                      <span>Protected controls</span>
                    </div>
                    <button onClick={() => openLogin("admin")}>Enter Admin Space <ArrowRight size={16} /></button>
                  </div>
                </div>

                <div className="utx-login-shell">
                  <LoginCard initialType={loginType} />
                </div>
              </div>

              <div className="utx-security-row">
                <div><ShieldCheck size={18} /><span>Approved student access</span></div>
                <div><LockKeyhole size={18} /><span>Role-based admin controls</span></div>
                <div><CheckCircle2 size={18} /><span>Secure server-side session</span></div>
              </div>
            </div>
          </section>

          {/* MOBILE / PRODUCT MOMENT */}
          <section className="utx-mobile-section">
            <div className="utx-container utx-mobile-layout">
              <div>
                <span className="utx-section-label">BUILT FOR EVERYDAY STUDENT LIFE</span>
                <h2>Your academic space.<br /><em>Wherever you study.</em></h2>
                <p>
                  A responsive experience designed to stay clear, useful and comfortable
                  whether you are using a laptop or your phone between classes.
                </p>
              </div>

              <div className="utx-phone-wrap">
                <div className="utx-phone">
                  <div className="utx-phone-speaker" />
                  <div className="utx-phone-screen">
                    <div className="utx-phone-brand"><b>UTKARSH</b><small>IT-C</small></div>
                    <div className="utx-phone-greeting">TODAY</div>
                    <div className="utx-phone-hero">Good morning 👋<small>Everything you need, right here.</small></div>
                    <div className="utx-phone-card"><CalendarDays size={17} /><span>Class Routine</span><ArrowUpRight size={14} /></div>
                    <div className="utx-phone-card"><BookOpen size={17} /><span>Study Material</span><ArrowUpRight size={14} /></div>
                    <div className="utx-phone-card"><Bell size={17} /><span>Notices</span><ArrowUpRight size={14} /></div>
                    <div className="utx-phone-tricolor"><i /><i /><i /></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* IT-C IDENTITY */}
          <section className="utx-identity-section">
            <div className="utx-container">
              <span className="utx-section-label">MADE FOR</span>
              <h2>INFORMATION TECHNOLOGY<br /><em>• IT-C</em></h2>
              <div className="utx-identity-bottom">
                <p>Narula Institute of Technology</p>
                <div className="utx-identity-tags">
                  <span>LEARNING</span><span>TECHNOLOGY</span><span>COMMUNITY</span><span>PROGRESS</span>
                </div>
              </div>
            </div>
          </section>

          {/* DEVELOPERS */}
          <section className="utx-developers-section" id="developers">
            <div className="utx-container">
              <div className="utx-section-intro utx-dev-intro">
                <div>
                  <span className="utx-section-label">BUILT & DEVELOPED BY</span>
                  <h2>The people behind<br /><em>UTKARSH.</em></h2>
                </div>
                <p>Designed and engineered for the Information Technology • IT-C community.</p>
              </div>

              <div className="utx-developer-grid">
                <DeveloperCard
                  image="/images/arijit.jpg"
                  initials="AG"
                  name="ARIJIT GUPTA"
                  role="DEVELOPER"
                  description="Product, frontend & full-stack engineering"
                  className="developer-saffron"
                />
                <DeveloperCard
                  image="/images/abir.jpg"
                  initials="BG"
                  name="ABIR GHOSH"
                  role="DEVELOPER"
                  description="Product, backend & platform engineering"
                  className="developer-green"
                />
              </div>

              <div className="utx-developer-note">
                <span><Users size={16} /> Built with purpose for Narula Institute of Technology • IT-C</span>
                <span>INDIA</span>
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="utx-final-section">
            <div className="utx-final-orbit" aria-hidden="true">
              <span /><span /><span />
            </div>
            <div className="utx-container utx-final-inner">
              <span className="utx-section-label">UTKARSH • उत्कर्ष</span>
              <h2>Your academic journey,<br /><em>organized.</em></h2>
              <p>One platform. One academic space. Everything you need.</p>
              <button className="utx-primary-btn" onClick={() => openLogin("student")}>
                Enter UTKARSH <ArrowRight size={18} />
              </button>
              <div className="utx-final-tricolor"><i /><i /><i /></div>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="utx-footer">
            <div className="utx-container">
              <div className="utx-footer-main">
                <div className="utx-footer-brand">
                  <b>UTKARSH</b>
                  <span>उत्कर्ष • Your Academic Command Center</span>
                </div>
                <div className="utx-footer-nav">
                  <button onClick={() => scroll("home")}>Home</button>
                  <button onClick={() => scroll("features")}>Features</button>
                  <button onClick={() => scroll("process")}>How it works</button>
                  <button onClick={() => scroll("developers")}>Developers</button>
                  <button onClick={() => openLogin("student")}>Login</button>
                </div>
              </div>
              <div className="utx-footer-meta">
                <span>Narula Institute of Technology • Information Technology • IT-C</span>
                <span>INDIA</span>
              </div>
              <div className="utx-footer-bottom">
                <small>© 2026 UTKARSH</small>
                <small>ARIJIT GUPTA & ABIR GHOSH</small>
              </div>
            </div>
          </footer>
        </motion.main>
      )}
    </AnimatePresence>
  );
}
