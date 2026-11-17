import { describe, expect, it } from "vitest";
import { formatTimestamp, parseVttCueStarts } from "@/lib/vtt";

describe("parseVttCueStarts", () => {
  it("reads the start of each cue in order", () => {
    const vtt = "WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.180\nHej\n\n2\n00:00:02.180 --> 00:00:04.719\nDav\n\n3\n00:01:05.500 --> 00:01:08.000\nIgen\n";
    expect(parseVttCueStarts(vtt)).toEqual([0, 2.18, 65.5]);
  });

  it("handles hours, short timestamps, CRLF and a BOM", () => {
    const vtt = "﻿WEBVTT\r\n\r\n01:02:03.004 --> 01:02:05.000\r\nA\r\n\r\n00:09.500 --> 00:10.000\r\nB\r\n";
    expect(parseVttCueStarts(vtt)).toEqual([3723.004, 9.5]);
  });

  it("returns an empty list for text without cues", () => {
    expect(parseVttCueStarts("WEBVTT\n\nNOTE ingen cues")).toEqual([]);
  });
});

describe("formatTimestamp", () => {
  it("formats minutes and hours", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(65.9)).toBe("1:05");
    expect(formatTimestamp(3723)).toBe("1:02:03");
  });
});
