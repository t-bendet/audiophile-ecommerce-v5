import ArrowRight from "@/assets/icon-arrow-right.svg?react";
import { Card } from "@/components/ui/card";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { useSuspenseQuery } from "@tanstack/react-query";

export const CategoryNavList = () => {
  const { data: categoriesResponse } = useSuspenseQuery(
    getCategoriesQueryOptions(),
  );
  return (
    <ul className="my-24 flex flex-col items-center gap-17 md:my-24 md:flex-row md:gap-3">
      {categoriesResponse.data.map(({ name, thumbnail }) => {
        return (
          <li key={name} className="contents">
            <Card className="flex h-42 w-full flex-col items-center justify-end gap-4 bg-neutral-100 px-5 py-6 dark:bg-neutral-800">
              <img
                src={thumbnail.src}
                alt={thumbnail.altText}
                aria-label={thumbnail.ariaLabel}
                className="mb-auto h-auto w-40 object-contain"
              />
              <h3 className="text-lg font-bold uppercase tracking-wider">
                {name}
              </h3>
              <span className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                View Category
                <ArrowRight
                  aria-label="arrow right icon"
                  className="fill-primary-500"
                />
              </span>
            </Card>
          </li>
        );
      })}
    </ul>
  );
};
