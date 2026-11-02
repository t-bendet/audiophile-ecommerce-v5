# Nothing an order references is hard-deleted

Orders are the shop's ledger, so the API never deletes a row an order points at. A user is
deactivated, never deleted: the admin `DELETE /users/:id` route, which cascaded the user's carts and
orders, was retired in [#345](https://github.com/t-bendet/audiophile-ecommerce-v5/issues/345), and
`DELETE /users/deleteMe` deactivates (glossary, **User**). `DELETE /products/:id` refuses a product
with order items, or one held in a site config slot (the featured product or a showcase slot), with
`ErrorCode.RESOURCE_IN_USE` (409); `assertNotReferenced` in
`apps/server/src/services/product.service.ts` counts both before the delete. A slot is refused
because it cannot point at a missing product; an order line because it reads its product's name,
slug and thumbnail live, so an ordered product stays in the catalogue. Taking it off sale is the
archive state the roadmap's product lifecycle group adds, not a delete.

## Considered options

Cascading orders with their user, what `Order.user`'s `onDelete: Cascade` and the old admin route
did, was rejected: it erases order history and the revenue the stats read. A legal erasure request
wants anonymisation that keeps the order, not a delete.

Mapping Prisma's relation error to a conflict was rejected. On MongoDB Prisma emulates referential
actions, and a required relation without `onDelete` restricts: before #345 the error reached the
client as an unmapped 500, and a mapped code still could not say which reference blocked the
delete. The pre-count names the reason in each refusal.

Soft-deleting products now was deferred: it needs an archived field, which is a new catalogue field
under [ADR 0007](0007-the-database-owns-the-catalogue-after-first-publish.md), and the semantics of
a cart line, a slot and a product page holding an archived product.

## Consequences

The cascade is unreachable from the API rather than gone. `onDelete: Cascade` on `Cart.user` and
`Order.user` stays in the Prisma schema, and `UserService.persistDelete` still exists because
`AbstractCrudService` requires it; no route calls it. A new route that deletes a user reopens this
decision.

Cart items still cascade when a product is deleted: a product nobody ordered may be removed from
carts silently. That is the interim, recorded by the route test "removes the product's cart items
and leaves the other lines" in `apps/server/test/product.route.test.ts`, and the archive work
changes it deliberately. The count and the delete are not in a transaction, so an order placed
between them still meets Prisma's emulated restrict.
