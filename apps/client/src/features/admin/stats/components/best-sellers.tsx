import { paths } from "@/config/paths";
import type { TopProductDTO } from "@repo/domain";
import { Link } from "react-router";

/** The period's best sellers, each row a link to the product's admin edit page. */
export function BestSellers({ products }: { products: TopProductDTO[] }) {
  return (
    <section
      aria-labelledby="best-sellers"
      className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-6"
    >
      <h2
        id="best-sellers"
        className="text-xs font-bold tracking-600 uppercase"
      >
        Best sellers
      </h2>
      {products.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nothing sold in this period yet.
        </p>
      ) : (
        <ol className="flex flex-col divide-y divide-neutral-200">
          {products.map((product, index) => (
            <li key={product.id}>
              <Link
                to={paths.admin.product.getHref(product.id)}
                className="flex h-16 items-center gap-4 hover:text-primary-500"
              >
                <span className="w-5 font-bold text-primary-500 tabular-nums">
                  {index + 1}
                </span>
                <img
                  src={product.thumbnail.src}
                  alt=""
                  className="size-10 rounded-md bg-neutral-200 object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-xs font-bold tracking-600 uppercase">
                  {product.name}
                </span>
                <span className="text-sm text-neutral-500 tabular-nums">
                  {product.quantity} sold
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
