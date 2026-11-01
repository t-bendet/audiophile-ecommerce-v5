import { useId } from "react";

type StatCardProps = {
  label: string;
  /** Already formatted: a count, or a price through the storefront's formatter. */
  value: string;
};

/** One headline number: a white panel with the orange bar on its top edge. */
export function StatCard({ label, value }: StatCardProps) {
  const labelId = useId();

  return (
    <section
      aria-labelledby={labelId}
      className="flex flex-col gap-3 rounded-lg border-t-4 border-primary-500 bg-neutral-100 p-6"
    >
      <h2
        id={labelId}
        className="text-xs font-bold tracking-600 text-neutral-500 uppercase"
      >
        {label}
      </h2>
      <p className="text-4xl font-bold tracking-tight tabular-nums">{value}</p>
    </section>
  );
}
