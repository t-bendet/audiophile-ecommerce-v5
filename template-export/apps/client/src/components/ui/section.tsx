import { cn } from "@/lib/cn";

export type TSectionProps = {
  children: React.ReactNode;
  classes?: string;
  clickHandler?: () => void;
};

export const Section = ({ children, classes, clickHandler }: TSectionProps) => {
  return (
    <section onClick={clickHandler} className={cn("mb-30 lg:mb-40", classes)}>
      {children}
    </section>
  );
};
