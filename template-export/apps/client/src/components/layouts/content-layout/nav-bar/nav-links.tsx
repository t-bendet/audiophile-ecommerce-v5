import { paths } from "@/config/paths";
import { getCategoriesQueryOptions } from "@/features/categories/api/get-categories";
import { useSuspenseQuery } from "@tanstack/react-query";
import { NavLink } from "react-router";

export const NavLinks = () => {
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
        >
          {"home"}
        </NavLink>
      </li>
      {categoriesResponse.data.map(({ name }) => {
        return (
          <li key={name}>
            <span className="text-neutral-100 cursor-default">
              {name}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
