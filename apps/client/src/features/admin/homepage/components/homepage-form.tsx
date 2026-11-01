import { Button } from "@/components/ui/button";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import type { ConfigDTO, ProductDTO } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateConfig } from "../api/get-admin-config";
import {
  HOMEPAGE_SLOTS,
  isSlotsChanged,
  slotOptions,
  toSlotIds,
  type SlotKey,
} from "../slots";
import { SlotCard } from "./slot-card";

type HomepageFormProps = {
  config: ConfigDTO;
  products: ProductDTO[];
};

/**
 * The four slots as cards over a save bar. Each select offers only products
 * carrying the slot's image and disables one chosen elsewhere, so the server
 * never has to refuse a choice the page offered; when it does, the detail
 * lands under that slot's select like any other form.
 */
export function HomepageForm({ config, products }: HomepageFormProps) {
  const updateConfig = useUpdateConfig(config.id);
  const [editing, setEditing] = useState<Set<SlotKey>>(() => new Set());
  const saved = toSlotIds(config);

  const form = useForm({
    defaultValues: saved,
    onSubmit: async ({ value }) => {
      try {
        const response = await updateConfig.mutateAsync(value);
        form.reset(toSlotIds(response.data));
        setEditing(new Set());
        toast.success("Homepage saved");
      } catch (error) {
        const message = applyServerErrors(form, normalizeError(error));
        if (message) {
          toast.error("Homepage not saved", { description: message });
        }
      }
    },
  });

  const productById = new Map(products.map((product) => [product.id, product]));

  return (
    <form
      aria-label="Homepage"
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {HOMEPAGE_SLOTS.map((slot) => (
          <form.Field
            key={slot.key}
            name={slot.key}
            children={(field) => (
              <form.Subscribe
                selector={(state) => state.values}
                children={(values) => (
                  <SlotCard
                    slot={slot}
                    product={productById.get(field.state.value)}
                    options={slotOptions(products, slot.key, values)}
                    editing={editing.has(slot.key)}
                    errors={field.state.meta.errors}
                    onEdit={() =>
                      setEditing((current) => new Set(current).add(slot.key))
                    }
                    onChange={(productId) => field.handleChange(productId)}
                  />
                )}
              />
            )}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">
          Each slot offers only the products with the image it renders, and a
          product can hold one slot at a time. The home page shows a saved
          change on its next visit.
        </p>
        <form.Subscribe
          selector={(state) => [
            isSlotsChanged(state.values, saved),
            state.isSubmitting,
          ]}
          children={([isChanged, isSubmitting]) => (
            <Button
              type="submit"
              variant="accent"
              disabled={!isChanged || isSubmitting}
            >
              Save homepage
            </Button>
          )}
        />
      </div>
    </form>
  );
}
