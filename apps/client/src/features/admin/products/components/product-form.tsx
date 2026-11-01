import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import type { CategoryDTO, ProductDTO } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useUpdateProduct } from "../api/update-product";
import { ProductFormSchema, toFormValues, toUpdateBody } from "../product-form";

const overline = "text-xs font-bold tracking-600 uppercase text-neutral-500";
const panel = "flex flex-col gap-5 rounded-lg bg-neutral-100 p-6";

type ProductFormProps = {
  product: ProductDTO;
  categories: CategoryDTO[];
};

/**
 * The product's editable fields as four panels, with the save button and the
 * read-only slug and images beside them. A saved product becomes the form's
 * new starting point, so the Save button goes quiet until the next edit.
 */
export function ProductForm({ product, categories }: ProductFormProps) {
  const updateProduct = useUpdateProduct(product.id);

  const form = useForm({
    defaultValues: toFormValues(product),
    validators: { onSubmit: ProductFormSchema },
    onSubmit: async ({ value }) => {
      try {
        const saved = await updateProduct.mutateAsync(toUpdateBody(value));
        form.reset(toFormValues(saved.data));
        toast.success("Product saved");
      } catch (error) {
        const message = applyServerErrors(form, normalizeError(error));
        if (message) {
          toast.error("Product not saved", { description: message });
        }
      }
    },
  });

  return (
    <form
      aria-label="Edit product"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-6">
        <section aria-label="Basics" className={panel}>
          <h2 className={overline}>Basics</h2>
          <form.Field
            name="name"
            children={(field) => (
              <FieldShell field={field} label="Name">
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid(field)}
                />
              </FieldShell>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field
              name="price"
              children={(field) => (
                <FieldShell
                  field={field}
                  label="Price"
                  hint="Whole dollars, as the storefront shows it."
                >
                  <Input
                    id={field.name}
                    inputMode="numeric"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid(field)}
                  />
                </FieldShell>
              )}
            />
            <form.Field
              name="categoryId"
              children={(field) => (
                <FieldShell field={field} label="Category">
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger
                      id={field.name}
                      className="w-full"
                      aria-invalid={isInvalid(field)}
                    >
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldShell>
              )}
            />
          </div>
          <form.Field
            name="isNewProduct"
            children={(field) => (
              <Field orientation="horizontal">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <FieldLabel htmlFor={field.name}>New product</FieldLabel>
              </Field>
            )}
          />
        </section>

        <section aria-label="Copy" className={panel}>
          <h2 className={overline}>Copy</h2>
          <form.Field
            name="description"
            children={(field) => (
              <FieldShell field={field} label="Description">
                <Textarea
                  id={field.name}
                  rows={4}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid(field)}
                />
              </FieldShell>
            )}
          />
          <form.Field
            name="featuresText"
            children={(field) => (
              <FieldShell
                field={field}
                label="Features"
                hint="One paragraph per block; leave a blank line between them."
              >
                <Textarea
                  id={field.name}
                  rows={8}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid(field)}
                />
              </FieldShell>
            )}
          />
        </section>

        <form.Field
          name="includedItems"
          mode="array"
          children={(items) => (
            <section aria-label="In the box" className={panel}>
              <div className="flex items-center justify-between">
                <h2 className={overline}>In the box</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => items.pushValue({ item: "", quantity: "1" })}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {items.state.value.length === 0 && (
                <p className="text-sm text-neutral-500">
                  List what ships with the product.
                </p>
              )}
              <ul className="flex flex-col gap-4">
                {items.state.value.map((_, index) => (
                  <li
                    key={index}
                    className="grid grid-cols-[auto_5rem_minmax(0,1fr)_auto] items-start gap-3"
                  >
                    <form.Subscribe
                      selector={(state) =>
                        state.values.includedItems[index]?.quantity ?? ""
                      }
                      children={(quantity) => (
                        <span className="pt-2 font-bold text-primary-500">
                          {quantity || "0"}x
                        </span>
                      )}
                    />
                    <form.Field
                      name={`includedItems[${index}].quantity`}
                      children={(field) => (
                        <FieldShell field={field} label="Quantity" labelHidden>
                          <Input
                            id={field.name}
                            inputMode="numeric"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            aria-invalid={isInvalid(field)}
                          />
                        </FieldShell>
                      )}
                    />
                    <form.Field
                      name={`includedItems[${index}].item`}
                      children={(field) => (
                        <FieldShell field={field} label="Item" labelHidden>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            aria-invalid={isInvalid(field)}
                          />
                        </FieldShell>
                      )}
                    />
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() => items.removeValue(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              {isInvalid(items) && (
                <FieldError errors={items.state.meta.errors} />
              )}
            </section>
          )}
        />

        <section aria-label="Labels" className={panel}>
          <h2 className={overline}>Labels</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <form.Field
              name="cartLabel"
              children={(field) => (
                <FieldShell
                  field={field}
                  label="Cart label"
                  hint="The line in the cart and the mini-cart."
                >
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid(field)}
                  />
                </FieldShell>
              )}
            />
            <form.Field
              name="shortLabel"
              children={(field) => (
                <FieldShell
                  field={field}
                  label="Short label"
                  hint="The showcase and related-product cards."
                >
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid(field)}
                  />
                </FieldShell>
              )}
            />
          </div>
          <form.Field
            name="fullLabel"
            children={(field) => (
              <FieldShell
                field={field}
                label="Full label"
                hint="The headline on the product page; one line per row."
              >
                <Textarea
                  id={field.name}
                  rows={2}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid(field)}
                />
              </FieldShell>
            )}
          />
        </section>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-6">
        <section aria-label="Publish" className={panel}>
          <h2 className={overline}>Publish</h2>
          <form.Subscribe
            selector={(state) => [state.isDirty, state.isSubmitting]}
            children={([isDirty, isSubmitting]) => (
              <Button
                type="submit"
                variant="accent"
                className="w-full"
                disabled={!isDirty || isSubmitting}
              >
                Save
              </Button>
            )}
          />
          <p className="text-xs text-neutral-500">
            The storefront shows a saved change on its next page.
          </p>
        </section>
        <ReadOnlyPanel product={product} />
      </div>
    </form>
  );
}

const READ_ONLY_IMAGES = [
  ["Thumbnail", (product: ProductDTO) => product.images.thumbnail.src],
  [
    "Featured",
    (product: ProductDTO) => product.images.featuredImage?.desktop.src,
  ],
  [
    "Showcase",
    (product: ProductDTO) => product.images.showCaseImage?.desktop.src,
  ],
] as const;

function ReadOnlyPanel({ product }: { product: ProductDTO }) {
  return (
    <section aria-label="Read only" className={panel}>
      <h2 className={overline}>Read only</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <dt className={overline}>Slug</dt>
        <dd>
          <code className="rounded-md bg-neutral-200 px-2 py-1 font-mono text-xs">
            {product.slug}
          </code>
        </dd>
        <dt className={overline}>Images</dt>
        <dd className="grid grid-cols-3 gap-3">
          {READ_ONLY_IMAGES.map(([caption, src]) => (
            <figure key={caption} className="flex flex-col gap-1">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-neutral-200">
                {src(product) ? (
                  <img
                    src={src(product)}
                    alt=""
                    className="size-full object-cover opacity-60 grayscale"
                  />
                ) : (
                  <span className="text-xs text-neutral-500">None</span>
                )}
              </div>
              <figcaption className="text-xs text-neutral-500">
                {caption}
              </figcaption>
            </figure>
          ))}
        </dd>
      </dl>
      <p className="text-xs text-neutral-500">
        Images are published from packages/media and the slug is the product's
        public URL.
      </p>
    </section>
  );
}

type FieldLike = {
  name: string;
  state: { meta: { errors: Array<{ message?: string } | undefined> } };
};

const isInvalid = (field: FieldLike) => field.state.meta.errors.length > 0;

/** A label, the input and its errors; the label is kept for readers when hidden. */
function FieldShell({
  field,
  label,
  hint,
  labelHidden = false,
  children,
}: {
  field: FieldLike;
  label: string;
  hint?: string;
  labelHidden?: boolean;
  children: ReactNode;
}) {
  const invalid = isInvalid(field);
  return (
    <Field data-invalid={invalid}>
      <FieldLabel
        htmlFor={field.name}
        className={labelHidden ? "sr-only" : undefined}
      >
        {label}
      </FieldLabel>
      {children}
      {hint && !invalid && <p className="text-xs text-neutral-500">{hint}</p>}
      {invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
