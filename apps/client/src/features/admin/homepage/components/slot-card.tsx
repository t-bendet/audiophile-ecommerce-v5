import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductDTO } from "@repo/domain";
import type { HomepageSlot, SlotOption } from "../slots";

const overline = "text-xs font-bold tracking-600 uppercase";

type SlotCardProps = {
  slot: HomepageSlot;
  /** The product the slot currently holds in the form; absent only when the list has no such product. */
  product: ProductDTO | undefined;
  options: SlotOption[];
  editing: boolean;
  errors: Array<{ message?: string } | undefined>;
  onEdit: () => void;
  onChange: (productId: string) => void;
};

/**
 * One homepage slot as an image card. The Change button gives way to the
 * slot's select in place; the featured slot sits on the storefront's orange.
 */
export function SlotCard({
  slot,
  product,
  options,
  editing,
  errors,
  onEdit,
  onChange,
}: SlotCardProps) {
  const featured = slot.key === "featuredProductId";
  const invalid = errors.length > 0;

  return (
    <section
      aria-label={slot.label}
      className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-5"
    >
      <h2 className={`${overline} text-neutral-500`}>{slot.label}</h2>
      <div
        className={`flex aspect-square items-center justify-center overflow-hidden rounded-md ${
          featured ? "bg-primary-500" : "bg-neutral-200"
        }`}
      >
        {product ? (
          <img
            src={product.images.thumbnail.src}
            alt=""
            className="size-3/4 object-contain"
          />
        ) : (
          <span className="text-xs text-neutral-500">No product</span>
        )}
      </div>
      <p className="font-bold">{product?.name ?? "Unknown product"}</p>
      <p className="text-xs text-neutral-500">{slot.hint}</p>
      {editing || invalid ? (
        <Field data-invalid={invalid}>
          <FieldLabel htmlFor={slot.key}>Product</FieldLabel>
          <Select value={product?.id ?? ""} onValueChange={onChange}>
            <SelectTrigger
              id={slot.key}
              className="w-full"
              aria-invalid={invalid}
            >
              <SelectValue placeholder="Choose a product" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id}
                  disabled={option.disabled}
                >
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {invalid && <FieldError errors={errors} />}
        </Field>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={onEdit}
        >
          Change
        </Button>
      )}
    </section>
  );
}
