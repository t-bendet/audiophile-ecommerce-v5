import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE } from "@repo/domain";
import { useState } from "react";
import { AdminUserFilters } from "../filters";

// Radix reserves the empty string for clearing a select, so "any" needs a value.
const ANY = "ANY";

type ActiveChoice = typeof ANY | "true" | "false";

type UsersFiltersProps = {
  filters: AdminUserFilters;
  onApply: (filters: AdminUserFilters) => void;
};

/** The toolbar above the users table; applying resets to the first page. */
export function UsersFilters({ filters, onApply }: UsersFiltersProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [role, setRole] = useState<ROLE | typeof ANY>(filters.role ?? ANY);
  const [active, setActive] = useState<ActiveChoice>(
    filters.active === undefined ? ANY : filters.active ? "true" : "false",
  );

  const apply = () => {
    onApply({
      ...(search.trim() && { search: search.trim() }),
      ...(role !== ANY && { role }),
      ...(active !== ANY && { active: active === "true" }),
    });
  };

  return (
    <form
      aria-label="Filter users"
      className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-5 md:flex-row md:flex-wrap md:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <Field className="md:flex-1">
        <FieldLabel htmlFor="filter-search">Search</FieldLabel>
        <Input
          id="filter-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Part of a name or email"
        />
      </Field>
      <Field className="md:w-40">
        <FieldLabel htmlFor="filter-role">Role</FieldLabel>
        <Select value={role} onValueChange={(value) => setRole(value as ROLE)}>
          <SelectTrigger id="filter-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any role</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">User</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field className="md:w-40">
        <FieldLabel htmlFor="filter-active">Active</FieldLabel>
        <Select
          value={active}
          onValueChange={(value) => setActive(value as ActiveChoice)}
        >
          <SelectTrigger id="filter-active" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any state</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit" variant="accent" className="md:self-end">
        Apply
      </Button>
    </form>
  );
}
