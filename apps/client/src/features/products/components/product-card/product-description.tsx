import { UseProductCardContext } from "./index";
import { cn } from "@/lib/cn";

export default function ProductDescription(props: { classes?: string }) {
  const { description } = UseProductCardContext();
  return <p className={cn("mb-6 opacity-75", props.classes)}>{description}</p>;
}
