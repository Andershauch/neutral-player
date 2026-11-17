"use client";

import { useEffect, useState } from "react";

export const TRANSCRIPT_BODY_ATTRIBUTE = "data-np-transcript-body";

const SUMMARY_ROWS_REM = 3.5; // keep in sync with SUMMARY_HEIGHT in TranscriptDetails

/// Reports the height the embed would like to have to the host page, so the optional
/// `embed-resize.js` can grow and shrink the iframe. Only runs inside an iframe and
/// only for embeds that have a text version.
///
/// The height is computed (16:9 video + summary row + the text's natural height), not
/// measured from the page: an iframe's own document is never shorter than the iframe,
/// so a measurement could never shrink it again.
///
/// Returns `true` once the host script has answered, i.e. when resizing works.
export function useEmbedHeightReporter({
  enabled,
  hasActiveTranscript,
  transcriptOpen,
  contentKey,
}: {
  enabled: boolean;
  hasActiveTranscript: boolean;
  transcriptOpen: boolean;
  /// Changes when the visible text changes (language switch).
  contentKey: string;
}): boolean {
  const [resizeActive, setResizeActive] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || window.parent === window) return;

    const measure = () => {
      const width = document.documentElement.clientWidth;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      let height = (width * 9) / 16;
      if (hasActiveTranscript) {
        height += SUMMARY_ROWS_REM * rem;
        const body = document.querySelector<HTMLElement>(`[${TRANSCRIPT_BODY_ATTRIBUTE}]`);
        if (transcriptOpen && body) height += body.scrollHeight + 1; // +1: border-top
      }
      return Math.ceil(height);
    };

    const report = () => {
      window.parent.postMessage({ type: "neutralplayer:height", height: measure() }, "*");
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const type = (event.data as { type?: unknown } | null)?.type;
      if (type === "neutralplayer:resize-active") setResizeActive(true);
      if (type === "neutralplayer:parent-ready") report();
    };

    window.addEventListener("message", onMessage);
    report();

    const observer = new ResizeObserver(report);
    observer.observe(document.documentElement);
    const body = document.querySelector(`[${TRANSCRIPT_BODY_ATTRIBUTE}]`);
    if (body) observer.observe(body);

    return () => {
      window.removeEventListener("message", onMessage);
      observer.disconnect();
    };
    // contentKey re-runs the effect when the language (and so the text) changes.
  }, [enabled, hasActiveTranscript, transcriptOpen, contentKey]);

  return resizeActive;
}
