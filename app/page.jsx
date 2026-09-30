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
   HOME PAGE
========================================================= */

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(false);

  const [loginType, setLoginType] =
    useState("student");

  const reduceMotion =
    useReducedMotion();

  /* =======================================================
     SMOOTH SCROLL
  ======================================================= */

  const scroll = (id) => {
    setMenu(false);

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  /* =======================================================
     LOGIN ACCESS
  ======================================================= */

  const openLogin = (
    type = "student"
  ) => {
    setLoginType(type);

    setMenu(false);

    setTimeout(() => {
      document
        .getElementById("login")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <Splash
          key="splash"
          done={() =>
            setLoading(false)
          }
        />
      ) : (
        <motion.div
          key="home"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.55,
          }}
          className="home-page"
        >
          <AmbientBackground />

          {/* =================================================
              NAVIGATION
          ================================================= */}
{/* =================================================
    NAVIGATION
================================================= */}

<header className="landing-nav">

  {/* LEFT — UTKARSH BRAND */}
  <div className="nav-left">

    <button
      className="brand-button"
      type="button"
      onClick={() => scroll("home")}
      aria-label="UTKARSH Home"
    >
      <span className="mini-logo">
        <span className="utkarsh-logo-icon">
          <GraduationCap size={22} strokeWidth={2.2} />
        </span>
      </span>

      <span className="brand-copy">
        <b>UTKARSH</b>

        <small>
          उत्कर्ष
          <i>•</i>
          IT-C
        </small>
      </span>
    </button>

  </div>


  {/* CENTER — NAVIGATION */}
  <nav className="desktop-nav">

    <button
      type="button"
      onClick={() => scroll("home")}
    >
      Home
    </button>

    <button
      type="button"
      onClick={() => scroll("features")}
    >
      Features
    </button>

    <button
      type="button"
      onClick={() => scroll("process")}
    >
      How it works
    </button>

    <button
      type="button"
      onClick={() => scroll("developers")}
    >
      Developers
    </button>

  </nav>


  {/* RIGHT — LOGIN + MOBILE MENU */}
  <div className="nav-actions">

    <button
      className="nav-login"
      type="button"
      onClick={() => openLogin("student")}
      aria-label="Student Login"
    >
      <span>Login</span>
      <ArrowRight
        size={17}
        strokeWidth={2.4}
      />
    </button>

    <button
      className="menu-button"
      type="button"
      onClick={() => setMenu(!menu)}
      aria-label="Toggle menu"
      aria-expanded={menu}
    >
      {menu ? <X /> : <Menu />}
    </button>

  </div>

</header>

          {/* =================================================
              MOBILE NAVIGATION
          ================================================= */}

          <AnimatePresence>
            {menu && (
              <motion.div
                className="mobile-nav"
                initial={{
                  opacity: 0,
                  y: -12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    scroll("home")
                  }
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scroll("features")
                  }
                >
                  Features
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scroll("process")
                  }
                >
                  How it works
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scroll("developers")
                  }
                >
                  Developers
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openLogin("student")
                  }
                >
                  Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =================================================
              HERO
          ================================================= */}

          <section
            className="landing-hero"
            id="home"
          >
            <div className="hero-noise" />

            <motion.div
              className="hero-glow h1"
              animate={
                reduceMotion
                  ? {}
                  : {
                      x: [0, 30, -20, 0],
                      y: [0, -20, 30, 0],
                    }
              }
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="hero-glow h2"
              animate={
                reduceMotion
                  ? {}
                  : {
                      x: [0, -30, 20, 0],
                      y: [0, 20, -25, 0],
                    }
              }
              transition={{
                duration: 17,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <div className="hero-flag-line">
              <span className="saffron" />
              <span className="white" />
              <span className="green" />
            </div>

            <div className="hero-inner">
              {/* HERO COPY */}

              <motion.div
                className="hero-copy"
                initial={{
                  opacity: 0,
                  x: -30,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.15,
                }}
              >
                <div className="hero-india-badge">
                  <IndianFlag compact />

                  <span>
                    <b>
                      INDIA × ACADEMIA
                    </b>

                    <small>
                      UTKARSH • IT-C
                    </small>
                  </span>
                </div>

                <span className="eyebrow">
                  <i />
                  NARULA INSTITUTE OF TECHNOLOGY
                </span>

                <h1>
                  India's Spirit.
                  <br />

                  <em className="hero-gradient-words">
                    <span className="hero-word hero-word-one">
                      One
                    </span>{" "}
                    <span className="hero-word hero-word-academic">
                      Academic
                    </span>{" "}
                    <span className="hero-word hero-word-future">
                      Future.
                    </span>
                  </em>
                </h1>

                <p>
                  A modern academic command
                  center connecting learning,
                  resources, communication and
                  student life in one secure
                  platform.
                </p>

                <div className="hero-actions">
                  <button
                    className="gradient-btn"
                    type="button"
                    onClick={() =>
                      openLogin("student")
                    }
                  >
                    <GraduationCap
                      size={18}
                    />

                    Student Access

                    <ArrowRight
                      size={18}
                    />
                  </button>

                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() =>
                      openLogin("admin")
                    }
                  >
                    <ShieldCheck
                      size={17}
                    />

                    Admin Access

                    <ArrowUpRight
                      size={17}
                    />
                  </button>
                </div>

                <div className="hero-trust">
                  <span className="trust-icon">
                    <ShieldCheck
                      size={15}
                    />
                  </span>

                  <span>
                    Secure academic access
                  </span>

                  <i />

                  <span>
                    Information Technology
                    {" • "}
                    IT-C
                  </span>
                </div>

                <div className="hero-mini-india">
                  <IndianFlag />

                  <span>
                    Built for
                    <b>
                      {" "}
                      Indian academic excellence.
                    </b>
                  </span>
                </div>
              </motion.div>

              {/* =================================================
                  PRODUCT PREVIEW
              ================================================= */}

              <motion.div
                className="hero-preview"
                initial={{
                  opacity: 0,
                  x: 35,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.9,
                  delay: 0.25,
                }}
              >
                <div className="preview-glow" />

                <div className="preview-window">
                  <div className="preview-bar">
                    <div className="preview-dots">
                      <span />
                      <span />
                      <span />
                    </div>

                    <b>
                      UTKARSH Command Center
                    </b>

                    <IndianFlag compact />
                  </div>

                  <div className="preview-body">
                    <aside>
                      <div className="preview-brand">
                        <span>
                          <GraduationCap
                            size={17}
                          />
                        </span>

                        <strong>
                          UTKARSH
                        </strong>
                      </div>

                      <small>
                        ACADEMIC SPACE
                      </small>

                      <i className="active">
                        <Layers3 size={14} />
                        Dashboard
                      </i>

                      <i>
                        <BookOpen size={14} />
                        Notes
                      </i>

                      <i>
                        <ClipboardCheck
                          size={14}
                        />
                        Assignments
                      </i>

                      <i>
                        <CalendarDays
                          size={14}
                        />
                        Routine
                      </i>

                      <i>
                        <Bell size={14} />
                        Notices
                      </i>

                      <div className="preview-aside-bottom">
                        <ShieldCheck
                          size={13}
                        />

                        Secure
                      </div>
                    </aside>

                    <div className="preview-main">
                      <div className="preview-topline">
                        <span>
                          STUDENT SPACE
                        </span>

                        <span className="preview-live">
                          <i />
                          LIVE
                        </span>
                      </div>

                      <div className="preview-welcome">
                        <div>
                          <small>
                            YOUR ACADEMIC DASHBOARD
                          </small>

                          <h3>
                            Good morning{" "}
                            <span>
                              👋
                            </span>
                          </h3>

                          <p>
                            Everything you
                            need, right where
                            you need it.
                          </p>
                        </div>

                        <div className="preview-avatar">
                          <GraduationCap
                            size={21}
                          />
                        </div>
                      </div>

                      <div className="preview-stats">
                        <div>
                          <span>
                            <BookOpen />
                          </span>

                          <b>
                            Notes
                          </b>

                          <strong>
                            —
                          </strong>
                        </div>

                        <div>
                          <span>
                            <ClipboardCheck />
                          </span>

                          <b>
                            Assignments
                          </b>

                          <strong>
                            —
                          </strong>
                        </div>

                        <div>
                          <span>
                            <CalendarDays />
                          </span>

                          <b>
                            Classes
                          </b>

                          <strong>
                            —
                          </strong>
                        </div>
                      </div>

                      <div className="preview-section-title">
                        <span>
                          QUICK ACCESS
                        </span>

                        <ArrowUpRight
                          size={13}
                        />
                      </div>

                      <div className="preview-grid">
                        {features
                          .slice(0, 4)
                          .map(
                            ({
                              icon: Icon,
                              title,
                              tone,
                            }) => (
                              <div
                                key={title}
                                className={`p-card ${tone}`}
                              >
                                <Icon
                                  size={18}
                                />

                                <span>
                                  {title}
                                </span>

                                <ArrowUpRight
                                  size={13}
                                />
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="float-card fc1"
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          y: [0, -8, 0],
                        }
                  }
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <CheckCircle2
                    size={17}
                  />

                  <span>
                    <small>
                      ASSIGNMENTS
                    </small>

                    <b>
                      Stay on track
                    </b>
                  </span>
                </motion.div>

                <motion.div
                  className="float-card fc2"
                  animate={
                    reduceMotion
                      ? {}
                      : {
                          y: [0, 8, 0],
                        }
                  }
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Bell size={17} />

                  <span>
                    <small>
                      NOTICES
                    </small>

                    <b>
                      Always updated
                    </b>
                  </span>
                </motion.div>

                <div className="preview-chakra">
                  <div className="chakra">
                    <span />

                    {Array.from({
                      length: 24,
                    }).map(
                      (_, index) => (
                        <i
                          key={index}
                          style={{
                            transform: `translate(-50%, -100%) rotate(${index * 15}deg)`,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="hero-scroll">
              <span>
                SCROLL TO EXPLORE
              </span>

              <i />
            </div>
          </section>

          {/* =================================================
              INDIA STRIP
          ================================================= */}

          <section className="india-strip">
            <div className="india-strip-inner">
              <div className="india-strip-flag">
                <IndianFlag />
              </div>

              <div>
                <small>
                  UTKARSH
                </small>

                <strong>
                  A focused academic
                  experience for IT-C.
                </strong>
              </div>

              <div className="india-strip-items">
                <span>
                  <GraduationCap
                    size={16}
                  />
                  STUDENTS
                </span>

                <span>
                  <Building2
                    size={16}
                  />
                  ACADEMICS
                </span>

                <span>
                  <ShieldCheck
                    size={16}
                  />
                  SECURITY
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              FEATURES
          ================================================= */}

          <section
            className="feature-section"
            id="features"
          >
            <div className="section-head">
              <div>
                <span className="eyebrow">
                  ACADEMIC INTELLIGENCE
                </span>

                <h2>
                  Everything your
                  academic
                  <br />
                  life needs.
                </h2>
              </div>

              <p>
                One polished workspace
                for the everyday
                academic flow of
                Information Technology
                {" • "}
                IT-C.
              </p>
            </div>

            <div className="feature-grid">
              {features.map(
                (
                  {
                    icon: Icon,
                    title,
                    description,
                    tone,
                  },
                  index
                ) => (
                  <motion.article
                    key={title}
                    className={`feature-card ${tone}`}
                    initial={{
                      opacity: 0,
                      y: 25,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    whileHover={{
                      y: -7,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.12,
                    }}
                    transition={{
                      duration: 0.45,
                      delay:
                        index * 0.045,
                    }}
                  >
                    <div className="feature-card-top">
                      <div className="feature-number">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </div>

                      <ArrowUpRight
                        className="feature-arrow"
                        size={18}
                      />
                    </div>

                    <div className="feature-icon">
                      <Icon size={23} />
                    </div>

                    <h3>
                      {title}
                    </h3>

                    <p>
                      {description}
                    </p>

                    <div className="feature-card-line" />
                  </motion.article>
                )
              )}
            </div>
          </section>

          {/* =================================================
              PROCESS
          ================================================= */}

          <section
            className="process-section"
            id="process"
          >
            <div className="process-decor">
              <IndianFlag />
            </div>

            <div className="center-head">
              <span className="eyebrow">
                SIMPLE & SECURE
              </span>

              <h2>
                From your phone to
                <br />
                your academic space.
              </h2>

              <p>
                A simple workflow
                designed around your
                everyday academic needs.
              </p>
            </div>

            <div className="process-grid">
              {processSteps.map(
                (
                  {
                    number,
                    icon: Icon,
                    title,
                    description,
                  },
                  index
                ) => (
                  <motion.article
                    key={number}
                    initial={{
                      opacity: 0,
                      y: 25,
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
                      duration: 0.5,
                      delay:
                        index * 0.1,
                    }}
                  >
                    <div className="process-number">
                      {number}
                    </div>

                    <div className="process-icon">
                      <Icon size={22} />
                    </div>

                    <h3>
                      {title}
                    </h3>

                    <p>
                      {description}
                    </p>

                    {index <
                      processSteps.length -
                        1 && (
                      <ArrowRight className="process-arrow" />
                    )}
                  </motion.article>
                )
              )}
            </div>
          </section>

          {/* =================================================
              LOGIN / ACCESS
          ================================================= */}

          <section
            className="access-section"
            id="login"
          >
            <div className="access-copy">
              <div className="access-india-mark">
                <IndianFlag />
              </div>

              <span className="eyebrow">
                YOUR ACADEMIC COMMAND CENTER
              </span>

              <h2>
                One secure doorway.
                <br />

                <em>
                  Two ways in.
                </em>
              </h2>

              <p>
                Student access stays
                simple. Administration
                gets a dedicated protected
                workspace.
              </p>

              <div className="access-points">
                <span>
                  <CheckCircle2 />
                  Approved student access
                </span>

                <span>
                  <CheckCircle2 />
                  Role-based admin controls
                </span>

                <span>
                  <CheckCircle2 />
                  Secure server-side session
                </span>

                <span>
                  <CheckCircle2 />
                  Academic resources in one place
                </span>
              </div>

              <div className="access-note">
                <LockKeyhole size={16} />

                <span>
                  Your credentials are
                  processed through the
                  existing secure UTKARSH
                  authentication system.
                </span>
              </div>
            </div>

            <LoginCard
              initialType={loginType}
            />
          </section>

          {/* =================================================
              DEVELOPERS
          ================================================= */}

          <section
            className="developers"
            id="developers"
          >
            <div className="developer-background">
              <IndianFlag />
            </div>

            <div className="center-head">
              <span className="eyebrow">
                BUILT & DEVELOPED BY
              </span>

              <h2>
                The people behind
                <br />

                <em>
                  UTKARSH.
                </em>
              </h2>

              <p>
                Designed and engineered
                for the Information
                Technology
                {" • "}
                IT-C community.
              </p>
            </div>

            <div className="developer-grid">
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

            <div className="developer-note">
              <div>
                <Users size={18} />

                <span>
                  Built with purpose for
                  Narula Institute of
                  Technology
                  {" • "}
                  IT-C
                </span>
              </div>

              <IndianFlag compact />
            </div>
          </section>

          {/* =================================================
              FINAL CTA
          ================================================= */}

          <section className="final-cta">
            <div className="final-cta-flag">
              <IndianFlag />
            </div>

            <span className="eyebrow">
              UTKARSH
              {" • "}
              उत्कर्ष
            </span>

            <h2>
              Your academic journey,
              <br />

              <em>
                organized.
              </em>
            </h2>

            <p>
              One platform. One academic
              space. Everything you need.
            </p>

            <button
              type="button"
              className="gradient-btn"
              onClick={() =>
                openLogin("student")
              }
            >
              Enter UTKARSH
              <ArrowRight size={18} />
            </button>
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="landing-footer">
            <div className="footer-brand">
              <div className="footer-brand-mark">
                <IndianFlag compact />
              </div>

              <div>
                <strong>
                  UTKARSH
                </strong>

                <span>
                  उत्कर्ष
                  {" • "}
                  Your Academic
                  Command Center
                </span>
              </div>
            </div>

            <div className="footer-middle">
              <p>
                Narula Institute of
                Technology
                <span>•</span>
                Information Technology
                <span>•</span>
                IT-C
              </p>

              <div className="footer-india">
                <Flag size={14} />
                <span>
                  INDIA
                </span>
              </div>
            </div>

            <div className="footer-bottom">
              <small>
                © 2026 UTKARSH
              </small>

              <small>
                ARIJIT GUPTA
                {" & "}
                ABIR GHOSH
              </small>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}