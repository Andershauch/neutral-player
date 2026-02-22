"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

interface OnboardingChecklistCardProps {
  hasProject: boolean;
  hasUploadedVariant: boolean;
  hasCopiedEmbed: boolean;
  isCompleted: boolean;
  firstProjectId: string | null;
  forceExpanded?: boolean;
}

const HIDE_KEY = "onboarding_hidden_v1";

export default function OnboardingChecklistCard({
  hasProject,
  hasUploadedVariant,
  hasCopiedEmbed,
  isCompleted,
  firstProjectId,
  forceExpanded = false,
}: OnboardingChecklistCardProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(isCompleted && !forceExpanded);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!isCompleted) {
      setIsCollapsed(false);
      setIsHidden(false);
      return;
    }

    if (forceExpanded) {
      setIsCollapsed(false);
      setIsHidden(false);
      return;
    }

    const hidden = window.localStorage.getItem(HIDE_KEY) === "1";
    setIsHidden(hidden);
    setIsCollapsed(!hidden);
  }, [forceExpanded, isCompleted]);

  const completedSteps = useMemo(() => {
    let total = 0;
    if (hasProject) total += 1;
    if (hasUploadedVariant) total += 1;
    if (hasCopiedEmbed) total += 1;
    if (isCompleted) total += 1;
    return total;
  }, [hasCopiedEmbed, hasProject, hasUploadedVariant, isCompleted]);

  const readyToComplete = hasProject && hasUploadedVariant && hasCopiedEmbed;
  const progressPercent = Math.round((completedSteps / 4) * 100);

  const markCompleted = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "completed" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke opdatere onboarding.");
      }
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ukendt fejl";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const hideFromDashboard = () => {
    window.localStorage.setItem(HIDE_KEY, "1");
    setIsHidden(true);
    setIsCollapsed(false);
    if (forceExpanded) {
      router.push("/admin/dashboard");
      router.refresh();
    }
  };

  const showInDashboard = () => {
    window.localStorage.removeItem(HIDE_KEY);
    setIsHidden(false);
    setIsCollapsed(false);
  };

  if (isCompleted && isHidden && !forceExpanded) {
    return null;
  }

  if (isCompleted && isCollapsed) {
    return (
      <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Onboarding er gennemført</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={showInDashboard}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
          >
            Vis onboarding
          </button>
          <button
            type="button"
            onClick={hideFromDashboard}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Skjul
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-5 md:p-8 shadow-sm space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Kom i gang</p>
          {isCompleted && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={hideFromDashboard}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Skjul
              </button>
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Onboarding-guide</h2>
        <p className="text-sm text-gray-500">Følg disse trin for at få dit første projekt helt i mål.</p>
      </div>

      <div className="space-y-2">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-xs font-semibold text-gray-500">{completedSteps}/4 trin gennemført</p>
      </div>

      <div className="space-y-3">
        <Step done={hasProject} label="1. Opret dit første projekt" hint="Klik på 'Nyt projekt' øverst på siden." />
        <Step
          done={hasUploadedVariant}
          label="2. Upload din første video"
          hint="Åbn projektet og upload en sprogversion."
          action={
            firstProjectId ? (
              <Link href={`/admin/embed/${firstProjectId}`} className="text-blue-600 hover:text-blue-700 text-xs font-black uppercase tracking-widest">
                Åbn projekt
              </Link>
            ) : null
          }
        />
        <Step done={hasCopiedEmbed} label="3. Kopiér din embed-kode" hint="Brug knappen 'Hent embed-kode' på et projekt." />
        <Step
          done={isCompleted}
          label="4. Marker onboarding som færdig"
          hint="Når de første tre trin er klaret, kan du afslutte onboarding."
          action={
            !isCompleted ? (
              <button
                type="button"
                onClick={markCompleted}
                disabled={!readyToComplete || saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {saving ? "Gemmer..." : "Marker som færdig"}
              </button>
            ) : null
          }
        />
      </div>

      {isCompleted && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Onboarding er gennemført</p>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function Step({
  done,
  label,
  hint,
  action,
}: {
  done: boolean;
  label: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
      <div
        className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black ${
          done ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {done ? "✓" : "•"}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}

