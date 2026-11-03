# Prototype plan

Compare stacked/split layouts and compact/expanded detail on the existing home route.

## Run

Start the local API and the Vite client, then open `http://localhost:5173/?layout=A&detail=A`.
Read choices with `useProto()` in components and `proto()` in loaders or middleware; update
with `setProto()`. Changing the bar updates React readers and the URL without rerunning loaders;
navigate to exercise a loader variant. The URL overrides the session on a full load.

| Bar row | Keys           | What it changes                           |
| ------- | -------------- | ----------------------------------------- |
| layout  | A / B, ← / →   | Stacked / split (wire the compared views) |
| detail  | A / B          | Compact / expanded (wire the views)       |
| delay   | 0 / 800 / 2000 | Added milliseconds per API request        |
| cache   | cold / warm    | Destination query removal when mapped     |

Fill the plan and this table when adapting `config.ts`. The first option is each row's default.

Run `node apps/client/src/components/prototype/<topic>/shots.mjs [filter] [origin]`
from the repo (replace `<topic>` with this folder's name). The optional substring filter matches
the full capture stem; origin defaults to `http://localhost:5173`. For all captures on another
port use `"" http://localhost:5174`. Edit the script's `cases` section for the compared flows.
Screenshots go to `.scratch/prototype-shots/<topic>/` with the prototype bar and query devtools
hidden. Each axis/toggle combination runs on phone and desktop, using one seeded-shopper login.
