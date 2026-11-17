"use client";

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

/// Height of the summary row. Must match the extra `3.5rem` in the embed code's
/// wrapper (docs/transcript-plan.md, "Højde og embed-kode").
const SUMMARY_HEIGHT = "3.5rem";

/// Accessible text version below the video. All text is rendered as plain text
/// (React escapes it), never as HTML. `h2` is used for section headings because
/// the iframe is its own document.
export default function TranscriptDetails({
  transcript,
  lang,
  open,
  onOpenChange,
  growWithText = false,
}: TranscriptDetailsProps) {
  return (
    <details
      lang={lang}
      dir={getTranscriptDirection(lang)}
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
      className="np-transcript shrink-0 bg-white text-gray-900"
    >
      <summary
        className="flex cursor-pointer items-center px-4 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-blue-600"
        style={{ minHeight: SUMMARY_HEIGHT }}
      >
        {transcript.summary}
      </summary>
      <div
        {...{ [TRANSCRIPT_BODY_ATTRIBUTE]: "" }}
        className="space-y-3 overflow-y-auto border-t border-gray-200 px-4 py-4 text-sm leading-relaxed"
        style={growWithText ? undefined : { maxHeight: `calc(55vh - ${SUMMARY_HEIGHT})` }}
      >
        {transcript.sections.map((section, sectionIndex) => (
          <section key={sectionIndex} className="space-y-2">
            <h2 className="text-base font-bold">{section.heading}</h2>
            {section.blocks.map((block, blockIndex) =>
              block.type === "speech" ? (
                <p key={blockIndex}>
                  <strong>{transcript.speaker}:</strong> {block.text}
                </p>
              ) : (
                <p key={blockIndex}>
                  <em>[{block.text}]</em>
                </p>
              ),
            )}
          </section>
        ))}
      </div>
    </details>
  );
}
