export type InternalTool = {
  href: string;
  label: string;
  summary: string;
  status: "live" | "guided";
  area: string;
};

export const INTERNAL_TOOLS: InternalTool[] = [
  {
    href: "/internal",
    label: "Branding",
    summary: "Administrer globale themes, kunde-overrides og historik for branding-sporet.",
    status: "live",
    area: "Platform og kunder",
  },
  {
    href: "/internal/marketing",
    label: "Marketing",
    summary: "Redigér marketing-indhold med draft, preview, publish og rollback.",
    status: "live",
    area: "Public content",
  },
];

export function getInternalTool(pathname: string) {
  return INTERNAL_TOOLS.find((tool) => {
    if (tool.href === "/internal") {
      return pathname === "/internal";
    }
    return pathname.startsWith(tool.href);
  }) ?? null;
}
