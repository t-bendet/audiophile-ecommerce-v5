import { paths } from "@/config/paths";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { getFeaturedProductQueryOptions } from "@/features/products/api/get-product";
import {
  getProductsByCategoryQueryOptions,
  getShowCaseProductsQueryOptions,
} from "@/features/products/api/get-products";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { NavLink } from "react-router";

export const NavLinks = () => {
  const queryClient = useQueryClient();
  const { data: categoriesResponse } = useSuspenseQuery(
    getCategoriesQueryOptions(),
  );
  return (
    <ul className="tracking-700 flex flex-col gap-4 text-xs font-bold uppercase md:col-span-2 md:flex-row md:gap-9 lg:col-span-1 lg:justify-end">
      <li key={"home"}>
        <NavLink
          className={({ isActive }) =>
            `link hover:text-primary-500 focus-visible:text-primary-500 ${isActive ? "text-primary-500" : ""}`
          }
          to={paths.home.path}
          onMouseEnter={() => {
            // Pre-fetch the category data when hovering over the link
            queryClient.prefetchQuery(getFeaturedProductQueryOptions());
            queryClient.prefetchQuery(getShowCaseProductsQueryOptions());
          }}
          onFocus={() => {
            queryClient.prefetchQuery(getFeaturedProductQueryOptions());
            queryClient.prefetchQuery(getShowCaseProductsQueryOptions());
          }}
        >
          {"home"}
        </NavLink>
      </li>
      {categoriesResponse.data.map(({ name }) => {
        return (
          <li key={name}>
            <NavLink
              className={({ isActive }) =>
                `link hover:text-primary-500 focus-visible:text-primary-500 ${isActive ? "text-primary-500" : ""}`
              }
              to={paths.category.getHref(name)}
              onMouseEnter={() => {
                // Pre-fetch the category data when hovering over the link
                queryClient.prefetchQuery(
                  getProductsByCategoryQueryOptions(name),
                );
              }}
              onFocus={() => {
                queryClient.prefetchQuery(
                  getProductsByCategoryQueryOptions(name),
                );
              }}
            >
              {name}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
};
