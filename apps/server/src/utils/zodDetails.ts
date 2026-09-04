import { ErrorDetail } from "@repo/domain";
import { ZodError } from "zod";

// `unrecognized_keys` carries the offending keys on `issue.keys`, not on
// `issue.path`, so it is expanded into one detail per key.
export const zodIssuesToDetails = (error: ZodError): ErrorDetail[] =>
  error.issues.flatMap((issue): ErrorDetail[] => {
    const path = issue.path.map(String);

    if (issue.code === "unrecognized_keys") {
      return issue.keys.map((key) => ({
        code: issue.code,
        message: issue.message,
        path: [...path, key],
      }));
    }

    // A custom issue may name a more specific code than zod's "custom".
    const code =
      issue.code === "custom" && typeof issue.params?.code === "string"
        ? issue.params.code
        : issue.code;

    return [
      {
        code,
        message: issue.message,
        path: path.length > 0 ? path : undefined,
      },
    ];
  });
