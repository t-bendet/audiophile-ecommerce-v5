// The only code that names a test database; `resetDatabase` truncates what it returns.
export const workerDatabaseUrl = (
  baseUrl: string,
  workerId: string | number | undefined,
): string => {
  const id = Number(workerId);
  if (workerId === undefined || !Number.isInteger(id) || id < 1) {
    throw new Error(
      `Expected a Vitest pool id (an integer from 1), got ${String(workerId)}.`,
    );
  }

  const url = new URL(baseUrl);
  url.pathname = `/audiophile-test-${id}`;
  return url.href;
};
