/// Minimal WebVTT reader used for click-to-seek in the transcript. A transcript block's
/// `cues: [first, last]` are 1-based cue numbers, so we only need each cue's start time.

const TIMING_PATTERN = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s+-->\s+/;

function parseStart(line: string): number | null {
  const match = TIMING_PATTERN.exec(line.trim());
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millis = Number(match[4].padEnd(3, "0"));
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/// Returns the start time in seconds of every cue, in file order (index 0 = cue number 1).
export function parseVttCueStarts(content: string): number[] {
  const starts: number[] = [];
  for (const line of content.replace(/^﻿/, "").split(/\r?\n/)) {
    if (!line.includes("-->")) continue;
    const start = parseStart(line);
    if (start !== null) starts.push(start);
  }
  return starts;
}

/// Formats seconds as m:ss (or h:mm:ss) for the timestamp button.
export function formatTimestamp(totalSeconds: number): string {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${ss}` : `${minutes}:${ss}`;
}
