import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import { getUserQueryOptions } from "@/lib/auth";
import { cn } from "@/lib/cn";
import type { UserDTO } from "@repo/domain";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, Package, ShieldCheck, User } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { useProto } from "./store";

// Three account shells. Each uses NavLink prefix matching, so a nested
// /account/orders/:orderId keeps Orders active without string surgery.

const LINKS = [
  { to: paths.account.profile.getHref(), label: "Profile", Icon: User },
  { to: paths.account.security.getHref(), label: "Security", Icon: ShieldCheck },
  { to: paths.account.orders.getHref(), label: "Orders", Icon: Package },
];

export const overline =
  "text-xs font-bold tracking-600 uppercase text-primary-500";
export const title = "text-2xl font-bold tracking-300 uppercase md:text-3xl";
export const sectionTitle = "text-lg font-bold tracking-200 uppercase";
export const panelTitle =
  "text-xs font-bold tracking-600 uppercase text-neutral-500";

type ShellProps = { user: UserDTO; children: ReactNode };

function ShellA({ user, children }: ShellProps) {
  return (
    <Container classes="py-10 text-neutral-900 md:py-16">
      <p className={overline}>Account</p>
      <h1 className={cn(title, "mt-2")}>Your account</h1>
      <p className="mt-2 opacity-50">Signed in as {user.email}</p>
      <nav aria-label="Account" className="mt-8 border-b border-neutral-400">
        <ul className="flex gap-8">
          {LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "-mb-px block border-b-2 py-3 text-xs font-bold tracking-600 uppercase",
                    isActive
                      ? "border-primary-500 text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-900",
                  )
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="pt-8">{children}</div>
    </Container>
  );
}

function ShellB({ user, children }: ShellProps) {
  return (
    <Container classes="py-10 text-neutral-900 md:py-16 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-12">
      <aside className="lg:sticky lg:top-6">
        <div className="rounded-lg bg-neutral-200 p-6">
          <p className={overline}>Account</p>
          <p className="mt-2 text-lg font-bold capitalize">{user.name}</p>
          <p className="text-sm break-all text-neutral-500">{user.email}</p>
        </div>
        <nav aria-label="Account" className="mt-4">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col">
            {LINKS.map(({ to, label, Icon }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-bold tracking-600 uppercase",
                      isActive
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-900 hover:bg-neutral-200",
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                  <ChevronRight className="ml-auto hidden size-4 opacity-50 lg:block" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="mt-8 min-w-0 lg:mt-0">{children}</div>
    </Container>
  );
}

function ShellC({ user, children }: ShellProps) {
  return (
    <>
      <div className="bg-neutral-900 text-white">
        <Container classes="py-10 md:py-14">
          <p className={overline}>Account</p>
          <h1 className={cn(title, "mt-2")}>
            Hello {user.name}
          </h1>
          <p className="mt-2 opacity-50">{user.email}</p>
          <nav aria-label="Account" className="mt-8">
            <ul className="flex gap-2 overflow-x-auto">
              {LINKS.map(({ to, label }) => (
                <li key={to} className="shrink-0">
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-full px-5 py-2.5 text-xs font-bold tracking-600 uppercase",
                        isActive
                          ? "bg-primary-500 text-white"
                          : "bg-white/10 text-white hover:bg-white/20",
                      )
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
      <Container classes="py-10 text-neutral-900 md:py-16">{children}</Container>
    </>
  );
}

const SHELLS = { A: ShellA, B: ShellB, C: ShellC } as const;

export default function PrototypeUserAreaLayout() {
  const { data: user } = useSuspenseQuery(getUserQueryOptions());
  const { shell } = useProto();
  const Shell = SHELLS[shell];
  return (
    <main className="flex min-h-dvh flex-col">
      <SafeRenderWithErrorBlock
        title="Error loading User details"
        containerClasses="mb-40"
      >
        <Shell user={user}>
          <Outlet />
        </Shell>
      </SafeRenderWithErrorBlock>
    </main>
  );
}
