# Domain guide

Read this guide when changing shared schemas or types, naming domain concepts, or making design decisions. This repo has one domain context: [GLOSSARY.md](../../GLOSSARY.md) and [docs/adr](../adr/).

## Vocabulary and decisions

Read the glossary entries relevant to your task and use their terms in code, tests, issues, and proposals. Before changing behavior governed by a decision, read its ADR:

| Change                                      | Decision                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Ownership checks and their HTTP response    | [0001: ownership failures return 403](../adr/0001-ownership-failures-return-403.md)                       |
| List sorting and field selection validation | [0002: reject unknown sort and fields values](../adr/0002-unknown-sort-and-fields-values-are-rejected.md) |
| List pagination defaults                    | [0003: one default page size](../adr/0003-one-default-page-size-for-every-list.md)                        |
| MongoDB topology or version                 | [0004: local replica set](../adr/0004-local-mongodb-is-a-docker-replica-set-on-8-2.md)                    |
| Hosting boundaries                          | [0005: Cloudflare deployment](../adr/0005-audiophile-runs-on-cloudflare-under-t-bendet-com.md)            |

Surface a conflict with an existing decision explicitly. For a new settled term or decision, read and apply the [domain-modeling skill](../../.agents/skills/domain-modeling/SKILL.md); it owns glossary and ADR formats. Proposals remain proposals until a decision is made.

## Shared package conventions

`packages/domain` is the source of shared Zod schemas, DTOs, types, and error codes. Expose public additions through [src/index.ts](../../packages/domain/src/index.ts); consumers import from `@repo/domain`. Use `.strict()` on input object schemas to reject unknown fields. Server request wiring is defined in the [server guide](../../apps/server/README.md).

| Name                           | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `*CreateInput`, `*UpdateInput` | Write operations                                            |
| `*DTO`                         | Read responses                                              |
| `*WhereInput`                  | Filter parameters                                           |
| `*Select`                      | Field selection                                             |
| `ExtendedQueryParams`          | Pagination and sorting                                      |
| `*QueryParams`                 | One entity's list query: `ExtendedQueryParams<{ filters }>` |

Use the package's existing schema/type pairs as examples rather than introducing parallel definitions in client and server. Run the domain tests and type-check affected consumers when a shared contract changes; see [verification](verification.md).
