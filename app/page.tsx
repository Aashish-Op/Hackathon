"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type HeroStat = {
  value: number;
  suffix?: string;
  label: string;
  tone?: "ink" | "red";
};

type Cluster = "Silent Dropout" | "At Risk" | "Placement Ready";

type AlertRow = {
  student: string;
  dept: string;
  score: number;
  lastActivity: string;
  cluster: Cluster;
  action: "Send Nudge ->" | "Monitoring";
};

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

const HERO_STATS: HeroStat[] = [
  {
    value: 68,
    suffix: "%",
    label: "Students who never get a personalized intervention",
    tone: "ink",
  },
  {
    value: 30,
    suffix: "+",
    label: "Days a silent dropout goes undetected on average",
    tone: "red",
  },
  {
    value: 11,
    label: "Daily signals tracked per student",
    tone: "ink",
  },
];

const HERO_TYPED_PHRASES = [
  "before disengagement starts.",
  "while intervention still works.",
  "before placement season slips.",
] as const;

const WORKFLOW_STEPS = [
  {
    id: "01",
    title: "Connect your LMS data",
    body: "Securely sync placement, attendance, and assessment signals from your existing systems.",
  },
  {
    id: "02",
    title: "Vigilo scores every student daily",
    body: "The platform recalculates risk every day so emerging issues are surfaced before they become dropouts.",
  },
  {
    id: "03",
    title: "TPC acts on AI recommendations",
    body: "Placement teams execute prioritized interventions and track outcomes from a single action queue.",
  },
] as const;

const ALERT_ROWS: AlertRow[] = [
  {
    student: "Priya M.",
    dept: "CSE",
    score: 23,
    lastActivity: "41 days ago",
    cluster: "Silent Dropout",
    action: "Send Nudge ->",
  },
  {
    student: "Rohan S.",
    dept: "ECE",
    score: 31,
    lastActivity: "35 days ago",
    cluster: "At Risk",
    action: "Send Nudge ->",
  },
  {
    student: "Ananya K.",
    dept: "CSE",
    score: 19,
    lastActivity: "52 days ago",
    cluster: "Silent Dropout",
    action: "Send Nudge ->",
  },
  {
    student: "Dev R.",
    dept: "IT",
    score: 67,
    lastActivity: "3 days ago",
    cluster: "Placement Ready",
    action: "Monitoring",
  },
  {
    student: "Meera P.",
    dept: "EEE",
    score: 28,
    lastActivity: "44 days ago",
    cluster: "Silent Dropout",
    action: "Send Nudge ->",
  },
];

function useInViewOnce<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const timeout = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(timeout);
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, threshold]);

  return [ref, isVisible] as const;
}

function useCountUp(target: number, shouldStart: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!shouldStart) {
      return;
    }

    let frame = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, shouldStart, target]);

  return value;
}

function useTextType(
  phrases: readonly string[],
  typingSpeed = 48,
  deletingSpeed = 28,
  holdDelay = 1200,
) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (phrases.length === 0 || typeof window === "undefined") {
      return;
    }

    const current = phrases[phraseIndex] ?? "";
    const isAtStart = charIndex === 0;
    const isAtEnd = charIndex === current.length;

    let delay = isDeleting ? deletingSpeed : typingSpeed;

    if (!isDeleting && isAtEnd) {
      delay = holdDelay;
    }

    if (isDeleting && isAtStart) {
      delay = 220;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (!isAtEnd) {
          setCharIndex((value) => value + 1);
          return;
        }

        setIsDeleting(true);
        return;
      }

      if (!isAtStart) {
        setCharIndex((value) => value - 1);
        return;
      }

      setIsDeleting(false);
      setPhraseIndex((value) => (value + 1) % phrases.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [charIndex, deletingSpeed, holdDelay, isDeleting, phraseIndex, phrases, typingSpeed]);

  const phrase = phrases[phraseIndex] ?? "";
  return phrase.slice(0, charIndex);
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, isVisible] = useInViewOnce<HTMLDivElement>(0.2);

  return (
    <div
      ref={ref}
      className={cn("reveal", isVisible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function TextType({ words, className }: { words: readonly string[]; className?: string }) {
  const text = useTextType(words);

  return (
    <span className={cn("inline-flex items-center text-[var(--red)]", className)} aria-live="polite">
      <span>{text}</span>
      <span className="cursor-blink ml-1">|</span>
    </span>
  );
}

function HeroStatItem({
  stat,
  start,
  showDivider,
}: {
  stat: HeroStat;
  start: boolean;
  showDivider: boolean;
}) {
  const value = useCountUp(stat.value, start, 1200);

  return (
    <div className="flex items-center">
      <div className="flex min-w-[180px] flex-col items-center px-6 text-center md:min-w-[220px]">
        <p
          className={cn(
            "font-[family-name:var(--font-geist-mono)] text-[40px] leading-none",
            stat.tone === "red" ? "text-[var(--red)]" : "text-[var(--ink)]",
          )}
        >
          {Math.round(value)}
          {stat.suffix}
        </p>
        <p className="mt-2 max-w-[160px] text-[13px] leading-relaxed text-[var(--muted)]">{stat.label}</p>
      </div>
      {showDivider ? <div className="hidden h-14 w-px bg-[rgba(26,26,26,0.15)] md:block" aria-hidden /> : null}
    </div>
  );
}

function HeroStatsRow() {
  const [ref, isVisible] = useInViewOnce<HTMLDivElement>(0.3);

  return (
    <div ref={ref} className="mt-16 w-full max-w-4xl border-t border-[rgba(26,26,26,0.15)] pt-8">
      <div className="flex flex-col items-center justify-center gap-5 md:flex-row md:gap-0">
        {HERO_STATS.map((stat, index) => (
          <HeroStatItem
            key={stat.label}
            stat={stat}
            start={isVisible}
            showDivider={index < HERO_STATS.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function ClusterBadge({ cluster }: { cluster: Cluster }) {
  if (cluster === "Silent Dropout") {
    return <Badge tone="rose">{cluster}</Badge>;
  }

  if (cluster === "At Risk") {
    return <Badge tone="amber">{cluster}</Badge>;
  }

  return <Badge tone="emerald">{cluster}</Badge>;
}

function RadarChart() {
  const labels = ["DSA", "SQL", "System Design", "Communication", "Projects", "Mock Score"];
  const peerValues = [80, 75, 70, 74, 82, 78];
  const studentValues = [36, 31, 26, 42, 34, 29];

  const size = 360;
  const center = size / 2;
  const radius = 125;

  const polygonPoints = (values: number[]) =>
    values
      .map((value, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
        const scaled = (Math.max(0, Math.min(100, value)) / 100) * radius;
        const x = center + scaled * Math.cos(angle);
        const y = center + scaled * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[430px]" aria-label="Skill gap radar">
        {[20, 40, 60, 80, 100].map((ring) => {
          const points = labels
            .map((_, index) => {
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
              const scaled = (ring / 100) * radius;
              const x = center + scaled * Math.cos(angle);
              const y = center + scaled * Math.sin(angle);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polygon
              key={ring}
              points={points}
              fill="none"
              stroke="rgba(26,26,26,0.15)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {labels.map((label, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
          const lineX = center + radius * Math.cos(angle);
          const lineY = center + radius * Math.sin(angle);
          const labelX = center + (radius + 22) * Math.cos(angle);
          const labelY = center + (radius + 22) * Math.sin(angle);

          return (
            <g key={label}>
              <line
                x1={center}
                y1={center}
                x2={lineX}
                y2={lineY}
                stroke="rgba(26,26,26,0.15)"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--muted)"
                fontSize="10"
                fontFamily="var(--font-geist-mono)"
              >
                {label}
              </text>
            </g>
          );
        })}

        <polygon
          points={polygonPoints(peerValues)}
          fill="rgba(26,26,26,0.06)"
          stroke="var(--ink)"
          strokeWidth="1.5"
        />
        <polygon
          points={polygonPoints(studentValues)}
          fill="rgba(192,57,43,0.08)"
          stroke="var(--red)"
          strokeWidth="1.5"
        />
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 border border-[var(--ink)] bg-[rgba(26,26,26,0.06)]" aria-hidden />
          <span>Placed peer median</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 border border-[var(--red)] bg-[rgba(192,57,43,0.08)]" aria-hidden />
          <span>Student profile</span>
        </div>
      </div>
    </div>
  );
}

function ImpactSimulator() {
  const [students, setStudents] = useState(240);
  const [effectiveness, setEffectiveness] = useState(45);

  const projectedLift = useMemo(() => {
    const computed = ((students * effectiveness) / 500) * 18;
    return computed.toFixed(1);
  }, [effectiveness, students]);

  return (
    <div className="w-full max-w-xl">
      <div className="border-b border-[rgba(26,26,26,0.2)] pb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Students to intervene</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[var(--ink)]">{students}</span>
        </div>
        <Slider
          min={0}
          max={500}
          step={10}
          value={[students]}
          onValueChange={(value) => setStudents(value[0] ?? 0)}
          aria-label="Students to intervene"
        />
      </div>

      <div className="mt-7 border-b border-[rgba(26,26,26,0.2)] pb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Nudge effectiveness</span>
          <span className="font-[family-name:var(--font-geist-mono)] text-sm text-[var(--ink)]">
            {effectiveness}%
          </span>
        </div>
        <Slider
          min={10}
          max={80}
          step={5}
          value={[effectiveness]}
          onValueChange={(value) => setEffectiveness(value[0] ?? 10)}
          aria-label="Nudge effectiveness"
        />
      </div>

      <div className="mt-8 flex items-end gap-3">
        <span className="font-[family-name:var(--font-geist-mono)] text-[30px] leading-none text-[var(--red)]">+ </span>
        <span className="font-[family-name:var(--font-dm-serif-display)] text-[62px] leading-[0.95] text-[var(--ink)]">
          {projectedLift}%
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">projected placement lift</p>
      <p className="mt-2 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
        Formula: ((students x effectiveness) / 500) x 18
      </p>
    </div>
  );
}

function AuditLogPanel() {
  return (
    <div className="rounded-[4px] bg-[var(--ink)] px-6 py-5">
      <p className="font-[family-name:var(--font-geist-mono)] text-[12px] leading-[2] text-[rgba(245,240,232,0.65)]">
        <span className="text-[#e06c5a]">[09:12:03]</span> <span className="text-[var(--paper)]">NUDGE_SENT</span>{" "}
        priya.m | score:23 | channel:email
      </p>
      <p className="font-[family-name:var(--font-geist-mono)] text-[12px] leading-[2] text-[rgba(245,240,232,0.65)]">
        <span className="text-[#e06c5a]">[09:12:04]</span>{" "}
        <span className="text-[var(--paper)]">ALERT_RESOLVED</span> silent_30 | student:priya.m
      </p>
      <p className="font-[family-name:var(--font-geist-mono)] text-[12px] leading-[2] text-[rgba(245,240,232,0.65)]">
        <span className="text-[#e06c5a]">[09:13:41]</span> <span className="text-[var(--paper)]">NUDGE_SENT</span>{" "}
        ananya.k | score:19 | channel:email
      </p>
      <p className="font-[family-name:var(--font-geist-mono)] text-[12px] leading-[2] text-[rgba(245,240,232,0.65)]">
        <span className="text-[#e06c5a]">[09:14:02]</span>{" "}
        <span className="text-[var(--paper)]">CLUSTER_CHANGE</span> rohan.s | at_risk {"->"} silent_dropout
        <span className="cursor-blink ml-1 text-[var(--paper)]">|</span>
      </p>
    </div>
  );
}

export default function Home() {
  usePageTitle("Vigilo - Placement Intelligence Platform");

  const [showNavBorder, setShowNavBorder] = useState(false);
  const [queuedNudges, setQueuedNudges] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState("");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dashboardHref, setDashboardHref] = useState("/login");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setShowNavBorder(window.scrollY > 6);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (session?.user) {
          const fullName =
            (session.user.user_metadata?.full_name as string | undefined) ||
            (session.user.email?.split("@")[0] ?? "User");

          setSessionUser({
            id: session.user.id,
            email: session.user.email || "",
            displayName: fullName,
          });
          setDashboardHref("/dashboard");
        } else {
          setSessionUser(null);
          setDashboardHref("/login");
        }
      } catch {
        if (active) {
          setSessionUser(null);
          setDashboardHref("/login");
        }
      } finally {
        if (active) {
          setSessionLoading(false);
        }
      }
    };

    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!actionMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActionMessage("");
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [actionMessage]);

  const queueNudge = (studentName: string) => {
    setQueuedNudges((previous) => ({
      ...previous,
      [studentName]: true,
    }));
    setActionMessage(`Nudge queued for ${studentName}.`);
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore logout network issues and clear local session state.
    }

    setProfileMenuOpen(false);
    setSessionUser(null);
    setDashboardHref("/login");
    setActionMessage("Signed out.");
  };

  const vars = {
    "--paper": "#F5F0E8",
    "--ink": "#1A1A1A",
    "--red": "#C0392B",
    "--muted": "#5A5550",
    "--tint": "#EDE8DE",
  } as CSSProperties;

  return (
    <div style={vars} className="bg-[var(--paper)] text-[var(--ink)]">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 bg-[var(--paper)] transition-[border-color] duration-200",
          showNavBorder ? "border-b border-[rgba(26,26,26,0.15)]" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-2">
            <span aria-hidden className="nav-dot h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
            <span className="font-[family-name:var(--font-dm-serif-display)] text-[22px] text-[var(--ink)]">Vigilo</span>
          </a>

          <div className="flex items-center gap-4">
            {sessionLoading ? (
              <span className="text-sm text-[var(--muted)]">Checking...</span>
            ) : sessionUser ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  className="rounded-[4px] border border-[rgba(26,26,26,0.2)] px-4 py-2 text-sm text-[var(--ink)]"
                >
                  Profile
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 top-11 z-50 w-56 border border-[rgba(26,26,26,0.18)] bg-[var(--paper)] p-3 shadow-[0_8px_24px_rgba(26,26,26,0.08)]">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                      Signed in as
                    </p>
                    <p className="mt-1 text-sm text-[var(--ink)]">{sessionUser.displayName}</p>
                    <p className="text-xs text-[var(--muted)]">{sessionUser.email}</p>

                    <div className="mt-3 border-t border-[rgba(26,26,26,0.12)] pt-2">
                      <Link href="/dashboard/profile" className="block py-1 text-sm text-[var(--ink)]">
                        View Profile
                      </Link>
                      <button type="button" onClick={logout} className="block py-1 text-sm text-[var(--red)]">
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/login" className="text-sm text-[var(--muted)]">
                Login
              </Link>
            )}
            <Link
              href={dashboardHref}
              className="rounded-[4px] border border-[rgba(26,26,26,0.2)] px-4 py-2 text-sm text-[var(--ink)]"
            >
              View Dashboard
            </Link>
            <Link
              href="/login"
              className="rounded-[4px] bg-[var(--red)] px-5 py-2 text-sm text-[var(--paper)]"
            >
              Request Access
            </Link>
          </div>
        </div>
      </header>

      <main id="top" className="pt-16">
        <section className="flex min-h-screen items-center bg-[var(--paper)] px-6 py-20">
          <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center text-center">
            <Reveal>
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">
                PLACEMENT INTELLIGENCE PLATFORM
              </p>

              <h1 className="mx-auto mt-6 max-w-[700px] font-[family-name:var(--font-dm-serif-display)] text-[36px] leading-[1.1] text-[var(--ink)] md:text-[56px]">
                Every student has a placement risk score.
                <br />
                Most TPCs find out too late.
              </h1>

              <p className="mx-auto mt-6 max-w-[620px] text-[18px] leading-[1.7] text-[var(--muted)]">
                Vigilo tracks 11 daily signals and flags at-risk students{" "}
                <TextType words={HERO_TYPED_PHRASES} />
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="rounded-[4px] bg-[var(--red)] px-8 py-3.5 text-[15px] text-[var(--paper)]"
                >
                  Request Early Access
                </Link>
                <Link
                  href={dashboardHref}
                  className="rounded-[4px] border border-[rgba(26,26,26,0.24)] px-8 py-3.5 text-[15px] text-[var(--ink)]"
                >
                  View Dashboard
                </Link>
                <a href="#how-it-works" className="text-[15px] text-[var(--muted)]">
                  See how it works {"->"}
                </a>
              </div>

              <HeroStatsRow />
            </Reveal>
          </div>
        </section>

        <section id="how-it-works" className="bg-[var(--tint)] px-6 py-20">
          <div className="mx-auto w-full max-w-[1100px]">
            <Reveal>
              <p className="text-center font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                THE WORKFLOW
              </p>
              <h2 className="mx-auto mt-4 max-w-[520px] text-center font-[family-name:var(--font-dm-serif-display)] text-[32px] leading-[1.2] text-[var(--ink)]">
                From raw data to intervention in one workflow.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {WORKFLOW_STEPS.map((step, index) => (
                <Reveal key={step.id} delay={80 * index}>
                  <div className="mx-auto max-w-[290px] text-center md:text-left">
                    <div className="flex items-center justify-center gap-3 md:justify-start">
                      <span className="h-px w-10 bg-[rgba(26,26,26,0.15)]" aria-hidden />
                      <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                        {step.id}
                      </span>
                      <span className="h-px w-10 bg-[rgba(26,26,26,0.15)]" aria-hidden />
                    </div>

                    <h3 className="mt-4 font-[family-name:var(--font-dm-serif-display)] text-[20px] text-[var(--ink)]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-[1.7] text-[var(--muted)]">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--paper)] px-6 py-20">
          <div className="mx-auto w-full max-w-[1100px]">
            <Reveal>
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">
                LIVE SILENT-30 ALERT QUEUE
              </p>
              <h2 className="mt-4 max-w-[560px] font-[family-name:var(--font-dm-serif-display)] text-[32px] leading-[1.2] text-[var(--ink)]">
                Vigilo flagged these students this morning.
                <br />
                Before anyone noticed.
              </h2>
            </Reveal>

            <Reveal delay={80} className="mt-10">
              <div className="overflow-x-auto border-y border-[rgba(26,26,26,0.15)] bg-[var(--tint)]">
                <table className="w-full min-w-[760px] border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(26,26,26,0.25)]">
                      {["Student", "Dept", "Vigilo Score", "Last Activity", "Cluster", "Action"].map((column) => (
                        <th
                          key={column}
                          className="px-3 py-3 text-left font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALERT_ROWS.map((row, index) => (
                      <tr
                        key={row.student}
                        className={cn(index < ALERT_ROWS.length - 1 && "border-b border-[rgba(26,26,26,0.1)]")}
                      >
                        <td className="px-3 py-3 text-[15px] text-[var(--ink)]">{row.student}</td>
                        <td className="px-3 py-3 text-[15px] text-[var(--ink)]">{row.dept}</td>
                        <td
                          className={cn(
                            "px-3 py-3 font-[family-name:var(--font-geist-mono)] text-[15px]",
                            row.score < 40 ? "text-[var(--red)]" : "text-[var(--ink)]",
                          )}
                        >
                          {row.score}
                        </td>
                        <td className="px-3 py-3 text-[15px] text-[var(--ink)]">{row.lastActivity}</td>
                        <td className="px-3 py-3">
                          <ClusterBadge cluster={row.cluster} />
                        </td>
                        <td className="px-3 py-3 text-[13px]">
                          {row.action === "Monitoring" ? (
                            <span className="text-[var(--muted)]">Monitoring</span>
                          ) : queuedNudges[row.student] ? (
                            <span className="text-[var(--muted)]">Queued</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => queueNudge(row.student)}
                              className="text-[var(--red)]"
                            >
                              {row.action}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 font-[family-name:var(--font-geist-mono)] text-[11px] italic text-[var(--muted)]">
                Auto-flagged by Vigilo | 3 AI nudges dispatched this morning | Full audit trail maintained
              </p>
              <div aria-live="polite" className="mt-2 min-h-5 text-[12px] text-[var(--red)]">
                {actionMessage}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-[var(--paper)] px-6 py-20">
          <div className="mx-auto grid w-full max-w-[1000px] gap-14 md:grid-cols-2 md:gap-20">
            <Reveal>
              <div>
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                  SKILL GAP RADAR
                </p>
                <h3 className="mt-3 max-w-[360px] font-[family-name:var(--font-dm-serif-display)] text-[28px] leading-[1.2] text-[var(--ink)]">
                  See exactly what is missing, not just that they are at risk.
                </h3>
                <p className="mt-4 text-[15px] leading-[1.7] text-[var(--muted)]">
                  Compare any student profile against already-placed peers across DSA, SQL, System Design,
                  communication, projects, and mock performance.
                </p>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <RadarChart />
            </Reveal>
          </div>
        </section>

        <section className="bg-[var(--tint)] px-6 py-20">
          <div className="mx-auto grid w-full max-w-[1000px] gap-14 md:grid-cols-2 md:gap-20">
            <Reveal>
              <ImpactSimulator />
            </Reveal>
            <Reveal delay={80}>
              <div>
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                  IMPACT SIMULATOR
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-dm-serif-display)] text-[28px] leading-[1.2] text-[var(--ink)]">
                  Project placement lift before committing resources.
                </h3>
                <p className="mt-4 text-[15px] leading-[1.7] text-[var(--muted)]">
                  Tune intervention scale and estimated nudge effectiveness. Vigilo translates assumptions
                  into a clear projected lift percentage for leadership discussions.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-[var(--paper)] px-6 py-20">
          <div className="mx-auto grid w-full max-w-[1000px] gap-14 md:grid-cols-2 md:gap-20">
            <Reveal>
              <div>
                <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                  AUDIT TRAIL
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-dm-serif-display)] text-[28px] leading-[1.2] text-[var(--ink)]">
                  Every intervention is logged. Every nudge is accountable.
                </h3>
                <p className="mt-4 text-[15px] leading-[1.7] text-[var(--muted)]">
                  Keep a timestamped trail of every TPC action per student. Exportable logs are ready for
                  internal reporting and accreditation checks.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <AuditLogPanel />
            </Reveal>
          </div>
        </section>

        <section id="final-cta" className="bg-[var(--ink)] px-6 py-[100px] text-[var(--paper)]">
          <div className="mx-auto w-full max-w-[1100px] text-center">
            <Reveal>
              <h2 className="mx-auto max-w-[580px] font-[family-name:var(--font-dm-serif-display)] text-[42px] leading-[1.15] md:text-[46px]">
                Your next placed student is currently flagged as At Risk.
              </h2>
              <p className="mx-auto mt-4 max-w-[420px] text-[18px] text-[rgba(245,240,232,0.68)]">
                Vigilo can tell you who.
              </p>

              <Link
                href="/login"
                className="mt-10 inline-block rounded-[4px] bg-[var(--red)] px-10 py-4 text-[16px] text-[var(--paper)]"
              >
                Request Early Access
              </Link>

              <div className="mt-6 flex flex-col items-center justify-center gap-4 font-[family-name:var(--font-geist-mono)] text-[11px] text-[rgba(245,240,232,0.45)] sm:flex-row">
                <span>No commitment required</span>
                <span>Built on FastAPI + Supabase | Self-hostable</span>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-[rgba(26,26,26,0.15)] bg-[var(--paper)] px-6 py-6">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span className="font-[family-name:var(--font-dm-serif-display)] text-[16px] text-[var(--ink)]">Vigilo</span>
          <nav className="flex items-center gap-6 text-[13px] text-[var(--muted)]">
            <Link href="/privacy">Privacy</Link>
            <Link href="/docs">Docs</Link>
            <a href="https://github.com/Arjun-Walia/hackathon" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
