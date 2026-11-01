// shadcn dashboard-01 block, adapted: our five sections instead of the demo nav.
import * as React from "react";
import {
  IconChartBar,
  IconHeadphones,
  IconHome,
  IconInnerShadowTop,
  IconShoppingCart,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV, type Page } from "../params";

const icons: Record<string, Icon> = {
  orders: IconShoppingCart,
  users: IconUsers,
  products: IconHeadphones,
  homepage: IconHome,
  stats: IconChartBar,
};

export function AppSidebar({
  active,
  onNavigate,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  active: Page;
  onNavigate: (page: Page) => void;
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">
                  audiophile admin
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={NAV.map((n) => ({
            title: n.label,
            page: n.page,
            icon: icons[n.page],
            isActive: n.page === active,
          }))}
          onNavigate={onNavigate}
        />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{ name: "admin", email: "admin@example.com", avatar: "" }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
