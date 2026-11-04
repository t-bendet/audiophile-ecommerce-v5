import { describe, expect, it } from "vitest";
import { workerDatabaseUrl } from "./helpers/worker-database-url.js";

describe("workerDatabaseUrl", () => {
  it("names the worker's database on an in-memory replica set address", () => {
    expect(
      workerDatabaseUrl("mongodb://127.0.0.1:51234/?replicaSet=testset", "3"),
    ).toBe("mongodb://127.0.0.1:51234/audiophile-test-3?replicaSet=testset");
  });

  it("replaces the database in TEST_DATABASE_URL and keeps its query", () => {
    expect(
      workerDatabaseUrl(
        "mongodb://localhost:27017/audiophile-test?replicaSet=rs0&directConnection=true",
        2,
      ),
    ).toBe(
      "mongodb://localhost:27017/audiophile-test-2?replicaSet=rs0&directConnection=true",
    );
  });

  it.each([undefined, "0", "", "abc", "1.5"])(
    "refuses %j as a worker id",
    (workerId) => {
      expect(() =>
        workerDatabaseUrl("mongodb://localhost:27017/", workerId),
      ).toThrow(/Vitest pool id/);
    },
  );
});
