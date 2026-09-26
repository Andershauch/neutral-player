import { describe, expect, it } from "vitest";
import { formatPlayerTime } from "@/components/player/CustomMuxPlayer";

describe("formatPlayerTime", () => {
  it("formats seconds under a minute as M:SS", () => {
    expect(formatPlayerTime(0)).toBe("0:00");
    expect(formatPlayerTime(7)).toBe("0:07");
    expect(formatPlayerTime(59)).toBe("0:59");
  });

  it("formats minutes without a leading zero once past 9:59", () => {
    expect(formatPlayerTime(60)).toBe("1:00");
    expect(formatPlayerTime(634)).toBe("10:34");
  });

  it("switches to H:MM:SS once past an hour", () => {
    expect(formatPlayerTime(3600)).toBe("1:00:00");
    expect(formatPlayerTime(3725)).toBe("1:02:05");
  });

  it("handles invalid input defensively, since duration is NaN before metadata loads", () => {
    expect(formatPlayerTime(NaN)).toBe("0:00");
    expect(formatPlayerTime(-5)).toBe("0:00");
    expect(formatPlayerTime(Infinity)).toBe("0:00");
  });
});
