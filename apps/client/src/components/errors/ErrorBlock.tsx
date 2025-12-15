import { PropsWithChildren } from "react";
import { Button } from "../ui/button";

type TErrorBlockProps = {
  title: string;
  message: string;
  onReset?: () => void;
};

const ErrorBlock = ({
  title,
  message,
  onReset,
  children,
}: PropsWithChildren<TErrorBlockProps>) => {
  return (
    <div className="bg-primary-400 flex gap-4 rounded p-4 text-left">
      <div className="bg-primary-700 flex h-12 w-12 items-center justify-center rounded-4xl text-3xl">
        !
      </div>
      <div className="clr-primary-700 fw-bold flow">
        <h2 className="text-lg font-bold">{title}</h2>
        <p>{message}</p>
        {children}
      </div>
      {onReset && <Button onClick={onReset}>Retry</Button>}
    </div>
  );
};

export default ErrorBlock;
