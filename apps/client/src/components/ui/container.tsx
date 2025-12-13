import { cn } from "@/lib/cn";

export type TContainerProps = {
  children: React.ReactNode;
  classes?: string;
  clickHandler?: () => void;
};

export const Container = ({
  children,
  classes,
  clickHandler,
}: TContainerProps) => {
  return (
    <div onClick={clickHandler} className={cn("custom-container", classes)}>
      {children}
    </div>
  );
};
