import { Button } from "@/components/ui/button";
import type { Meta } from "@repo/domain";

type ListPaginationProps = {
  meta: Meta;
  onPage: (page: number) => void;
};

/** "Showing x–y of n" and the two existing buttons; no new primitive. */
export function ListPagination({ meta, onPage }: ListPaginationProps) {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4"
    >
      <p className="text-sm text-neutral-500">
        Showing {first}–{last} of {meta.total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPrev}
          onClick={() => onPage(meta.page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNext}
          onClick={() => onPage(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
