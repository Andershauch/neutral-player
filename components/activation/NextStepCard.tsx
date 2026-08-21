import Link from "next/link";
import type { ActivationState } from "@/lib/activation";

interface NextStepCardProps {
  activation: ActivationState;
  /// "full" viser hele trinlisten. "compact" viser kun det næste skridt.
  variant?: "full" | "compact";
}

/// Den ene visning af "hvor er jeg, og hvad gør jeg nu".
/// Bruges på setup, dashboard og i projekt-editoren, så nummereringen er ens overalt.
export default function NextStepCard({ activation, variant = "full" }: NextStepCardProps) {
  const { steps, nextStep, completedCount, totalCount, progressPercent, plan } = activation;

  if (!nextStep) {
    return null;
  }

  return (
    <section className="np-card rounded-2xl border-gray-200/90 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            Trin {nextStep.number} af {totalCount}
          </p>
          <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">{nextStep.title}</h2>
          <p className="max-w-prose text-sm text-gray-500">{nextStep.detail}</p>
        </div>

        <Link href={nextStep.href} className="np-btn-primary inline-flex shrink-0 px-5 py-3">
          {nextStep.actionLabel}
        </Link>
      </div>

      {plan.isTrial && plan.trialDaysLeft !== null ? (
        <p className="mt-4 text-xs font-semibold text-amber-700">
          Prøveperiode: {plan.trialDaysLeft} {plan.trialDaysLeft === 1 ? "dag" : "dage"} tilbage. Afspilleren viser et
          vandmærke, indtil I vælger en plan.
        </p>
      ) : null}

      <div className="mt-5 space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-xs font-semibold text-gray-500">
          {completedCount} af {totalCount} trin gennemført
        </p>
      </div>

      {variant === "full" ? (
        <ol className="mt-5 space-y-2">
          {steps.map((step) => {
            const isNext = step.key === nextStep.key;
            return (
              <li
                key={step.key}
                className={`flex items-start gap-3 rounded-xl border p-3 ${
                  isNext ? "border-blue-200 bg-blue-50/60" : "border-gray-100"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    step.done
                      ? "bg-emerald-100 text-emerald-700"
                      : isNext
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500"
                  }`}
                  aria-hidden
                >
                  {step.done ? "✓" : step.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-black uppercase tracking-widest ${
                      step.done ? "text-gray-400 line-through" : "text-gray-800"
                    }`}
                  >
                    {step.title}
                  </p>
                  {!step.done ? <p className="mt-1 text-xs text-gray-500">{step.detail}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
