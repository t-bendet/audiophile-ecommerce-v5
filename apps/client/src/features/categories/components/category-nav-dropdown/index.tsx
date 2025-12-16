import Icon from "@/assets/icon-arrow-right.svg?react";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getProductsByCategoryQueryOptions } from "@/features/products/api/get-products";

const CategoryNavDropdown = ({
  clickHandler,
}: {
  clickHandler?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { data: categoriesResponse } = useSuspenseQuery(
    getCategoriesQueryOptions(),
  );
  return (
    <nav onClick={clickHandler}>
      <ul className="flex flex-col gap-4 text-neutral-900 md:flex-row md:justify-around lg:gap-8">
        {categoriesResponse.data.map((category) => (
          <li
            className="col-auto grid grid-cols-1 grid-rows-[25%_1fr_80px] justify-items-center rounded-md"
            key={category.id}
          >
            <img
              src={category.thumbnail.src}
              alt={category.thumbnail.altText}
              aria-label={category.thumbnail.ariaLabel}
              className="z-10 col-start-1 col-end-2 row-start-1 row-end-3 max-w-1/3 md:max-w-2/3 lg:max-w-5/6"
            />
            <div className="col-start-1 col-end-2 row-start-2 row-end-4 w-full rounded-md bg-neutral-200"></div>
            <div className="col-start-1 col-end-2 row-start-3 row-end-4 w-full text-center">
              <span className="tracking-500 mb-4 block font-bold uppercase">
                {category.name}
              </span>
              <Link
                to={`/category/${category.name}`}
                className="tracking-600 inline-flex items-center gap-2 text-xs font-bold uppercase opacity-50 hover:underline"
                onMouseEnter={() => {
                  queryClient.ensureQueryData(
                    getProductsByCategoryQueryOptions(category.name),
                  );
                }}
              >
                shop
                <Icon />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default CategoryNavDropdown;
