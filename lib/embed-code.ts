/// Builds the embed snippet shown in the admin.
/// With a text version the wrapper gets an extra 3.5rem for the "Læs tekstversion" row
/// (must match SUMMARY_HEIGHT in components/player/TranscriptDetails.tsx) and the
/// optional resize script is included. Without one the snippet is the classic 16:9 box.

export interface EmbedCodeInput {
  baseUrl: string;
  projectId: string;
  projectTitle: string;
  hasTranscript: boolean;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildEmbedCode({ baseUrl, projectId, projectTitle, hasTranscript }: EmbedCodeInput): string {
  const title = escapeAttribute(hasTranscript ? `Video: ${projectTitle}` : projectTitle);
  const paddingTop = hasTranscript ? "calc(56.25% + 3.5rem)" : "56.25%";
  const wrapper = `<div style="position:relative;padding-top:${paddingTop};width:100%;overflow:hidden;border-radius:12px;background:#000;">
  <iframe
    src="${baseUrl}/embed/${projectId}"
    loading="lazy"
    style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    title="${title}">
  </iframe>
</div>`;
  return hasTranscript ? `${wrapper}\n<script src="${baseUrl}/embed-resize.js" async></script>` : wrapper;
}
