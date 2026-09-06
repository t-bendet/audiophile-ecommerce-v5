# Local MongoDB is a Docker replica set on 8.2, not Atlas's 8.0

Dev, seeding, the opt-in test path (`TEST_DATABASE_URL`) and Compass all use the one MongoDB
service in `docker-compose.yml`: a single-node replica set, `rs0`, on `localhost:27017`, with
`audiophile` for dev and `audiophile-test` for tests. Before this (#163) dev pointed at Atlas and
tests booted their own in-memory server; the compose service was a standalone `mongo:7.0` that
Prisma could not use, since nested writes run in transactions and MongoDB only allows those on a
replica set.

The version is pinned once in two places, the compose image tag and `MONGODB_VERSION` in
`apps/server/test/helpers/global-setup.ts`, and #163 asked for that number to match Atlas so a local
pass never depends on a newer engine than production. It does not: Atlas ran 8.0.30 on
4 September 2026 and the pin is 8.2.12.

## Considered options

Pinning 8.0 was tried first and rejected by the machine. Docker Hub's newest 8.0 tag was 8.0.29,
and it, every older 8.0 tag probed, and `latest` (8.3.8) exit at startup on Docker Desktop's
kernel (linuxkit 7.0) with `Linux kernel versions 6.19 and newer has a known incompatibility with
this version of MongoDB` (SERVER-121912). `mongo:8.2.12` starts. It is the nearest release that
does, so it is the pin, and the in-memory binary follows it so the two paths run one engine.

Bypassing the guard was rejected. It exists because of a tcmalloc `rseq` bug that corrupts memory
under those kernels; a container that starts and then misbehaves is worse than one that refuses.

Running the in-memory path on 8.0 and the container on 8.2 was rejected. One version in two files is
already one more than ideal; two versions would make "which engine did this pass on?" a question.

Keeping Atlas for dev, with the container only for tests, was the shape #136 proposed and #163
replaced: it made Docker a cost with little return, and left every local run one `.env` away from
the real cluster.

## Consequences

Docker is a dev prerequisite; `pnpm test` alone is not affected, because the in-memory path stays
the default and CI never sets `TEST_DATABASE_URL`. `pnpm db:seed` is load-bearing, since dev data
no longer resembles production.

The pin is newer than production by one minor. When a `mongo:8.0.x` image that starts on this
kernel is published, or Atlas moves to 8.2, re-pin both files to match Atlas. Whatever the version,
check `fastdl.mongodb.org` has the darwin/arm64 binary and Docker Hub has the tag before bumping;
`ci.yml` reads the `const MONGODB_VERSION = "..."` line for its cache key, so that line keeps its
shape.

Port 27017 must be free. On this machine a Homebrew `mongodb-community` service held it and was
stopped; the container cannot bind while it runs.
