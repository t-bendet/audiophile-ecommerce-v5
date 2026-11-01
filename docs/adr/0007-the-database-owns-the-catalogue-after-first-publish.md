# The database owns the catalogue after first publish

The catalogue is authored in the repo and `pnpm db:sync` upserts it onto Atlas after every deploy,
overwriting every field of the three categories, six products and one site config it finds. The
admin dashboard lets an admin edit products and the site config at runtime, so the next deploy
would silently undo their work. We decided that `db:sync` creates documents whose unique key is
missing and never updates one that exists, and that a deliberate `--overwrite` flag, run by hand
and never from CI, keeps the path for publishing a field-shape change. The repo's catalogue files
become the first publication and the local seed, and the database owns the documents from then on.

## Considered options

Leaving `db:sync` as it is and making repo products read-only in the dashboard was rejected: the
sync writes every field, so nothing on those products would be editable, and site config edits,
the most visible thing an admin can change, would be undone on every deploy.

Retiring `db:sync` and making the dashboard the only publication path was rejected: a fresh
database would have no catalogue until an admin typed it in, and dashboard product creation is
itself blocked on image upload. The sync is still the way a new environment gets its first
catalogue.

Running `--overwrite` from CI behind a variable was rejected: one mis-set variable would erase
every admin edit on the next push, and shape changes are rare and deliberate enough to run by hand
with a prefixed `DATABASE_URL`, as the index check already is.

## Consequences

A change to the shape of an existing catalogue document is no longer published by a deploy. It
needs a hand-run `db:sync --overwrite`, which also resets every admin edit on repo-owned
documents, or a one-off migration script. Products created in the dashboard have no repo
counterpart, so `db:seed` for a local database does not know them. Images are still published
from `packages/media`, so a product can only reference image keys that already exist in the
bucket; that is why dashboard product creation stays deferred until image upload exists. The
glossary's "Catalogue" entry, which says the catalogue is never edited in place, changes when the
insert-only sync ships.
