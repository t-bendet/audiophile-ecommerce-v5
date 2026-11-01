import currencyFormatter from "@/utils/formatters";
import type {
  AdminOrderDTO,
  BillingAddress,
  ShippingAddress,
} from "@repo/domain";

const overline = "text-xs font-bold tracking-600 uppercase text-neutral-500";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-6"
    >
      <h2 className={overline}>{title}</h2>
      {children}
    </section>
  );
}

function AddressLines({
  address,
}: {
  address: ShippingAddress | BillingAddress;
}) {
  return (
    <address className="text-sm not-italic">
      <p className="font-bold">{address.fullName}</p>
      <p>{address.address}</p>
      <p>
        {address.city}, {address.state} {address.zipCode}
      </p>
      <p>{address.country}</p>
      {"phone" in address && <p className="mt-2">{address.phone}</p>}
      {"email" in address && <p>{address.email}</p>}
    </address>
  );
}

/** The left column of the order detail: lines, totals, then who and where. */
export function OrderSummary({ order }: { order: AdminOrderDTO }) {
  const totals = [
    ["Subtotal", order.subtotal],
    ["Shipping", order.shippingCost],
    ["Tax", order.tax],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Items">
        <ul className="divide-y divide-neutral-200">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <img
                src={item.productImage.src}
                alt=""
                width={item.productImage.width}
                height={item.productImage.height}
                className="size-14 rounded bg-neutral-200 object-cover"
              />
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase">
                  {item.productName}
                </h3>
                <p className="text-sm text-neutral-500">
                  {currencyFormatter(item.price)} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-bold">
                {currencyFormatter(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-neutral-200 pt-4 text-sm">
          {totals.map(([label, amount]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-neutral-500">{label}</dt>
              <dd className="font-bold">{currencyFormatter(amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between text-base">
            <dt className="font-bold">Grand total</dt>
            <dd className="font-bold text-primary-500">
              {currencyFormatter(order.total)}
            </dd>
          </div>
        </dl>
      </Panel>
      <div className="grid gap-6 md:grid-cols-3">
        <Panel title="Customer">
          <div className="text-sm">
            <p className="font-bold capitalize">{order.customer.name}</p>
            <p className="break-all">{order.customer.email}</p>
            <p className="mt-2 text-neutral-500">{order.paymentMethod}</p>
          </div>
        </Panel>
        <Panel title="Ships to">
          <AddressLines address={order.shippingAddress} />
        </Panel>
        <Panel title="Billed to">
          <AddressLines address={order.billingAddress} />
        </Panel>
      </div>
    </div>
  );
}
