import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paths } from "@/config/paths";
import currencyFormatter from "@/utils/formatters";
import type { ProductDTO } from "@repo/domain";
import { Link } from "react-router";

const overline = "text-xs font-bold tracking-600 uppercase";

type ProductsTableProps = {
  products: ProductDTO[];
  /** Category name by id, since a product carries only the id. */
  categoryNames: ReadonlyMap<string, string>;
};

/** Every product as table rows from `md` up and as stacked cards below. */
export function ProductsTable({ products, categoryNames }: ProductsTableProps) {
  const categoryOf = (product: ProductDTO) =>
    categoryNames.get(product.categoryId) ?? "—";

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg bg-neutral-100 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["Name", "Category", "Price", "New"].map((heading) => (
                <TableHead
                  key={heading}
                  className={`${overline} h-14 px-6 text-neutral-500`}
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="h-16">
                <TableCell className="px-6 font-bold">
                  <Link
                    to={paths.admin.product.getHref(product.id)}
                    className="flex items-center gap-4 hover:text-primary-500"
                  >
                    <img
                      src={product.images.thumbnail.src}
                      alt=""
                      className="size-10 rounded-md bg-neutral-200 object-cover"
                    />
                    {product.name}
                  </Link>
                </TableCell>
                <TableCell className="px-6">{categoryOf(product)}</TableCell>
                <TableCell className="px-6">
                  {currencyFormatter(product.price)}
                </TableCell>
                <TableCell className="px-6">
                  {product.isNewProduct && (
                    <Badge variant="processing">New product</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-4 md:hidden">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              to={paths.admin.product.getHref(product.id)}
              className="flex items-center justify-between gap-4 rounded-lg bg-neutral-100 p-5"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-bold">{product.name}</span>
                <span className="truncate text-sm text-neutral-500">
                  {categoryOf(product)} · {currencyFormatter(product.price)}
                </span>
              </span>
              {product.isNewProduct && <Badge variant="processing">New</Badge>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
