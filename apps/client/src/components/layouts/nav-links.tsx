import { NavLink } from "react-router-dom";
import { paths } from "@/config/paths";
import { NAME } from "@repo/domain";
import {
  getProductsByCategoryQueryOptions,
  getShowCaseProductsQueryOptions,
} from "@/features/products/api/get-products";
import { useQueryClient } from "@tanstack/react-query";
import { getFeaturedProductQueryOptions } from "@/features/products/api/get-product";

const categoryNames = [
  "Headphones",
  "Earphones",
  "Speakers",
] as const satisfies NAME[];

export const NavLinks = () => {
  const queryClient = useQueryClient();
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
            queryClient.ensureQueryData(getFeaturedProductQueryOptions());
            queryClient.ensureQueryData(getShowCaseProductsQueryOptions());
          }}
        >
          {"home"}
        </NavLink>
      </li>
      {categoryNames.map((category) => {
        return (
          <li key={category}>
            <NavLink
              className={({ isActive }) =>
                `link hover:text-primary-500 focus-visible:text-primary-500 ${isActive ? "text-primary-500" : ""}`
              }
              to={paths.category.getHref(category)}
              onMouseEnter={() => {
                // Pre-fetch the category data when hovering over the link
                queryClient.ensureQueryData(
                  getProductsByCategoryQueryOptions(category),
                );
              }}
            >
              {category}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
};
