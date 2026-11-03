// PROTOTYPE (#359): page-shaped skeletons for each storefront route.
// Reuses the unused product-skeleton and products-list-skeleton to see whether they earn their keep.
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import ProductSkeleton from "@/features/products/components/product-skeleton";
import ProductsListSkeleton from "@/features/products/components/products-list-skeleton";
import { cn } from "@/lib/cn";

const Light = ({ className }: { className?: string }) => (
  <Skeleton className={cn("bg-neutral-400", className)} />
);
const Dark = ({ className }: { className?: string }) => (
  <Skeleton className={cn("bg-white/10", className)} />
);

const Busy = ({ label }: { label: string }) => (
  <span className="sr-only" role="status">
    {label}
  </span>
);

export const HeroSkeleton = () => (
  <div className="col-span-full row-span-full grid items-center justify-center lg:justify-start lg:pl-4">
    <div className="flex flex-col items-center gap-4 lg:items-start">
      <Dark className="h-4 w-36" />
      <Dark className="h-10 w-72 lg:h-14 lg:w-96" />
      <Dark className="h-10 w-64 lg:h-14 lg:w-80" />
      <Dark className="mt-2 h-4 w-72" />
      <Dark className="h-4 w-60" />
      <Dark className="mt-6 h-12 w-40 rounded-none" />
    </div>
    <Busy label="Loading the featured product" />
  </div>
);

export const ShowcaseSkeleton = () => (
  <Container classes="space-y-6 md:space-y-8 lg:space-y-12">
    <Light className="h-[600px] w-full rounded-lg md:h-[720px] lg:h-[560px]" />
    <Light className="h-80 w-full rounded-lg" />
    <div className="grid gap-6 md:grid-cols-2 md:gap-3 lg:gap-8">
      <Light className="h-50 rounded-lg md:h-80" />
      <Light className="h-50 rounded-lg md:h-80" />
    </div>
    <Busy label="Loading the showcase" />
  </Container>
);

const CategoryCardsSkeleton = () => (
  <Container classes="flex flex-col gap-4 md:flex-row md:gap-3 lg:gap-8">
    {[0, 1, 2].map((i) => (
      <Light key={i} className="h-40 w-full rounded-md md:h-52" />
    ))}
  </Container>
);

export const HomeSkeleton = () => (
  <main>
    <Section classes="mb-10 h-[calc(100vh-(var(--nav-bar-height)))] w-full bg-neutral-900 md:mb-24 lg:mb-30">
      <Container classes="grid h-full grid-cols-1 bg-neutral-600">
        <HeroSkeleton />
      </Container>
    </Section>
    <Section classes="md:mb-24 lg:mb-42">
      <CategoryCardsSkeleton />
    </Section>
    <Section>
      <ShowcaseSkeleton />
    </Section>
  </main>
);

export const CategorySkeleton = ({ name }: { name?: string }) => (
  <>
    <header className="bg-neutral-900 py-8 md:py-24">
      {/* The category name is in the URL, so the header needs no placeholder. */}
      <h1 className="text-center text-2xl font-bold tracking-500 uppercase md:text-4xl">
        {name}
      </h1>
    </header>
    <main className="mt-16 md:mt-30 lg:mt-40">
      <div className="[&_[data-slot=skeleton]]:bg-neutral-400">
        <ProductsListSkeleton />
      </div>
      <Busy label={`Loading ${name ?? "the category"}`} />
    </main>
  </>
);

export const ProductPageSkeleton = () => (
  <>
    <Container classes="mt-4 mb-6 md:mt-8 md:mb-8 lg:mt-19 lg:mb-14">
      <Light className="h-6 w-20" />
    </Container>
    <main>
      <Section classes="max-sm:mb-22">
        <Container classes="flex flex-col gap-y-8 md:flex-row md:gap-x-17 lg:gap-x-31">
          <Light className="aspect-square w-full rounded-sm md:w-1/2" />
          <div className="md:w-1/2 [&_[data-slot=skeleton]]:bg-neutral-400">
            <ProductSkeleton classes="items-start text-left lg:items-start" />
          </div>
        </Container>
      </Section>
      <Section>
        <Container classes="flex flex-col gap-4 lg:w-2/3">
          <Light className="h-8 w-48" />
          <Light className="h-4 w-full" />
          <Light className="h-4 w-full" />
          <Light className="h-4 w-4/5" />
        </Container>
      </Section>
    </main>
  </>
);

export const OrdersCardSkeleton = () => (
  <div className="rounded-xl border bg-white p-6 text-neutral-900">
    <Light className="mb-6 h-6 w-24" />
    <div className="flex flex-col gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="mb-4 flex justify-between">
            <Light className="h-5 w-40" />
            <Light className="h-4 w-56" />
          </div>
          {[0, 1].map((j) => (
            <div key={j} className="flex items-center gap-4 py-3">
              <Light className="h-12 w-12" />
              <div className="flex-1 space-y-2">
                <Light className="h-4 w-40" />
                <Light className="h-3 w-24" />
              </div>
              <Light className="h-4 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
    <Busy label="Loading your orders" />
  </div>
);

/** The account chrome is the user area layout's; its data is always cached, so draw it as text. */
export const AccountOrdersSkeleton = () => (
  <main className="flex min-h-dvh flex-col text-neutral-900">
    <Container>
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>
      <Light className="mb-4 h-5 w-64" />
      <Light className="mb-4 h-9 w-64 rounded-lg" />
      <OrdersCardSkeleton />
    </Container>
  </main>
);

export const CheckoutSkeleton = () => (
  <main>
    <div className="bg-neutral-900 py-8">
      <Container>
        <h1 className="text-3xl font-bold text-white">Checkout</h1>
      </Container>
    </div>
    <Section>
      <Container>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 rounded-lg bg-white p-6 shadow lg:col-span-2">
            <Light className="h-7 w-40" />
            {[0, 1, 2].map((group) => (
              <div key={group} className="grid gap-4 md:grid-cols-2">
                <Light className="h-12" />
                <Light className="h-12" />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-lg bg-white p-6 shadow">
            <Light className="h-6 w-28" />
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Light className="h-16 w-16" />
                <div className="flex-1 space-y-2">
                  <Light className="h-4 w-24" />
                  <Light className="h-3 w-16" />
                </div>
              </div>
            ))}
            <Light className="h-24 w-full" />
            <Light className="h-12 w-full rounded-none" />
          </div>
        </div>
      </Container>
    </Section>
    <Busy label="Loading checkout" />
  </main>
);

/** The skeleton for the route a pending navigation is heading to. */
export const SkeletonForPath = ({ pathname }: { pathname: string }) => {
  if (pathname === "/") return <HomeSkeleton />;
  if (pathname.startsWith("/category/"))
    return (
      <CategorySkeleton name={decodeURIComponent(pathname.split("/").pop()!)} />
    );
  if (pathname.startsWith("/product/")) return <ProductPageSkeleton />;
  if (pathname === "/account/orders") return <AccountOrdersSkeleton />;
  if (pathname === "/checkout") return <CheckoutSkeleton />;
  return null;
};
