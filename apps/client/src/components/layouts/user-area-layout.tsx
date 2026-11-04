import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import { getUserQueryOptions } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { useSuspenseQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router";
import { SafeRenderWithErrorBlock } from "../errors/safe-render-with-error-block";

const LINKS = [
  { to: paths.account.profile.getHref(), label: "Profile" },
  { to: paths.account.security.getHref(), label: "Security" },
  { to: paths.account.orders.getHref(), label: "Orders" },
];

export default function UserAreaLayout() {
  const { data } = useSuspenseQuery(getUserQueryOptions());
  return (
    <main className="flex min-h-dvh flex-col">
      <SafeRenderWithErrorBlock
        title="Error loading User details"
        containerClasses="mb-40"
      >
        <Container classes="py-10 text-neutral-900 md:py-16">
          <p className="text-xs font-bold tracking-600 text-primary-500 uppercase">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-300 uppercase md:text-3xl">
            Your account
          </h1>
          <p className="mt-2 opacity-50">Signed in as {data.email}</p>
          <nav
            aria-label="Account"
            className="mt-8 border-b border-neutral-400"
          >
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
          <div className="pt-8">
            <Outlet />
          </div>
        </Container>
      </SafeRenderWithErrorBlock>
    </main>
  );
}
