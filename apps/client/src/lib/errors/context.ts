import type { AppError } from "@repo/domain";
import { createContext } from "react-router";

export const errorContext = createContext<AppError | null>(null);
