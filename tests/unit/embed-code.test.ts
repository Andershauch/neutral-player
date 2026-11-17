import { describe, expect, it } from "vitest";
import { buildEmbedCode } from "@/lib/embed-code";

const base = { baseUrl: "https://example.test", projectId: "abc", projectTitle: "Fleksjob" };

describe("buildEmbedCode", () => {
  it("keeps the classic 16:9 snippet without a text version", () => {
    const code = buildEmbedCode({ ...base, hasTranscript: false });
    expect(code).toContain("padding-top:56.25%;");
    expect(code).not.toContain("embed-resize.js");
    expect(code).toContain('title="Fleksjob"');
  });

  it("adds room for the text row and the optional script with a text version", () => {
    const code = buildEmbedCode({ ...base, hasTranscript: true });
    expect(code).toContain("padding-top:calc(56.25% + 3.5rem)");
    expect(code).toContain('<script src="https://example.test/embed-resize.js" async></script>');
    expect(code).toContain('title="Video: Fleksjob"');
  });

  it("escapes the title so it cannot break out of the attribute", () => {
    const code = buildEmbedCode({ ...base, projectTitle: 'a" onload="x', hasTranscript: false });
    expect(code).toContain('title="a&quot; onload=&quot;x"');
  });
});
