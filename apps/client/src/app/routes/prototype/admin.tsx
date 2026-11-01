// PROTOTYPE route for #320: three variants of the admin dashboard on one
// throwaway route, switchable via ?variant= (A|B|C), ?page= and ?state=.
// Registered only in development builds. Nothing here ships.
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import { usePrototypeParams } from "@/features/admin/prototype/params";
import { VariantA } from "@/features/admin/prototype/variant-a-block";
import { VariantB } from "@/features/admin/prototype/variant-b-storefront";
import { VariantC } from "@/features/admin/prototype/variant-c-ledger";

const VARIANTS = [
  { key: "A", name: "shadcn dashboard-01 block, wholesale" },
  { key: "B", name: "Storefront brand, sidebar + bottom bar" },
  { key: "C", name: "Top navigation, dense ledger" },
];

export default function AdminPrototypePage() {
  const { variant, page, state, go } = usePrototypeParams();
  const props = { page, state, go };
  return (
    <>
      <title>Admin prototype | audiophile</title>
      <meta name="robots" content="noindex, nofollow" />
      {variant === "B" ? (
        <VariantB {...props} />
      ) : variant === "C" ? (
        <VariantC {...props} />
      ) : (
        <VariantA {...props} />
      )}
      <PrototypeSwitcher variants={VARIANTS} />
    </>
  );
}
