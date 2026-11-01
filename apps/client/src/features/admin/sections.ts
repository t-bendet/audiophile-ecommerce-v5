import { paths } from "@/config/paths";
import {
  Boxes,
  ChartColumn,
  LayoutTemplate,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import { matchPath } from "react-router";

export type AdminSection = {
  /** The sidebar and tab bar label, and the header title while active. */
  label: string;
  href: string;
  icon: LucideIcon;
  /** Only the exact path is this section; a list keeps its entry active on a detail page. */
  end?: boolean;
  /** Also the page `/admin` itself renders, so the entry is active there too. */
  index?: boolean;
};

/** One entry per shipped section, in sidebar order. A slice appends its own. */
export const ADMIN_SECTIONS: readonly AdminSection[] = [
  {
    label: "Orders",
    href: paths.admin.orders.getHref(),
    icon: Package,
  },
  {
    label: "Users",
    href: paths.admin.users.getHref(),
    icon: Users,
  },
  {
    label: "Products",
    href: paths.admin.products.getHref(),
    icon: Boxes,
  },
  {
    label: "Homepage",
    href: paths.admin.homepage.getHref(),
    icon: LayoutTemplate,
  },
  {
    label: "Stats",
    href: paths.admin.stats.getHref(),
    icon: ChartColumn,
    index: true,
  },
];

export const isAdminIndex = (pathname: string) =>
  matchPath({ path: paths.admin.root.path, end: true }, pathname) !== null;

export const activeAdminSection = (pathname: string) =>
  ADMIN_SECTIONS.find(
    (section) =>
      matchPath({ path: section.href, end: section.end ?? false }, pathname) ||
      (section.index && isAdminIndex(pathname)),
  );
