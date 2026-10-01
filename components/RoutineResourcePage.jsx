"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutGrid,
  List,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  X,
  BookOpen,
} from "lucide-react";

import AppShell from "@/components/AppShell";

/* =========================================================
   CONSTANTS
========================================================= */

const WEEKDAYS = [
  { key: "monday", name: "Monday", short: "Mon" },
  { key: "tuesday", name: "Tuesday", short: "Tue" },
  { key: "wednesday", name: "Wednesday", short: "Wed" },
  { key: "thursday", name: "Thursday", short: "Thu" },
  { key: "friday", name: "Friday", short: "Fri" },
  { key: "saturday", name: "Saturday", short: "Sat" },
  { key: "sunday", name: "Sunday", short: "Sun" },
];

const DAY_ALIASES = {
  mon: "monday",
  monday: "monday",
  tue: "tuesday",
  tues: "tuesday",
  tuesday: "tuesday",
  wed: "wednesday",
  wednesday: "wednesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thursday: "thursday",
  fri: "friday",
  friday: "friday",
  sat: "saturday",
  saturday: "saturday",
  sun: "sunday",
  sunday: "sunday",
};

/* =========================================================
   BASIC ROUTINE HELPERS
========================================================= */

function getRoutineDay(record) {
  const raw = String(
    record?.day ||
      record?.weekday ||
      record?.day_name ||
      record?.day_of_week ||
      ""
  )
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

  return DAY_ALIASES[raw] || raw;
}

function getRoutineSubject(record) {
  const subject =
    record?.subject ||
    record?.subject_name ||
    record?.class ||
    record?.course ||
    record?.title;

  if (typeof subject === "string") {
    return subject;
  }

  if (subject && typeof subject === "object") {
    return (
      subject?.subject_name ||
      subject?.name ||
      subject?.title ||
      "Class"
    );
  }

  return "Class";
}

function getRoutineRoom(record) {
  return (
    record?.room ||
    record?.room_no ||
    record?.location ||
    record?.classroom ||
    ""
  );
}

function isBreakRecord(record) {
  const text = [
    record?.type,
    record?.class_type,
    record?.category,
    getRoutineSubject(record),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(lunch|break|recess)\b/.test(text);
}

function getBreakLabel(record) {
  const text = [
    record?.type,
    record?.class_type,
    record?.category,
    getRoutineSubject(record),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes("lunch")
    ? "Lunch Break"
    : "Break";
}

function isLabClass(record) {
  const text = [
    record?.type,
    record?.class_type,
    record?.category,
    getRoutineSubject(record),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("lab") ||
    text.includes("practical")
  );
}

/* =========================================================
   TIME PARSING

   Handles examples such as:
   9.00-9.40
   9:00 AM - 9:40 AM
   1.00-3.00 PM
   12.20-1.00 PM
   09:00:00 - 09:40:00

   If AM/PM is omitted, the parser selects a plausible
   daytime interpretation. It never creates new class times.
========================================================= */

function extractTimeTokens(value) {
  if (value === null || value === undefined) {
    return [];
  }

  const text = String(value).replace(
    /(\d{1,2}[:.]\d{2}):\d{2}/g,
    "$1"
  );

  const matches = [
    ...text.matchAll(
      /(\d{1,2})\s*[:.]\s*(\d{2})\s*(AM|PM)?/gi
    ),
  ];

  return matches
    .map((match) => ({
      hour: Number(match[1]),
      minute: Number(match[2]),
      meridiem: match[3]
        ? match[3].toUpperCase()
        : "",
      raw: match[0],
    }))
    .filter(
      (token) =>
        token.hour >= 0 &&
        token.hour <= 23 &&
        token.minute >= 0 &&
        token.minute <= 59
    );
}

function tokenCandidates(token) {
  if (!token) return [];

  const {
    hour,
    minute,
    meridiem,
  } = token;

  if (meridiem === "AM") {
    return [
      {
        minutes: (hour % 12) * 60 + minute,
        meridiem: "AM",
      },
    ];
  }

  if (meridiem === "PM") {
    return [
      {
        minutes: ((hour % 12) + 12) * 60 + minute,
        meridiem: "PM",
      },
    ];
  }

  if (hour === 0 || hour > 12) {
    return [
      {
        minutes: hour * 60 + minute,
        meridiem: "",
      },
    ];
  }

  if (hour === 12) {
    return [
      {
        minutes: 12 * 60 + minute,
        meridiem: "PM",
      },
      {
        minutes: minute,
        meridiem: "AM",
      },
    ];
  }

  return [
    {
      minutes: hour * 60 + minute,
      meridiem: "AM",
    },
    {
      minutes: (hour + 12) * 60 + minute,
      meridiem: "PM",
    },
  ];
}

function candidatePreference(token, candidate) {
  if (!token || token.meridiem) {
    return 0;
  }

  const hour = token.hour;

  if (hour >= 1 && hour <= 7) {
    return candidate.meridiem === "PM" ? 5 : -3;
  }

  if (hour >= 8 && hour <= 11) {
    return candidate.meridiem === "AM" ? 5 : -3;
  }

  if (hour === 12) {
    return candidate.meridiem === "PM" ? 5 : -4;
  }

  return 0;
}

function scoreTimePair(startToken, endToken, start, end) {
  if (end.minutes <= start.minutes) {
    return -10000;
  }

  const duration = end.minutes - start.minutes;

  if (duration > 480) {
    return -5000;
  }

  let score = 0;

  score += candidatePreference(startToken, start);
  score += candidatePreference(endToken, end);

  if (
    start.minutes >= 7 * 60 &&
    start.minutes < 20 * 60
  ) {
    score += 10;
  } else {
    score -= 8;
  }

  if (
    end.minutes > 7 * 60 &&
    end.minutes <= 21 * 60
  ) {
    score += 4;
  } else {
    score -= 3;
  }

  if (duration >= 20 && duration <= 180) {
    score += 5;
  } else if (duration <= 240) {
    score += 2;
  } else {
    score -= 4;
  }

  return score;
}

function chooseTimePair(startToken, endToken) {
  if (!startToken || !endToken) {
    return {
      start: null,
      end: null,
    };
  }

  const starts = tokenCandidates(startToken);
  const ends = tokenCandidates(endToken);

  let best = null;
  let bestScore = -Infinity;

  for (const start of starts) {
    for (const end of ends) {
      const score = scoreTimePair(
        startToken,
        endToken,
        start,
        end
      );

      if (score > bestScore) {
        bestScore = score;
        best = {
          start: start.minutes,
          end: end.minutes,
        };
      }
    }
  }

  return (
    best || {
      start: null,
      end: null,
    }
  );
}

function chooseSingleTime(token) {
  if (!token) return null;

  const candidates = tokenCandidates(token);

  if (candidates.length === 1) {
    return candidates[0].minutes;
  }

  let best = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    let score = candidatePreference(
      token,
      candidate
    );

    if (
      candidate.minutes >= 7 * 60 &&
      candidate.minutes <= 20 * 60
    ) {
      score += 10;
    } else {
      score -= 8;
    }

    if (score > bestScore) {
      bestScore = score;
      best = candidate.minutes;
    }
  }

  return best;
}

function getRawRoutineTime(record) {
  const start =
    record?.start_time ||
    record?.start ||
    record?.from_time ||
    "";

  const end =
    record?.end_time ||
    record?.end ||
    record?.to_time ||
    "";

  if (start && end) {
    return `${start} - ${end}`;
  }

  return (
    record?.time ||
    record?.class_time ||
    record?.timing ||
    record?.schedule_time ||
    record?.period_label ||
    record?.period ||
    start ||
    ""
  );
}

function getTimePair(record) {
  const startRaw =
    record?.start_time ||
    record?.start ||
    record?.from_time ||
    "";

  const endRaw =
    record?.end_time ||
    record?.end ||
    record?.to_time ||
    "";

  if (startRaw && endRaw) {
    const startToken =
      extractTimeTokens(startRaw)[0];

    const endToken =
      extractTimeTokens(endRaw)[0];

    return chooseTimePair(
      startToken,
      endToken
    );
  }

  const tokens = extractTimeTokens(
    getRawRoutineTime(record)
  );

  if (tokens.length >= 2) {
    return chooseTimePair(
      tokens[0],
      tokens[1]
    );
  }

  if (tokens.length === 1) {
    return {
      start: chooseSingleTime(tokens[0]),
      end: null,
    };
  }

  return {
    start: null,
    end: null,
  };
}

function getRoutineStartMinutes(record) {
  return getTimePair(record).start;
}

function getRoutineEndMinutes(record) {
  return getTimePair(record).end;
}

function formatMinutes(minutes) {
  if (
    minutes === null ||
    minutes === undefined ||
    !Number.isFinite(minutes)
  ) {
    return "";
  }

  const normalized =
    ((minutes % 1440) + 1440) % 1440;

  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${String(displayHours).padStart(
    2,
    "0"
  )}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function getRoutineTimeLabel(record) {
  const { start, end } = getTimePair(record);

  if (start !== null && end !== null) {
    return `${formatMinutes(start)} – ${formatMinutes(end)}`;
  }

  if (start !== null) {
    return formatMinutes(start);
  }

  return getRawRoutineTime(record) || "Time not set";
}

function sortByStartTime(a, b) {
  const aTime = getRoutineStartMinutes(a);
  const bTime = getRoutineStartMinutes(b);

  if (aTime === null && bTime === null) return 0;
  if (aTime === null) return 1;
  if (bTime === null) return -1;

  return aTime - bTime;
}

/* =========================================================
   INDIA DATE / CLOCK HELPERS
========================================================= */

function getIndiaWeekday(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  })
    .format(date)
    .toLowerCase();
}

function getIndiaDateOnly(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  const day = Number(
    parts.find((part) => part.type === "day")?.value
  );

  return new Date(
    Date.UTC(year, month - 1, day)
  );
}

function getWeekDate(baseDate, weekOffset, dayIndex) {
  if (!baseDate) return null;

  const date = new Date(baseDate);
  const mondayOffset =
    (date.getUTCDay() + 6) % 7;

  date.setUTCDate(
    date.getUTCDate() -
      mondayOffset +
      weekOffset * 7 +
      dayIndex
  );

  return date;
}

function getDateKey(date) {
  if (!date) return "";

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatRoutineDate(
  date,
  includeYear = false
) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date);
}

function formatWeekRange(baseDate, weekOffset) {
  if (!baseDate) {
    return "Loading week...";
  }

  const firstDay = getWeekDate(
    baseDate,
    weekOffset,
    0
  );

  const lastDay = getWeekDate(
    baseDate,
    weekOffset,
    6
  );

  const sameMonth =
    firstDay.getUTCMonth() ===
    lastDay.getUTCMonth();

  const sameYear =
    firstDay.getUTCFullYear() ===
    lastDay.getUTCFullYear();

  if (sameMonth && sameYear) {
    return `${formatRoutineDate(
      firstDay
    )} – ${formatRoutineDate(
      lastDay,
      true
    )}`;
  }

  return `${formatRoutineDate(
    firstDay,
    true
  )} – ${formatRoutineDate(
    lastDay,
    true
  )}`;
}

function getIndiaCurrentMinutes(date) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hours = Number(
    parts.find((part) => part.type === "hour")?.value
  );

  const minutes = Number(
    parts.find((part) => part.type === "minute")?.value
  );

  return hours * 60 + minutes;
}

function formatIndiaLiveTime(date) {
  if (!date) return "Syncing live clock";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatTimeUntil(minutes) {
  if (
    minutes === null ||
    minutes === undefined
  ) {
    return "";
  }

  if (minutes <= 0) {
    return "Starting now";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m away`;
  }

  if (hours > 0) {
    return `${hours}h away`;
  }

  return `${remainingMinutes}m away`;
}

/* =========================================================
   LIVE STATUS

   Statuses use the selected date and actual IST clock:
   - Not Started
   - In Progress
   - Break / Lunch Break (if present or between classes)
   - Ended
   - Scheduled (when timing data is missing)
========================================================= */

function getRoutineStatus(
  record,
  selectedDate,
  todayDate,
  now
) {
  const start = getRoutineStartMinutes(record);
  const end = getRoutineEndMinutes(record);

  if (!selectedDate || !todayDate) {
    return {
      label: "Scheduled",
      tone: "scheduled",
      state: "scheduled",
    };
  }

  const selectedKey = getDateKey(selectedDate);
  const todayKey = getDateKey(todayDate);

  if (selectedKey < todayKey) {
    return {
      label: "Ended",
      tone: "ended",
      state: "ended",
    };
  }

  if (selectedKey > todayKey) {
    return {
      label: "Not Started",
      tone: "upcoming",
      state: "upcoming",
    };
  }

  if (!now || start === null || end === null) {
    return {
      label: "Scheduled",
      tone: "scheduled",
      state: "scheduled",
    };
  }

  const currentMinutes = getIndiaCurrentMinutes(now);

  if (currentMinutes < start) {
    return {
      label: "Not Started",
      tone: "upcoming",
      state: "upcoming",
    };
  }

  if (currentMinutes >= end) {
    return {
      label: "Ended",
      tone: "ended",
      state: "ended",
    };
  }

  if (isBreakRecord(record)) {
    const label = getBreakLabel(record);

    return {
      label,
      tone: "break",
      state: "break",
    };
  }

  return {
    label: "In Progress",
    tone: "current",
    state: "current",
  };
}

function getLiveScheduleState(
  records,
  now,
  todayKey,
  todayMinutes
) {
  if (!now) {
    return {
      kind: "loading",
      record: null,
      remaining: null,
      message: "",
    };
  }

  const todaysRecords = records
    .filter(
      (record) =>
        getRoutineDay(record) === todayKey
    )
    .sort(sortByStartTime);

  if (todaysRecords.length === 0) {
    return {
      kind: "none",
      record: null,
      remaining: null,
      message: "No classes are listed for today.",
    };
  }

  const activeTimedEntry = todaysRecords.find(
    (record) => {
      const start = getRoutineStartMinutes(record);
      const end = getRoutineEndMinutes(record);

      return (
        start !== null &&
        end !== null &&
        todayMinutes >= start &&
        todayMinutes < end
      );
    }
  );

  if (activeTimedEntry) {
    if (isBreakRecord(activeTimedEntry)) {
      return {
        kind: "break",
        record: activeTimedEntry,
        remaining:
          getRoutineEndMinutes(activeTimedEntry) -
          todayMinutes,
        message: getRoutineTimeLabel(
          activeTimedEntry
        ),
      };
    }

    return {
      kind: "current",
      record: activeTimedEntry,
      remaining:
        getRoutineEndMinutes(activeTimedEntry) -
        todayMinutes,
      message: getRoutineTimeLabel(
        activeTimedEntry
      ),
    };
  }

  const classes = todaysRecords.filter(
    (record) => !isBreakRecord(record)
  );

  const timedClasses = classes
    .filter(
      (record) =>
        getRoutineStartMinutes(record) !== null &&
        getRoutineEndMinutes(record) !== null
    )
    .sort(sortByStartTime);

  const nextClass = timedClasses.find(
    (record) =>
      getRoutineStartMinutes(record) > todayMinutes
  );

  const previousClass = timedClasses
    .filter(
      (record) =>
        getRoutineEndMinutes(record) <= todayMinutes
    )
    .sort(
      (a, b) =>
        getRoutineEndMinutes(b) -
        getRoutineEndMinutes(a)
    )[0];

  // Detect a real timetable gap between a completed class
  // and the next scheduled class. This does not insert a
  // fake class or alter the timetable.
  if (previousClass && nextClass) {
    const previousEnd =
      getRoutineEndMinutes(previousClass);

    const nextStart =
      getRoutineStartMinutes(nextClass);

    if (
      previousEnd !== null &&
      nextStart !== null &&
      todayMinutes >= previousEnd &&
      todayMinutes < nextStart &&
      nextStart - previousEnd >= 10
    ) {
      const gapOverlapsLunch =
        previousEnd < 14 * 60 &&
        nextStart > 12 * 60;

      return {
        kind: gapOverlapsLunch ? "lunch" : "break",
        record: null,
        remaining: nextStart - todayMinutes,
        message: `Next class: ${getRoutineSubject(
          nextClass
        )} · ${getRoutineTimeLabel(nextClass)}`,
      };
    }
  }

  if (nextClass) {
    return {
      kind: "not-started",
      record: nextClass,
      remaining:
        getRoutineStartMinutes(nextClass) -
        todayMinutes,
      message: `${getRoutineTimeLabel(
        nextClass
      )}${
        getRoutineRoom(nextClass)
          ? ` · ${getRoutineRoom(nextClass)}`
          : ""
      }`,
    };
  }

  if (classes.length > 0 && timedClasses.length === 0) {
    return {
      kind: "unknown",
      record: null,
      remaining: null,
      message: "Class timing is not available in the routine data.",
    };
  }

  const hasUntimedClasses = classes.some(
    (record) =>
      getRoutineStartMinutes(record) === null ||
      getRoutineEndMinutes(record) === null
  );

  if (hasUntimedClasses) {
    return {
      kind: "unknown",
      record: null,
      remaining: null,
      message: "Some class timings are unavailable.",
    };
  }

  return {
    kind: "ended",
    record: null,
    remaining: null,
    message: "All scheduled classes for today have ended.",
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RoutineResourcePage() {
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [view, setView] = useState("schedule");
  const [selectedDay, setSelectedDay] = useState("monday");
  const [weekOffset, setWeekOffset] = useState(0);

  // Initialize after mount to avoid server/client date mismatch.
  const [now, setNow] = useState(null);
  const [calendarToday, setCalendarToday] = useState(null);

  /* =======================================================
     API
========================================================= */

  const loadRoutine = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          "/api/data?resource=routine",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
              result?.error ||
              "Could not load the class routine."
          );
        }

        setRoutine(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (err) {
        console.error("RoutineResourcePage:", err);

        setRoutine([]);

        setError(
          err?.message ||
            "Unable to load the class routine. Please try again."
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadRoutine();
  }, [loadRoutine]);

  /* =======================================================
     IST CLOCK - REFRESH EVERY 30 SECONDS
========================================================= */

  useEffect(() => {
    let previousDateKey = "";

    const updateClock = () => {
      const current = new Date();
      const indiaDate = getIndiaDateOnly(current);
      const dateKey = getDateKey(indiaDate);

      setNow(current);
      setCalendarToday(indiaDate);

      if (dateKey !== previousDateKey) {
        previousDateKey = dateKey;
        setSelectedDay(
          getIndiaWeekday(current)
        );
      }
    };

    updateClock();

    const timer = window.setInterval(
      updateClock,
      30 * 1000
    );

    return () => window.clearInterval(timer);
  }, []);

  /* =======================================================
     REFRESH
========================================================= */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await loadRoutine({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadRoutine]);

  /* =======================================================
     SEARCH / SORT / GROUP
========================================================= */

  const normalizedSearch = search.trim().toLowerCase();

  const filteredRoutine = useMemo(() => {
    const filtered = routine.filter((record) => {
      if (!normalizedSearch) {
        return true;
      }

      return JSON.stringify(record)
        .toLowerCase()
        .includes(normalizedSearch);
    });

    return [...filtered].sort(sortByStartTime);
  }, [routine, normalizedSearch]);

  const routineByDay = useMemo(() => {
    const grouped = Object.fromEntries(
      WEEKDAYS.map((day) => [day.key, []])
    );

    filteredRoutine.forEach((record) => {
      const day = getRoutineDay(record);

      if (grouped[day]) {
        grouped[day].push(record);
      }
    });

    Object.values(grouped).forEach((records) => {
      records.sort(sortByStartTime);
    });

    return grouped;
  }, [filteredRoutine]);

  const todayKey = now
    ? getIndiaWeekday(now)
    : "";

  const todayMinutes = now
    ? getIndiaCurrentMinutes(now)
    : null;

  const liveSchedule = useMemo(
    () =>
      getLiveScheduleState(
        routine,
        now,
        todayKey,
        todayMinutes
      ),
    [
      routine,
      now,
      todayKey,
      todayMinutes,
    ]
  );

  const activeDay =
    selectedDay || "monday";

  const activeDayDetails =
    WEEKDAYS.find(
      (day) => day.key === activeDay
    ) || WEEKDAYS[0];

  const selectedDayIndex = Math.max(
    0,
    WEEKDAYS.findIndex(
      (day) => day.key === activeDay
    )
  );

  const selectedDayDate = getWeekDate(
    calendarToday,
    weekOffset,
    selectedDayIndex
  );

  const selectedDayRecords =
    routineByDay[activeDay] || [];

  const getRecordStatus = useCallback(
    (record) =>
      getRoutineStatus(
        record,
        selectedDayDate,
        calendarToday,
        now
      ),
    [
      selectedDayDate,
      calendarToday,
      now,
    ]
  );

  /* =======================================================
     NAVIGATION
========================================================= */

  const goToCurrentWeek = () => {
    setWeekOffset(0);

    if (now) {
      setSelectedDay(
        getIndiaWeekday(now)
      );
    }
  };

  /* =======================================================
     CLASS CARD
========================================================= */

  const renderClassCard = (record, index) => {
    const status = getRecordStatus(record);
    const lab = isLabClass(record);
    const room = getRoutineRoom(record);
    const subject = getRoutineSubject(record);

    return (
      <article
        className={`rt-list-card ${
          status.state === "current"
            ? "current"
            : ""
        } ${
          status.state === "ended"
            ? "ended"
            : ""
        }`}
        key={
          record?.id ||
          `${getRoutineDay(record)}-${getRoutineTimeLabel(
            record
          )}-${subject}-${index}`
        }
      >
        <div
          className={`rt-list-card-accent ${
            lab ? "lab" : ""
          }`}
        />

        <div className="rt-list-card-main">
          <div className="rt-list-card-top">
            <span className="rt-list-time-chip">
              <Clock3 size={14} />
              {getRoutineTimeLabel(record)}
            </span>

            <span
              className={`rt-status rt-status-${status.tone}`}
            >
              {status.state === "current" && (
                <i className="rt-status-live-dot" />
              )}
              {status.label}
            </span>
          </div>

          <h3>{subject}</h3>

          {room && (
            <div className="rt-list-room">
              <MapPin size={14} />
              <span>{room}</span>
            </div>
          )}
        </div>
      </article>
    );
  };

  /* =======================================================
     PAGE
========================================================= */

  return (
    <AppShell
      role="student"
      title="Class Routine"
      subtitle="Your weekly academic schedule"
    >
      <div className="page-wrap routine-premium">
        {/* HERO */}
        <section className="rt-hero">
          <div className="rt-hero-copy">
            <span className="rt-eyebrow">
              <i />
              STUDENT ACADEMIC SPACE
            </span>

            <h1>
              Class Routine<span>.</span>
            </h1>

            <p>
              Your complete academic schedule, thoughtfully
              arranged so you can focus on every class,
              one day at a time.
            </p>

            <div className="rt-hero-tags">
              <span>
                <CalendarRange size={14} />
                Weekly timetable
              </span>

              <span>
                <GraduationCap size={14} />
                Student workspace
              </span>
            </div>
          </div>

          <div
            className="rt-hero-art"
            aria-hidden="true"
          >
            <div className="rt-orbit rt-orbit-one" />
            <div className="rt-orbit rt-orbit-two" />
            <div className="rt-orbit rt-orbit-three" />

            <div className="rt-hero-card">
              <div className="rt-hero-card-icon">
                <CalendarDays size={32} />
              </div>

              <span>YOUR WEEK</span>
              <strong>Learn · Focus · Grow</strong>
            </div>

            <i className="rt-hero-dot rt-dot-one" />
            <i className="rt-hero-dot rt-dot-two" />
            <i className="rt-hero-dot rt-dot-three" />
          </div>

          <div className="rt-tricolour" />
        </section>

        {/* LIVE STATUS CARD */}
        <section
          className={`rt-live-card rt-live-${liveSchedule.kind}`}
          aria-live="polite"
        >
          <div className="rt-live-icon">
            {liveSchedule.kind === "current" ? (
              <CheckCircle2 size={23} />
            ) : liveSchedule.kind === "break" ||
              liveSchedule.kind === "lunch" ? (
              <Clock3 size={23} />
            ) : (
              <CalendarDays size={23} />
            )}
          </div>

          <div className="rt-live-main">
            <div className="rt-live-topline">
              <span className="rt-live-label">
                {liveSchedule.kind === "current"
                  ? "IN PROGRESS"
                  : liveSchedule.kind === "not-started"
                    ? "UP NEXT"
                    : liveSchedule.kind === "lunch"
                      ? "LUNCH BREAK"
                      : liveSchedule.kind === "break"
                        ? "BREAK"
                        : liveSchedule.kind === "ended"
                          ? "ENDED"
                          : liveSchedule.kind === "unknown"
                            ? "TIMING UNAVAILABLE"
                            : "TODAY'S ROUTINE"}
              </span>

              <span className="rt-live-clock">
                <i />
                {formatIndiaLiveTime(now)} IST
              </span>
            </div>

            <h2>
              {liveSchedule.kind === "loading"
                ? "Checking your schedule..."
                : liveSchedule.kind === "current"
                  ? getRoutineSubject(
                      liveSchedule.record
                    )
                  : liveSchedule.kind === "not-started"
                    ? getRoutineSubject(
                        liveSchedule.record
                      )
                    : liveSchedule.kind === "lunch"
                      ? "Lunch break"
                      : liveSchedule.kind === "break"
                        ? "Break between classes"
                        : liveSchedule.kind === "ended"
                          ? "Today's classes have ended"
                          : liveSchedule.kind === "unknown"
                            ? "Class timing unavailable"
                            : "No classes scheduled today"}
            </h2>

            <p>
              {liveSchedule.kind === "current" ||
              liveSchedule.kind === "not-started" ? (
                <>
                  {getRoutineTimeLabel(
                    liveSchedule.record
                  )}
                  {getRoutineRoom(
                    liveSchedule.record
                  )
                    ? ` · ${getRoutineRoom(
                        liveSchedule.record
                      )}`
                    : ""}
                </>
              ) : (
                liveSchedule.message
              )}
            </p>
          </div>

          <div className="rt-live-right">
            {liveSchedule.kind === "current" && (
              <span className="rt-live-badge rt-badge-current">
                <i className="rt-live-pulse" />
                LIVE · In Progress
              </span>
            )}

            {liveSchedule.kind === "not-started" && (
              <span className="rt-live-badge rt-badge-upcoming">
                <Clock3 size={14} />
                {formatTimeUntil(
                  liveSchedule.remaining
                )}
              </span>
            )}

            {(liveSchedule.kind === "break" ||
              liveSchedule.kind === "lunch") && (
              <span className="rt-live-badge rt-badge-break">
                <Clock3 size={14} />
                {liveSchedule.remaining !== null
                  ? `Next class in ${formatTimeUntil(
                      liveSchedule.remaining
                    )}`
                  : "Break time"}
              </span>
            )}

            {liveSchedule.kind === "ended" && (
              <span className="rt-live-badge rt-badge-ended">
                <CheckCircle2 size={14} />
                Completed
              </span>
            )}
          </div>
        </section>

        {/* SEARCH / VIEW / REFRESH */}
        <section
          className="rt-toolbar"
          aria-label="Routine controls"
        >
          <label className="rt-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subject or classroom..."
              aria-label="Search routine"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>

          <div className="rt-toolbar-actions">
            <div
              className="rt-view-toggle"
              role="group"
              aria-label="Routine display"
            >
              <button
                type="button"
                className={
                  view === "schedule"
                    ? "active"
                    : ""
                }
                onClick={() => setView("schedule")}
                aria-pressed={view === "schedule"}
              >
                <LayoutGrid size={15} />
                Schedule
              </button>

              <button
                type="button"
                className={
                  view === "list"
                    ? "active"
                    : ""
                }
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                <List size={15} />
                List
              </button>
            </div>

            <button
              type="button"
              className="rt-refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={
                  refreshing ? "rt-spin" : ""
                }
              />

              <span>
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </span>
            </button>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="rt-error" role="alert">
            <div className="rt-error-icon">
              <RefreshCw size={16} />
            </div>

            <div className="rt-error-copy">
              <strong>
                Unable to load the class routine
              </strong>
              <span>{error}</span>
            </div>

            <button
              type="button"
              className="rt-error-retry"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={14}
                className={
                  refreshing ? "rt-spin" : ""
                }
              />
              Retry
            </button>
          </div>
        )}

        {/* WEEK / DAY SELECTOR */}
        <section className="rt-calendar">
          <div className="rt-calendar-heading">
            <div>
              <span className="rt-section-kicker">
                YOUR ACADEMIC CALENDAR
              </span>

              <h2>Weekly schedule</h2>

              <p>
                Select a day to view classes in chronological order.
              </p>
            </div>

            <div className="rt-week-controls">
              <button
                type="button"
                onClick={() =>
                  setWeekOffset((value) => value - 1)
                }
                aria-label="Previous week"
                title="Previous week"
              >
                <ArrowLeft size={16} />
              </button>

              <span>
                {formatWeekRange(
                  calendarToday,
                  weekOffset
                )}
              </span>

              <button
                type="button"
                onClick={() =>
                  setWeekOffset((value) => value + 1)
                }
                aria-label="Next week"
                title="Next week"
              >
                <ArrowRight size={16} />
              </button>

              {weekOffset !== 0 && (
                <button
                  type="button"
                  className="rt-today-button"
                  onClick={goToCurrentWeek}
                >
                  This week
                </button>
              )}
            </div>
          </div>

          <div
            className="rt-day-selector"
            role="group"
            aria-label="Choose weekday"
          >
            {WEEKDAYS.map((day, index) => {
              const date = getWeekDate(
                calendarToday,
                weekOffset,
                index
              );

              const isToday =
                now &&
                day.key === todayKey &&
                weekOffset === 0;

              const isSelected =
                activeDay === day.key;

              const count =
                (routineByDay[day.key] || []).length;

              return (
                <button
                  type="button"
                  key={day.key}
                  className={`rt-day-button ${
                    isSelected ? "active" : ""
                  } ${isToday ? "today" : ""}`}
                  onClick={() =>
                    setSelectedDay(day.key)
                  }
                  aria-pressed={isSelected}
                >
                  <span className="rt-day-name">
                    {day.short}
                  </span>

                  <strong>
                    {date
                      ? date.getUTCDate()
                      : "—"}
                  </strong>

                  <small>
                    {count}{" "}
                    {count === 1
                      ? "class"
                      : "classes"}
                  </small>

                  {isToday && (
                    <i className="rt-day-today-dot" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* SELECTED DAY HEADING */}
        <div className="rt-section-heading">
          <div>
            <span className="rt-section-kicker">
              {weekOffset === 0
                ? "CURRENT WEEK"
                : "WEEKLY OVERVIEW"}
            </span>

            <h2>
              {activeDayDetails.name}
              <span>
                {formatRoutineDate(
                  selectedDayDate,
                  true
                )}
              </span>
            </h2>
          </div>

          <span className="rt-total-pill">
            <CalendarDays size={14} />
            {selectedDayRecords.length}{" "}
            {selectedDayRecords.length === 1
              ? "class"
              : "classes"}
          </span>
        </div>

        {/* LOADING / EMPTY / SCHEDULE */}
        {loading ? (
          <div className="rt-loading">
            {[1, 2, 3].map((item) => (
              <div
                className="rt-loading-card"
                key={item}
              >
                <span />
                <div />
                <div />
              </div>
            ))}
          </div>
        ) : selectedDayRecords.length === 0 ? (
          <div className="rt-empty">
            <div className="rt-empty-icon">
              <CalendarDays size={27} />
            </div>

            <h3>
              {normalizedSearch
                ? "No matching classes"
                : "No classes scheduled"}
            </h3>

            <p>
              {normalizedSearch
                ? "Try another subject or clear your search."
                : `There are no routine entries for ${activeDayDetails.name}.`}
            </p>

            {normalizedSearch && (
              <button
                type="button"
                className="rt-empty-clear"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        ) : view === "schedule" ? (
          /* PREMIUM DAILY TIMETABLE */
          <section className="rt-schedule-view">
            {/* PREMIUM INFO BOX */}
            <div className="rt-schedule-view-header">
              <div className="rt-view-heading-icon">
                <CalendarRange size={21} />
              </div>

              <div className="rt-view-heading-content">
                <span className="rt-view-heading-eyebrow">
                  DAILY TIMETABLE
                </span>

                <strong>
                  {activeDayDetails.name}'s Timetable
                </strong>

                <span className="rt-view-heading-subtitle">
                  All classes arranged by start time
                </span>
              </div>

              <div className="rt-order-badge">
                <CheckCircle2 size={15} />
                <span>Chronological Order</span>
              </div>
            </div>

            {/* ACTUAL ROUTINE TABLE */}
            <div className="rt-table-wrap">
              <div className="rt-table">
                <div className="rt-table-head">
                  <span>TIME</span>
                  <span>SUBJECT</span>
                  <span>CLASSROOM</span>
                  <span>LIVE STATUS</span>
                </div>

                {selectedDayRecords.map(
                  (record, index) => {
                    const status =
                      getRecordStatus(record);

                    const lab = isLabClass(record);
                    const room = getRoutineRoom(record);

                    return (
                      <div
                        className={`rt-table-row ${
                          status.state === "current"
                            ? "current"
                            : ""
                        } ${
                          status.state === "ended"
                            ? "ended"
                            : ""
                        }`}
                        key={
                          record?.id ||
                          `${getRoutineDay(record)}-${getRoutineTimeLabel(
                            record
                          )}-${getRoutineSubject(record)}-${index}`
                        }
                      >
                        <div className="rt-table-time">
                          <Clock3 size={15} />
                          <span>
                            {getRoutineTimeLabel(record)}
                          </span>
                        </div>

                        <div className="rt-table-subject">
                          <span
                            className={`rt-subject-marker ${
                              lab ? "lab" : ""
                            }`}
                          />

                          <strong>
                            {getRoutineSubject(record)}
                          </strong>

                          {lab && (
                            <span className="rt-table-lab">
                              LAB
                            </span>
                          )}
                        </div>

                        <div className="rt-table-room">
                          {room ? (
                            <>
                              <MapPin size={14} />
                              <span>{room}</span>
                            </>
                          ) : (
                            <span className="rt-no-room">
                              Not specified
                            </span>
                          )}
                        </div>

                        <div className="rt-table-status">
                          <span
                            className={`rt-status rt-status-${status.tone}`}
                          >
                            {status.state === "current" && (
                              <i className="rt-status-live-dot" />
                            )}
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* MOBILE TIMELINE */}
            <div className="rt-mobile-timeline">
              <div className="rt-mobile-timeline-heading">
                <strong>
                  {activeDayDetails.name}'s classes
                </strong>
                <span>
                  Sorted by start time
                </span>
              </div>

              <div className="rt-timeline">
                {selectedDayRecords.map(
                  (record, index) => {
                    const status =
                      getRecordStatus(record);

                    const room = getRoutineRoom(record);
                    const lab = isLabClass(record);

                    return (
                      <div
                        className="rt-timeline-row"
                        key={
                          record?.id ||
                          `${getRoutineDay(record)}-${getRoutineTimeLabel(
                            record
                          )}-${getRoutineSubject(record)}-${index}`
                        }
                      >
                        <div className="rt-timeline-time">
                          {getRoutineTimeLabel(record)}
                        </div>

                        <div className="rt-timeline-track">
                          <i
                            className={`rt-timeline-dot ${
                              status.state === "current"
                                ? "current"
                                : status.state === "ended"
                                  ? "ended"
                                  : ""
                            }`}
                          />
                        </div>

                        <article
                          className={`rt-list-card ${
                            status.state === "current"
                              ? "current"
                              : ""
                          }`}
                        >
                          <div
                            className={`rt-list-card-accent ${
                              lab ? "lab" : ""
                            }`}
                          />

                          <div className="rt-list-card-main">
                            <div className="rt-list-card-top">
                              <span className="rt-list-time-chip">
                                <Clock3 size={13} />
                                {getRoutineTimeLabel(record)}
                              </span>

                              <span
                                className={`rt-status rt-status-${status.tone}`}
                              >
                                {status.state === "current" && (
                                  <i className="rt-status-live-dot" />
                                )}
                                {status.label}
                              </span>
                            </div>

                            <h3>
                              {getRoutineSubject(record)}
                            </h3>

                            {room && (
                              <div className="rt-list-room">
                                <MapPin size={14} />
                                <span>{room}</span>
                              </div>
                            )}
                          </div>
                        </article>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        ) : (
          /* LIST VIEW */
          <section className="rt-list-view">
            <div className="rt-list-header">
              <div className="rt-list-header-icon">
                <List size={18} />
              </div>

              <div>
                <strong>
                  {activeDayDetails.name}'s classes
                </strong>
                <span>
                  Detailed view · Sorted by start time
                </span>
              </div>
            </div>

            <div className="rt-timeline">
              {selectedDayRecords.map(
                (record, index) => {
                  const status =
                    getRecordStatus(record);

                  const lab = isLabClass(record);
                  const room = getRoutineRoom(record);

                  return (
                    <div
                      className="rt-timeline-row"
                      key={
                        record?.id ||
                        `${getRoutineDay(record)}-${getRoutineTimeLabel(
                          record
                        )}-${getRoutineSubject(record)}-${index}`
                      }
                    >
                      <div className="rt-timeline-time">
                        {getRoutineTimeLabel(record)}
                      </div>

                      <div className="rt-timeline-track">
                        <i
                          className={`rt-timeline-dot ${
                            status.state === "current"
                              ? "current"
                              : status.state === "ended"
                                ? "ended"
                                : ""
                          }`}
                        />
                      </div>

                      <article
                        className={`rt-list-card ${
                          status.state === "current"
                            ? "current"
                            : status.state === "ended"
                              ? "ended"
                              : ""
                        }`}
                      >
                        <div
                          className={`rt-list-card-accent ${
                            lab ? "lab" : ""
                          }`}
                        />

                        <div className="rt-list-card-main">
                          <div className="rt-list-card-top">
                            <span className="rt-list-time-chip">
                              <Clock3 size={13} />
                              {getRoutineTimeLabel(record)}
                            </span>

                            <span
                              className={`rt-status rt-status-${status.tone}`}
                            >
                              {status.state === "current" && (
                                <i className="rt-status-live-dot" />
                              )}
                              {status.label}
                            </span>
                          </div>

                          <h3>
                            {getRoutineSubject(record)}
                          </h3>

                          {room && (
                            <div className="rt-list-room">
                              <MapPin size={14} />
                              <span>{room}</span>
                            </div>
                          )}
                        </div>
                      </article>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* STATUS GUIDE */}
        <section className="rt-legend">
          <div className="rt-legend-title">
            <Sparkles size={15} />
            Status guide
          </div>

          <div className="rt-legend-items">
            <span>
              <i className="rt-legend-start" />
              Not Started
            </span>

            <span>
              <i className="rt-legend-progress" />
              In Progress
            </span>

            <span>
              <i className="rt-legend-break" />
              Break / Lunch
            </span>

            <span>
              <i className="rt-legend-ended" />
              Ended
            </span>
          </div>
        </section>

        {/* =================================================
           ALL CSS IN THIS JSX FILE
        ================================================= */}

        <style jsx global>{`
          .routine-premium {
            --rt-ink: #17251f;
            --rt-muted: #6e7b73;
            --rt-border: #dfe8e1;
            --rt-green: #138808;
            --rt-green-dark: #0d6238;
            --rt-saffron: #f28b2d;
            --rt-blue: #284e88;
            min-width: 0;
            padding-bottom: 38px;
            color: var(--rt-ink);
          }

          .routine-premium,
          .routine-premium * {
            box-sizing: border-box;
          }

          .routine-premium button {
            font-family: inherit;
          }

          .routine-premium button:focus-visible {
            outline: 3px solid rgba(40, 78, 136, .32);
            outline-offset: 3px;
          }

          /* HERO */
          .routine-premium .rt-hero {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 250px;
            min-height: 230px;
            overflow: hidden;
            border: 1px solid #e0e9e2;
            border-radius: 23px;
            background:
              radial-gradient(
                circle at 85% 15%,
                rgba(255, 153, 51, .09),
                transparent 27%
              ),
              radial-gradient(
                circle at 12% 100%,
                rgba(19, 136, 8, .045),
                transparent 28%
              ),
              #fff;
            box-shadow: 0 12px 32px rgba(18, 61, 35, .045);
          }

          .routine-premium .rt-hero-copy {
            position: relative;
            z-index: 1;
            align-self: center;
            padding: 31px 37px;
          }

          .routine-premium .rt-eyebrow {
            display: flex;
            align-items: center;
            gap: 9px;
            color: #17813e;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: .15em;
          }

          .routine-premium .rt-eyebrow i {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--rt-saffron);
            box-shadow: 0 0 0 4px rgba(242, 139, 45, .11);
          }

          .routine-premium .rt-hero-copy h1 {
            margin: 15px 0 10px;
            color: var(--rt-ink);
            font-size: clamp(30px, 3vw, 42px);
            font-weight: 820;
            letter-spacing: -.055em;
            line-height: 1.08;
          }

          .routine-premium .rt-hero-copy h1 span {
            color: var(--rt-saffron);
          }

          .routine-premium .rt-hero-copy > p {
            max-width: 610px;
            margin: 0;
            color: var(--rt-muted);
            font-size: 13px;
            line-height: 1.75;
          }

          .routine-premium .rt-hero-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 19px;
          }

          .routine-premium .rt-hero-tags span {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 31px;
            padding: 0 11px;
            border: 1px solid #e0e9e2;
            border-radius: 999px;
            background: #f8fbf8;
            color: #53665a;
            font-size: 10px;
            font-weight: 750;
          }

          .routine-premium .rt-hero-tags svg {
            color: var(--rt-green);
          }

          .routine-premium .rt-hero-art {
            position: relative;
            min-height: 230px;
            overflow: hidden;
          }

          .routine-premium .rt-orbit {
            position: absolute;
            border: 1px solid rgba(19, 136, 8, .12);
            border-radius: 50%;
          }

          .routine-premium .rt-orbit-one {
            top: -55px;
            right: -70px;
            width: 300px;
            height: 300px;
          }

          .routine-premium .rt-orbit-two {
            top: -15px;
            right: -30px;
            width: 225px;
            height: 225px;
            border-color: rgba(242, 139, 45, .2);
          }

          .routine-premium .rt-orbit-three {
            top: 23px;
            right: 8px;
            width: 150px;
            height: 150px;
            border-color: rgba(40, 78, 136, .15);
          }

          .routine-premium .rt-hero-card {
            position: absolute;
            top: 50%;
            right: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 9px;
            width: 170px;
            height: 148px;
            border: 1px solid #e2eae3;
            border-radius: 21px;
            background: rgba(255, 255, 255, .9);
            box-shadow: 0 18px 40px rgba(18, 68, 38, .09);
            transform: translateY(-50%);
            backdrop-filter: blur(12px);
          }

          .routine-premium .rt-hero-card-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            border: 1px solid #dce8de;
            border-radius: 18px;
            background: linear-gradient(145deg, #fff2e3, #eff8f1);
            color: var(--rt-green);
          }

          .routine-premium .rt-hero-card > span {
            color: #718077;
            font-size: 8px;
            font-weight: 850;
            letter-spacing: .15em;
          }

          .routine-premium .rt-hero-card > strong {
            color: #244a34;
            font-size: 10px;
            font-weight: 800;
          }

          .routine-premium .rt-hero-dot {
            position: absolute;
            width: 9px;
            height: 9px;
            border-radius: 50%;
          }

          .routine-premium .rt-dot-one {
            top: 25px;
            right: 68px;
            background: var(--rt-saffron);
            box-shadow: 0 0 0 5px rgba(242, 139, 45, .11);
          }

          .routine-premium .rt-dot-two {
            right: 211px;
            bottom: 29px;
            background: var(--rt-green);
            box-shadow: 0 0 0 5px rgba(19, 136, 8, .08);
          }

          .routine-premium .rt-dot-three {
            top: 67px;
            right: 12px;
            width: 6px;
            height: 6px;
            background: var(--rt-blue);
          }

          .routine-premium .rt-tricolour {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(
              90deg,
              #ff9933 0%,
              #fff 50%,
              #138808 100%
            );
          }

          /* LIVE STATUS CARD */
          .routine-premium .rt-live-card {
            position: relative;
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
            overflow: hidden;
            margin-top: 17px;
            padding: 16px 18px;
            border: 1px solid #dfe9e1;
            border-radius: 17px;
            background:
              linear-gradient(
                105deg,
                rgba(255, 153, 51, .045),
                transparent 44%,
                rgba(19, 136, 8, .04)
              ),
              #fff;
            box-shadow: 0 7px 22px rgba(20, 55, 34, .035);
          }

          .routine-premium .rt-live-current {
            border-color: #a9d2b2;
            background:
              linear-gradient(
                105deg,
                rgba(19, 136, 8, .07),
                transparent 65%
              ),
              #fff;
          }

          .routine-premium .rt-live-lunch,
          .routine-premium .rt-live-break {
            border-color: #f0d8bc;
            background:
              linear-gradient(
                105deg,
                rgba(255, 153, 51, .07),
                transparent 65%
              ),
              #fff;
          }

          .routine-premium .rt-live-ended {
            border-color: #dfe8e1;
            background: #fbfcfb;
          }

          .routine-premium .rt-live-icon {
            display: flex;
            flex: 0 0 46px;
            align-items: center;
            justify-content: center;
            width: 46px;
            height: 46px;
            border: 1px solid #dce8de;
            border-radius: 14px;
            background: linear-gradient(145deg, #fff1e2, #edf8ef);
            color: var(--rt-green);
          }

          .routine-premium .rt-live-current .rt-live-icon {
            border-color: #b8d6bf;
            background: #ecf8ee;
          }

          .routine-premium .rt-live-lunch .rt-live-icon,
          .routine-premium .rt-live-break .rt-live-icon {
            border-color: #f0dec8;
            background: #fff6eb;
            color: #bd762f;
          }

          .routine-premium .rt-live-main {
            flex: 1 1 auto;
            min-width: 0;
          }

          .routine-premium .rt-live-topline {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 9px;
          }

          .routine-premium .rt-live-label {
            color: #16803d;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .13em;
          }

          .routine-premium .rt-live-lunch .rt-live-label,
          .routine-premium .rt-live-break .rt-live-label {
            color: #b66c24;
          }

          .routine-premium .rt-live-clock {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #829087;
            font-size: 9px;
            font-weight: 750;
          }

          .routine-premium .rt-live-clock > i {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #168b35;
            box-shadow: 0 0 0 3px rgba(22, 139, 53, .08);
          }

          .routine-premium .rt-live-main h2 {
            margin: 5px 0 4px;
            color: var(--rt-ink);
            font-size: 15px;
            font-weight: 820;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-live-main p {
            margin: 0;
            color: var(--rt-muted);
            font-size: 11px;
            line-height: 1.6;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-live-right {
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: flex-end;
          }

          .routine-premium .rt-live-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 33px;
            padding: 0 11px;
            border: 1px solid #d3e7d7;
            border-radius: 999px;
            background: #f1f9f2;
            color: #1b783b;
            font-size: 10px;
            font-weight: 850;
            white-space: nowrap;
          }

          .routine-premium .rt-badge-break {
            border-color: #f0dec8;
            background: #fff7ed;
            color: #a86422;
          }

          .routine-premium .rt-badge-upcoming {
            border-color: #d7e4f4;
            background: #f0f5fc;
            color: #315e97;
          }

          .routine-premium .rt-badge-ended {
            border-color: #dfe8e1;
            background: #f7faf7;
            color: #65746a;
          }

          .routine-premium .rt-live-pulse {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #168b35;
            box-shadow: 0 0 0 4px rgba(22, 139, 53, .1);
            animation: routine-live-pulse 1.5s ease-in-out infinite;
          }

          @keyframes routine-live-pulse {
            0%, 100% {
              box-shadow: 0 0 0 3px rgba(22, 139, 53, .09);
            }
            50% {
              box-shadow: 0 0 0 6px rgba(22, 139, 53, .04);
            }
          }

          /* TOOLBAR */
          .routine-premium .rt-toolbar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            min-width: 0;
            margin: 18px 0 20px;
            padding: 10px;
            border: 1px solid var(--rt-border);
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 8px 24px rgba(20, 55, 34, .04);
          }

          .routine-premium .rt-search {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            min-height: 46px;
            padding: 0 13px;
            border: 1px solid #e1e9e2;
            border-radius: 11px;
            background: #f8faf8;
            color: #78867d;
            transition: border-color .18s ease, box-shadow .18s ease;
          }

          .routine-premium .rt-search:focus-within {
            border-color: #83b894;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(19, 136, 8, .08);
          }

          .routine-premium .rt-search > svg {
            flex: 0 0 auto;
            color: #75837a;
          }

          .routine-premium .rt-search input {
            flex: 1 1 auto;
            width: 100%;
            min-width: 0;
            height: 44px;
            padding: 0;
            border: 0;
            border-radius: 0;
            outline: none;
            appearance: none;
            background: transparent;
            color: var(--rt-ink);
            box-shadow: none;
            font: inherit;
            font-size: 12px;
          }

          .routine-premium .rt-search input::placeholder {
            color: #98a39b;
            opacity: 1;
          }

          .routine-premium .rt-search input::-webkit-search-cancel-button {
            display: none;
          }

          .routine-premium .rt-search button {
            display: inline-flex;
            flex: 0 0 27px;
            align-items: center;
            justify-content: center;
            width: 27px;
            height: 27px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: #edf4ee;
            color: #5d7063;
            cursor: pointer;
          }

          .routine-premium .rt-search button:hover {
            background: #e1efe4;
            color: var(--rt-green-dark);
          }

          .routine-premium .rt-toolbar-actions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 9px;
            min-width: 0;
          }

          .routine-premium .rt-view-toggle {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            padding: 3px;
            border: 1px solid #e0e8e1;
            border-radius: 11px;
            background: #f7faf7;
          }

          .routine-premium .rt-view-toggle button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 34px;
            padding: 0 10px;
            border: 1px solid transparent;
            border-radius: 8px;
            background: transparent;
            color: #65746a;
            font-size: 10px;
            font-weight: 750;
            white-space: nowrap;
            cursor: pointer;
            transition: .18s ease;
          }

          .routine-premium .rt-view-toggle button.active {
            border-color: #dce8de;
            background: #fff;
            color: #146e36;
            box-shadow: 0 2px 7px rgba(22, 65, 36, .06);
          }

          .routine-premium .rt-view-toggle button:hover:not(.active) {
            background: #eef5ef;
            color: #245a36;
          }

          .routine-premium .rt-refresh {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-width: 105px;
            min-height: 42px;
            padding: 0 12px;
            border: 1px solid #cfe0d2;
            border-radius: 10px;
            background: #fff;
            color: #176d37;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            cursor: pointer;
            transition: .18s ease;
          }

          .routine-premium .rt-refresh:hover:not(:disabled) {
            transform: translateY(-1px);
            border-color: #a9cdb1;
            background: #f1f8f2;
            box-shadow: 0 7px 17px rgba(18, 91, 47, .07);
          }

          .routine-premium .rt-refresh:disabled {
            opacity: .65;
            cursor: wait;
          }

          .routine-premium .rt-spin {
            animation: routine-spin .85s linear infinite;
          }

          @keyframes routine-spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* ERROR */
          .routine-premium .rt-error {
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
            margin: 0 0 20px;
            padding: 13px 15px;
            border: 1px solid #f0d8c3;
            border-radius: 14px;
            background: #fff8f2;
          }

          .routine-premium .rt-error-icon {
            display: flex;
            flex: 0 0 36px;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: 1px solid #f0d8c3;
            border-radius: 11px;
            background: #fff;
            color: #99501f;
          }

          .routine-premium .rt-error-copy {
            flex: 1 1 auto;
            min-width: 0;
          }

          .routine-premium .rt-error-copy strong,
          .routine-premium .rt-error-copy span {
            display: block;
          }

          .routine-premium .rt-error-copy strong {
            color: #99501f;
            font-size: 11px;
          }

          .routine-premium .rt-error-copy span {
            margin-top: 3px;
            color: #846e5e;
            font-size: 10px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-error-retry {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 35px;
            padding: 0 11px;
            border: 1px solid #ead3bf;
            border-radius: 9px;
            background: #fff;
            color: #8b4d26;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
          }

          /* WEEK / CALENDAR PANEL */
          .routine-premium .rt-calendar {
            margin: 0 0 24px;
            padding: 19px;
            border: 1px solid var(--rt-border);
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 7px 22px rgba(20, 55, 34, .035);
          }

          .routine-premium .rt-calendar-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 17px;
          }

          .routine-premium .rt-calendar-heading h2 {
            margin: 5px 0 4px;
            color: var(--rt-ink);
            font-size: 20px;
            font-weight: 820;
            letter-spacing: -.04em;
            line-height: 1.3;
          }

          .routine-premium .rt-calendar-heading p {
            margin: 0;
            color: var(--rt-muted);
            font-size: 11px;
            line-height: 1.6;
          }

          .routine-premium .rt-week-controls {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
            gap: 7px;
          }

          .routine-premium .rt-week-controls button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 33px;
            height: 33px;
            padding: 0;
            border: 1px solid #e0e8e1;
            border-radius: 9px;
            background: #fff;
            color: #65756a;
            cursor: pointer;
            transition: .18s ease;
          }

          .routine-premium .rt-week-controls button:hover {
            border-color: #b9d5bf;
            background: #f0f8f1;
            color: var(--rt-green-dark);
          }

          .routine-premium .rt-week-controls > span {
            min-width: 120px;
            color: #58695e;
            font-size: 10px;
            font-weight: 800;
            text-align: center;
          }

          .routine-premium .rt-week-controls > .rt-today-button {
            width: auto;
            padding: 0 10px;
            color: #176d37;
            font-size: 10px;
            font-weight: 800;
          }

          .routine-premium .rt-day-selector {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            gap: 8px;
          }

          .routine-premium .rt-day-button {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            min-width: 0;
            min-height: 73px;
            padding: 8px 5px;
            border: 1px solid #e3eae4;
            border-radius: 12px;
            background: #f9fbf9;
            color: #728078;
            cursor: pointer;
            transition: .18s ease;
          }

          .routine-premium .rt-day-button:hover {
            transform: translateY(-1px);
            border-color: #b9d4bf;
            background: #f3f9f4;
          }

          .routine-premium .rt-day-button.active {
            border-color: #8bbd96;
            background: linear-gradient(150deg, #edf8ef, #fff);
            color: #166c37;
            box-shadow: 0 5px 14px rgba(19, 136, 8, .075);
          }

          .routine-premium .rt-day-button.today::after {
            position: absolute;
            top: 7px;
            right: 7px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            content: "";
            background: var(--rt-saffron);
            box-shadow: 0 0 0 3px rgba(242, 139, 45, .1);
          }

          .routine-premium .rt-day-name {
            color: inherit;
            font-size: 10px;
            font-weight: 800;
          }

          .routine-premium .rt-day-button strong {
            color: var(--rt-ink);
            font-size: 20px;
            font-weight: 850;
            letter-spacing: -.03em;
            line-height: 1;
          }

          .routine-premium .rt-day-button.active strong {
            color: #126d37;
          }

          .routine-premium .rt-day-button small {
            max-width: 100%;
            color: #91a097;
            font-size: 8px;
            line-height: 1.25;
            text-align: center;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-day-today-dot {
            position: absolute;
            bottom: 5px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--rt-green);
          }

          /* SECTION HEADING */
          .routine-premium .rt-section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin: 0 0 15px;
          }

          .routine-premium .rt-section-heading h2 {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 9px;
            margin: 5px 0 4px;
            color: var(--rt-ink);
            font-size: 21px;
            font-weight: 820;
            letter-spacing: -.04em;
            line-height: 1.3;
          }

          .routine-premium .rt-section-heading h2 span {
            color: #89968d;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0;
          }

          .routine-premium .rt-total-pill {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 32px;
            padding: 0 11px;
            border: 1px solid #dce8de;
            border-radius: 999px;
            background: #f5faf6;
            color: #2d7444;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          /* PREMIUM TIMETABLE HEADING BOX */
          .routine-premium .rt-schedule-view {
            min-width: 0;
          }

          .routine-premium .rt-schedule-view-header {
            position: relative;
            display: flex;
            align-items: center;
            gap: 15px;
            width: 100%;
            min-width: 0;
            margin: 0 0 16px;
            padding: 17px 19px;
            overflow: hidden;
            border: 1px solid #dce8df;
            border-radius: 17px;
            background:
              radial-gradient(
                circle at 100% 0%,
                rgba(19, 136, 8, .055),
                transparent 35%
              ),
              linear-gradient(
                105deg,
                rgba(255, 153, 51, .045),
                transparent 48%,
                rgba(19, 136, 8, .035)
              ),
              #fff;
            box-shadow: 0 8px 24px rgba(23, 65, 38, .055);
          }

          .routine-premium .rt-schedule-view-header::before {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 3px;
            content: "";
            background: linear-gradient(
              180deg,
              #ff9933 0%,
              #fff 50%,
              #138808 100%
            );
          }

          .routine-premium .rt-view-heading-icon {
            display: flex;
            flex: 0 0 48px;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            border: 1px solid #dce8de;
            border-radius: 14px;
            background: linear-gradient(145deg, #fff1e2, #edf8ef);
            color: #138808;
            box-shadow: 0 4px 12px rgba(19, 136, 8, .06);
          }

          .routine-premium .rt-view-heading-content {
            display: flex;
            flex: 1 1 auto;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
          }

          .routine-premium .rt-view-heading-eyebrow {
            color: #16813c;
            font-size: 9px;
            font-weight: 850;
            letter-spacing: .15em;
          }

          .routine-premium .rt-view-heading-content strong {
            color: #17251f;
            font-size: 16px;
            font-weight: 820;
            letter-spacing: -.025em;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-view-heading-subtitle {
            color: #718077;
            font-size: 11px;
            line-height: 1.5;
          }

          .routine-premium .rt-order-badge {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 35px;
            padding: 0 12px;
            border: 1px solid #d2e6d6;
            border-radius: 999px;
            background: #f1f9f2;
            color: #18723a;
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
          }

          .routine-premium .rt-order-badge svg {
            flex: 0 0 auto;
            color: #138808;
          }

          /* TIMETABLE TABLE */
          .routine-premium .rt-table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #dfe8e1;
            border-radius: 17px;
            background: #fff;
            box-shadow: 0 7px 22px rgba(20, 55, 34, .035);
            scrollbar-color: #bfd2c3 transparent;
            scrollbar-width: thin;
          }

          .routine-premium .rt-table {
            min-width: 720px;
          }

          .routine-premium .rt-table-head,
          .routine-premium .rt-table-row {
            display: grid;
            grid-template-columns:
              minmax(150px, 1.1fr)
              minmax(220px, 1.8fr)
              minmax(130px, .9fr)
              minmax(145px, 1fr);
            align-items: center;
            gap: 14px;
            min-width: 0;
            padding: 14px 18px;
          }

          .routine-premium .rt-table-head {
            min-height: 47px;
            border-bottom: 1px solid #e7eee8;
            background: #f6faf6;
            color: #849188;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: .12em;
          }

          .routine-premium .rt-table-row {
            min-height: 69px;
            border-bottom: 1px solid #edf1ee;
            color: var(--rt-ink);
            transition: background .18s ease;
          }

          .routine-premium .rt-table-row:last-child {
            border-bottom: 0;
          }

          .routine-premium .rt-table-row:hover {
            background: #fbfdfb;
          }

          .routine-premium .rt-table-row.current {
            background: linear-gradient(
              90deg,
              rgba(19, 136, 8, .06),
              transparent
            );
            box-shadow: inset 3px 0 #138808;
          }

          .routine-premium .rt-table-row.ended {
            background: #fcfdfc;
          }

          .routine-premium .rt-table-time,
          .routine-premium .rt-table-room {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            color: #647369;
            font-size: 11px;
            font-weight: 750;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-table-time svg,
          .routine-premium .rt-table-room svg {
            flex: 0 0 auto;
            color: #829188;
          }

          .routine-premium .rt-table-time span,
          .routine-premium .rt-table-room span {
            min-width: 0;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-table-subject {
            display: flex;
            align-items: center;
            gap: 9px;
            min-width: 0;
          }

          .routine-premium .rt-subject-marker {
            flex: 0 0 4px;
            align-self: stretch;
            min-height: 25px;
            border-radius: 999px;
            background: #16863e;
          }

          .routine-premium .rt-subject-marker.lab {
            background: var(--rt-saffron);
          }

          .routine-premium .rt-table-subject strong {
            color: var(--rt-ink);
            font-size: 12px;
            font-weight: 800;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-table-lab {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            padding: 3px 6px;
            border: 1px solid #f1dfcd;
            border-radius: 999px;
            background: #fff5eb;
            color: #b9702e;
            font-size: 7px;
            font-weight: 900;
          }

          .routine-premium .rt-no-room {
            color: #a2aca5;
          }

          .routine-premium .rt-table-status {
            display: flex;
            align-items: center;
            min-width: 0;
          }

          /* STATUS PILLS */
          .routine-premium .rt-status {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 27px;
            max-width: 100%;
            padding: 0 9px;
            border: 1px solid transparent;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 850;
            line-height: 1.2;
            white-space: nowrap;
          }

          .routine-premium .rt-status i {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }

          .routine-premium .rt-status-current {
            border-color: #c6e5cc;
            background: #ecf8ee;
            color: #16783a;
          }

          .routine-premium .rt-status-upcoming {
            border-color: #d7e4f4;
            background: #f0f5fc;
            color: #315e97;
          }

          .routine-premium .rt-status-ended {
            border-color: #e0e6e1;
            background: #f5f7f5;
            color: #78847c;
          }

          .routine-premium .rt-status-break {
            border-color: #f0dfca;
            background: #fff6eb;
            color: #b66c24;
          }

          .routine-premium .rt-status-scheduled {
            border-color: #e2e9e3;
            background: #f8faf8;
            color: #728077;
          }

          .routine-premium .rt-status-live-dot {
            background: #168b35 !important;
            box-shadow: 0 0 0 3px rgba(22, 139, 53, .08);
          }

          /* MOBILE TIMELINE */
          .routine-premium .rt-mobile-timeline {
            display: none;
          }

          .routine-premium .rt-mobile-timeline-heading {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 13px;
          }

          .routine-premium .rt-mobile-timeline-heading strong {
            color: var(--rt-ink);
            font-size: 13px;
            font-weight: 800;
          }

          .routine-premium .rt-mobile-timeline-heading span {
            color: #849188;
            font-size: 9px;
          }

          /* LIST VIEW */
          .routine-premium .rt-list-view {
            padding: 18px;
            border: 1px solid #dfe8e1;
            border-radius: 17px;
            background: #fff;
            box-shadow: 0 7px 22px rgba(20, 55, 34, .035);
          }

          .routine-premium .rt-list-header {
            display: flex;
            align-items: center;
            gap: 11px;
            margin-bottom: 19px;
            padding-bottom: 14px;
            border-bottom: 1px solid #edf1ee;
          }

          .routine-premium .rt-list-header-icon {
            display: flex;
            flex: 0 0 39px;
            align-items: center;
            justify-content: center;
            width: 39px;
            height: 39px;
            border: 1px solid #dce8de;
            border-radius: 12px;
            background: #f1f8f2;
            color: var(--rt-green);
          }

          .routine-premium .rt-list-header strong,
          .routine-premium .rt-list-header span {
            display: block;
          }

          .routine-premium .rt-list-header strong {
            color: var(--rt-ink);
            font-size: 12px;
            font-weight: 800;
          }

          .routine-premium .rt-list-header span {
            margin-top: 3px;
            color: #87938a;
            font-size: 10px;
          }

          .routine-premium .rt-timeline {
            display: flex;
            flex-direction: column;
            gap: 0;
            min-width: 0;
          }

          .routine-premium .rt-timeline-row {
            display: grid;
            grid-template-columns: 125px 22px minmax(0, 1fr);
            gap: 10px;
            min-width: 0;
          }

          .routine-premium .rt-timeline-time {
            padding-top: 17px;
            color: #65766b;
            font-size: 10px;
            font-weight: 800;
            line-height: 1.45;
            text-align: right;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-timeline-track {
            position: relative;
            display: flex;
            justify-content: center;
            min-height: 100%;
          }

          .routine-premium .rt-timeline-track::before {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            width: 1px;
            content: "";
            background: #dce7de;
            transform: translateX(-50%);
          }

          .routine-premium .rt-timeline-row:first-child .rt-timeline-track::before {
            top: 17px;
          }

          .routine-premium .rt-timeline-row:last-child .rt-timeline-track::before {
            bottom: calc(100% - 24px);
          }

          .routine-premium .rt-timeline-dot {
            position: relative;
            z-index: 1;
            display: block;
            width: 10px;
            height: 10px;
            margin-top: 19px;
            border: 2px solid #fff;
            border-radius: 50%;
            background: #91aa97;
            box-shadow: 0 0 0 1px #d6e2d8;
          }

          .routine-premium .rt-timeline-dot.current {
            background: #138808;
            box-shadow: 0 0 0 4px rgba(19, 136, 8, .12);
          }

          .routine-premium .rt-timeline-dot.ended {
            background: #a1aaa3;
          }

          .routine-premium .rt-timeline-card-wrap {
            min-width: 0;
            padding-bottom: 13px;
          }

          .routine-premium .rt-list-card {
            position: relative;
            display: flex;
            min-width: 0;
            overflow: hidden;
            padding: 15px 17px;
            border: 1px solid #e1e9e2;
            border-radius: 14px;
            background: #fff;
            transition: border-color .18s ease, box-shadow .18s ease;
          }

          .routine-premium .rt-list-card.current {
            border-color: #91c29b;
            background: linear-gradient(120deg, #f0faf2, #fff);
            box-shadow: 0 6px 17px rgba(19, 136, 8, .07);
          }

          .routine-premium .rt-list-card.ended {
            background: #fcfdfc;
          }

          .routine-premium .rt-list-card-accent {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 3px;
            background: #16863e;
          }

          .routine-premium .rt-list-card-accent.lab {
            background: var(--rt-saffron);
          }

          .routine-premium .rt-list-card-main {
            flex: 1 1 auto;
            min-width: 0;
          }

          .routine-premium .rt-list-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 8px;
            min-width: 0;
          }

          .routine-premium .rt-list-time-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            min-height: 27px;
            padding: 0 8px;
            border: 1px solid #e3ebe4;
            border-radius: 8px;
            background: #f7faf7;
            color: #5d6e62;
            font-size: 9px;
            font-weight: 800;
          }

          .routine-premium .rt-list-time-chip svg {
            color: var(--rt-green);
          }

          .routine-premium .rt-list-card h3 {
            margin: 10px 0 8px;
            color: var(--rt-ink);
            font-size: 14px;
            font-weight: 820;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-list-room {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #718077;
            font-size: 10px;
            line-height: 1.5;
            overflow-wrap: anywhere;
          }

          .routine-premium .rt-list-room svg {
            flex: 0 0 auto;
            color: #91a096;
          }

          /* EMPTY STATE */
          .routine-premium .rt-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 230px;
            padding: 27px 20px;
            border: 1px dashed #d1dfd4;
            border-radius: 17px;
            background:
              radial-gradient(
                circle at 50% 0%,
                rgba(19, 136, 8, .04),
                transparent 55%
              ),
              #fff;
            text-align: center;
          }

          .routine-premium .rt-empty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 57px;
            height: 57px;
            border: 1px solid #dce8de;
            border-radius: 16px;
            background: linear-gradient(145deg, #fff2e4, #eef7ef);
            color: var(--rt-green);
          }

          .routine-premium .rt-empty h3 {
            margin: 14px 0 6px;
            color: var(--rt-ink);
            font-size: 15px;
            font-weight: 800;
          }

          .routine-premium .rt-empty p {
            max-width: 440px;
            margin: 0;
            color: var(--rt-muted);
            font-size: 11px;
            line-height: 1.7;
          }

          .routine-premium .rt-empty-clear {
            min-height: 37px;
            margin-top: 15px;
            padding: 0 13px;
            border: 1px solid #d4e6d7;
            border-radius: 10px;
            background: #f1f8f2;
            color: var(--rt-green-dark);
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
          }

          /* LOADING */
          .routine-premium .rt-loading {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }

          .routine-premium .rt-loading-card {
            min-height: 160px;
            padding: 18px;
            border: 1px solid #e4ece6;
            border-radius: 16px;
            background: #f8faf8;
            animation: routine-pulse 1.4s ease-in-out infinite;
          }

          .routine-premium .rt-loading-card > span,
          .routine-premium .rt-loading-card > div {
            display: block;
            border-radius: 8px;
            background: #e7eee8;
          }

          .routine-premium .rt-loading-card > span {
            width: 38%;
            height: 12px;
            margin-bottom: 20px;
          }

          .routine-premium .rt-loading-card > div {
            height: 14px;
            margin-top: 13px;
          }

          .routine-premium .rt-loading-card > div:last-child {
            width: 62%;
            height: 9px;
          }

          @keyframes routine-pulse {
            0%, 100% { opacity: .55; }
            50% { opacity: 1; }
          }

          /* RESPONSIVE */
          @media (max-width: 900px) {
            .routine-premium .rt-hero {
              grid-template-columns: minmax(0, 1fr) 210px;
            }

            .routine-premium .rt-hero-copy {
              padding: 26px;
            }

            .routine-premium .rt-hero-card {
              right: 17px;
              width: 157px;
            }
          }

          @media (max-width: 700px) {
            .routine-premium .rt-hero {
              display: block;
              border-radius: 20px;
            }

            .routine-premium .rt-hero-copy {
              padding: 23px 20px 16px;
            }

            .routine-premium .rt-hero-copy h1 {
              font-size: 29px;
            }

            .routine-premium .rt-hero-copy > p {
              font-size: 12px;
            }

            .routine-premium .rt-hero-art {
              min-height: 119px;
            }

            .routine-premium .rt-hero-card {
              top: 3px;
              right: 20px;
              width: 131px;
              height: 102px;
              gap: 5px;
              border-radius: 16px;
              transform: none;
            }

            .routine-premium .rt-hero-card-icon {
              width: 41px;
              height: 41px;
              border-radius: 12px;
            }

            .routine-premium .rt-hero-card-icon svg {
              width: 22px;
              height: 22px;
            }

            .routine-premium .rt-hero-card > span {
              font-size: 7px;
            }

            .routine-premium .rt-hero-card > strong {
              font-size: 9px;
            }

            .routine-premium .rt-orbit-one {
              top: -37px;
              right: -65px;
              width: 220px;
              height: 220px;
            }

            .routine-premium .rt-orbit-two {
              top: -6px;
              right: -32px;
              width: 158px;
              height: 158px;
            }

            .routine-premium .rt-orbit-three {
              top: 19px;
              right: 2px;
              width: 104px;
              height: 104px;
            }

            .routine-premium .rt-dot-one {
              top: 8px;
              right: 174px;
            }

            .routine-premium .rt-dot-two {
              right: 186px;
              bottom: 15px;
            }

            .routine-premium .rt-live-card {
              align-items: flex-start;
              flex-wrap: wrap;
              padding: 14px;
            }

            .routine-premium .rt-live-icon {
              flex-basis: 40px;
              width: 40px;
              height: 40px;
              border-radius: 12px;
            }

            .routine-premium .rt-live-icon svg {
              width: 20px;
              height: 20px;
            }

            .routine-premium .rt-live-main {
              flex: 1 1 calc(100% - 56px);
            }

            .routine-premium .rt-live-right {
              margin-left: 54px;
            }

            .routine-premium .rt-toolbar {
              grid-template-columns: minmax(0, 1fr);
              padding: 10px;
            }

            .routine-premium .rt-toolbar-actions {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
            }

            .routine-premium .rt-view-toggle {
              min-width: 0;
            }

            .routine-premium .rt-view-toggle button {
              flex: 1 1 0;
              padding: 0 8px;
            }

            .routine-premium .rt-refresh {
              min-width: 96px;
            }

            .routine-premium .rt-calendar {
              padding: 15px;
              border-radius: 17px;
            }

            .routine-premium .rt-calendar-heading {
              align-items: flex-start;
              flex-direction: column;
            }

            .routine-premium .rt-week-controls {
              justify-content: flex-start;
              width: 100%;
            }

            .routine-premium .rt-week-controls > span {
              flex: 1 1 auto;
              text-align: center;
            }

            .routine-premium .rt-day-selector {
              display: flex;
              gap: 7px;
              overflow-x: auto;
              padding: 2px 1px 6px;
              scrollbar-width: thin;
              scrollbar-color: #c4d8c8 transparent;
            }

            .routine-premium .rt-day-button {
              flex: 0 0 61px;
              min-height: 72px;
              border-radius: 12px;
            }

            .routine-premium .rt-day-button strong {
              font-size: 18px;
            }

            .routine-premium .rt-section-heading {
              align-items: flex-start;
              flex-direction: column;
              gap: 8px;
            }

            .routine-premium .rt-table-wrap {
              display: none;
            }

            .routine-premium .rt-mobile-timeline {
              display: block;
            }

            .routine-premium .rt-list-view {
              padding: 13px;
            }

            .routine-premium .rt-loading {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .routine-premium .rt-legend {
              align-items: flex-start;
              flex-direction: column;
            }

            .routine-premium .rt-legend-items {
              gap: 10px 13px;
            }

            .routine-premium .rt-schedule-view-header {
              align-items: flex-start;
              flex-wrap: wrap;
              gap: 11px;
              padding: 15px;
            }

            .routine-premium .rt-view-heading-icon {
              flex-basis: 42px;
              width: 42px;
              height: 42px;
              border-radius: 12px;
            }

            .routine-premium .rt-view-heading-icon svg {
              width: 19px;
              height: 19px;
            }

            .routine-premium .rt-view-heading-content {
              flex: 1 1 calc(100% - 58px);
            }

            .routine-premium .rt-view-heading-content strong {
              font-size: 14px;
            }

            .routine-premium .rt-view-heading-subtitle {
              font-size: 10px;
            }

            .routine-premium .rt-order-badge {
              margin-left: 53px;
              min-height: 31px;
              font-size: 9px;
            }
          }

          @media (max-width: 430px) {
            .routine-premium .rt-hero-copy h1 {
              font-size: 26px;
            }

            .routine-premium .rt-hero-tags {
              gap: 6px;
            }

            .routine-premium .rt-hero-tags span {
              font-size: 9px;
            }

            .routine-premium .rt-toolbar-actions {
              grid-template-columns: minmax(0, 1fr);
            }

            .routine-premium .rt-refresh {
              width: 100%;
            }

            .routine-premium .rt-view-toggle {
              width: 100%;
            }

            .routine-premium .rt-view-toggle button {
              font-size: 10px;
            }

            .routine-premium .rt-live-right {
              margin-left: 0;
            }

            .routine-premium .rt-live-clock {
              font-size: 8px;
            }

            .routine-premium .rt-week-controls > span {
              min-width: 90px;
              font-size: 9px;
            }

            .routine-premium .rt-week-controls > .rt-today-button {
              padding: 0 8px;
            }

            .routine-premium .rt-list-card-top {
              align-items: flex-start;
            }

            .routine-premium .rt-order-badge {
              margin-left: 0;
            }

            .routine-premium .rt-legend-items {
              gap: 9px 11px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .routine-premium *,
            .routine-premium *::before,
            .routine-premium *::after {
              animation-duration: .01ms !important;
              transition-duration: .01ms !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}