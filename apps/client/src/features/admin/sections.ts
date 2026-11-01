import { paths } from "@/config/paths";
import { Package, type LucideIcon } from "lucide-react";
import { matchPath } from "react-router";

export type AdminSection = {
  /** The sidebar and tab bar label, and the header title while active. */
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only the exact path is this section; a list keeps its entry active on a detail page. */
  end?: boolean;
};

/** One entry per shipped section, in sidebar order. A slice appends its own. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  {
    label: "Orders",
    href: paths.admin.orders.getHref(),
    icon: Package,
  },
];

export const activeAdminSection = (pathname: string) =>
  ADMIN_SECTIONS.find((section) =>
    matchPath({ path: section.href, end: section.end ?? false }, pathname),
  );
