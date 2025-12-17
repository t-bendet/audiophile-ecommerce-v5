import { PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";
import { isCriticalError } from "@/lib/errors";
import { Container } from "../ui/container";
import { cn } from "@/lib/cn";

type TErrorBlockProps = {
  title: string;
  message: string;
  onReset?: () => void;
  error: unknown;
  containerClasses?: string;
};

const ErrorBlock = ({
  title,
  message,
  onReset,
  children,
  error,
  containerClasses,
}: PropsWithChildren<TErrorBlockProps>) => {
  // Re-throw critical errors so they bubble to router boundary

  if (isCriticalError(error)) {
    throw error;
  }
  return (
    <Container
      classes={cn("flex items-center justify-center", containerClasses)}
    >
      <div className="bg-primary-500 flex gap-4 rounded p-4 text-left max-sm:flex-col max-sm:items-center max-sm:gap-2">
        <div className="bg-primary-700 flex h-12 w-12 items-center justify-center rounded-4xl text-3xl">
          !
        </div>
        <div className="clr-primary-700 fw-bold flow">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="max-sm:text-center">{message}</p>
          {children}
        </div>
        {onReset && <Button onClick={onReset}>Retry</Button>}
      </div>
    </Container>
  );
};

export default ErrorBlock;
