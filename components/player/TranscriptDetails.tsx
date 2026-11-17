"use client";

import { useId } from "react";
import { getTranscriptDirection, type TranscriptData } from "@/lib/transcript";
import { TRANSCRIPT_BODY_ATTRIBUTE } from "@/components/player/useEmbedHeightReporter";

interface TranscriptDetailsProps {
  transcript: TranscriptData;
  lang: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /// True when the host page's resize script is active: the iframe grows with the text,
  /// so the text no longer needs its own height limit and scrollbar.
  growWithText?: boolean;
}

/// Height of the button row. Must match the extra `3.5rem` in the embed code's
/// wrapper (docs/transcript-plan.md, "Højde og embed-kode").
const SUMMARY_HEIGHT = "3.5rem";

/// Accessible text version below the video, as a disclosure button (`aria-expanded` +
/// `aria-controls`) and a labelled region. A native <details>/<summary> was tried first,
/// but Windows Narrator did not read its content; the button pattern is supported everywhere.
/// All text is rendered as plain text (React escapes it), never as HTML. `h2` is used
/// for section headings because the iframe is its own document.
export default function TranscriptDetails({
  transcript,
  lang,
  open,
  onOpenChange,
  growWithText = false,
}: TranscriptDetailsProps) {
  const id = useId();
  const buttonId = `${id}-button`;
  const bodyId = `${id}-body`;

  return (
    <div lang={lang} dir={getTranscriptDirection(lang)} className="np-transcript shrink-0 bg-white text-gray-900">
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => onOpenChange(!open)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 text-start text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-blue-600"
        style={{ minHeight: SUMMARY_HEIGHT }}
      >
        <span>{transcript.summary}</span>
        <span aria-hidden="true" className={`shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      <div
        id={bodyId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        {...{ [TRANSCRIPT_BODY_ATTRIBUTE]: "" }}
        className="space-y-3 overflow-y-auto border-t border-gray-200 px-4 py-4 text-sm leading-relaxed"
        style={growWithText ? undefined : { maxHeight: `calc(55vh - ${SUMMARY_HEIGHT})` }}
      >
        {transcript.sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="space-y-2">
            {/* Inline style: the unlayered h1-h6 rule in globals.css upper-cases headings and beats
                utility classes. All caps makes screen readers spell words like "fleksjob" letter by letter. */}
            <h2 className="text-base font-bold" style={{ textTransform: "none" }}>{section.heading}</h2>
            {section.blocks.map((block, blockIndex) =>
              block.type === "speech" ? (
                <p key={blockIndex}>
                  <strong>{transcript.speaker}:</strong> {block.text}
                </p>
              ) : (
                <p key={blockIndex}>
                  <em>
                    <span aria-hidden="true">[</span>
                    {block.text}
                    <span aria-hidden="true">]</span>
                  </em>
                </p>
              ),
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
