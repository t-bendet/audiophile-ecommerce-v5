import Logo from "@/assets/logo.svg?react";
import { Metadata } from "@/components/seo/metadata";
import { paths } from "@/config/paths";
import { ADMIN_SECTIONS, activeAdminSection } from "@/features/admin/sections";
import { getUserQueryOptions } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router";

const overline = "text-xs font-bold tracking-600 uppercase";

/**
 * The admin shell: a left sidebar from `md` up, a bottom tab bar below it, and
 * a header carrying the active section's label. Rendered without the
 * storefront's header, footer or cart, and on its own foreground because the
 * storefront body defaults to white text.
 */
export default function AdminLayout() {
  const { pathname } = useLocation();
  const title = activeAdminSection(pathname)?.label ?? "Admin";

  return (
    <div className="flex min-h-dvh bg-neutral-200 text-neutral-900">
      <Metadata title={`${title} | Admin`} noIndex />
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-20 items-center gap-4 border-b border-neutral-400/40 bg-neutral-100 px-5 md:px-10">
          <Logo
            title="audiophile logo"
            className="shrink-0 *:fill-neutral-900 md:hidden"
          />
          <h1 className="truncate text-2xl font-bold tracking-200 uppercase">
            {title}
          </h1>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-5 md:p-10">
          <Outlet />
        </main>
      </div>
      <AdminTabBar />
    </div>
  );
}

function AdminSidebar() {
  const { data: user } = useQuery(getUserQueryOptions());

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-neutral-900 text-neutral-100 md:flex">
      <Link
        to={paths.home.getHref()}
        className="flex h-24 items-center px-6 hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500"
      >
        <Logo title="audiophile logo" />
      </Link>
      <p className={cn(overline, "px-6 pb-3 text-neutral-100/50")}>Admin</p>
      <nav aria-label="Admin sections" className="flex flex-col">
        {ADMIN_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <NavLink
              key={section.href}
              to={section.href}
              end={section.end}
              className={({ isActive }) =>
                cn(
                  overline,
                  "relative flex h-12 items-center gap-4 px-6 transition-colors hover:text-primary-500",
                  isActive ? "text-primary-500" : "text-neutral-100",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-2 left-0 w-1 bg-primary-500" />
                  )}
                  <Icon className="size-4" />
                  {section.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-neutral-100/20 p-6 text-sm">
        {user && (
          <>
            <p className="truncate font-bold capitalize">{user.name}</p>
            <p className="truncate text-neutral-100/50">{user.email}</p>
          </>
        )}
        <Link
          to={paths.home.getHref()}
          className={cn(
            overline,
            "mt-4 flex items-center gap-2 text-neutral-100/70 hover:text-primary-500",
          )}
        >
          <ArrowLeft className="size-4" />
          Storefront
        </Link>
      </div>
    </aside>
  );
}

function AdminTabBar() {
  return (
    <nav
      aria-label="Admin sections"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-neutral-100/20 bg-neutral-900 text-neutral-100 md:hidden"
    >
      {ADMIN_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <NavLink
            key={section.href}
            to={section.href}
            end={section.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-bold tracking-200 uppercase",
                isActive ? "text-primary-500" : "text-neutral-100/70",
              )
            }
          >
            <Icon className="size-5" />
            {section.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
