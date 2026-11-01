# Audiophile

A single-brand storefront for headphones, earphones and speakers. Shoppers browse a fixed
catalogue, keep a cart, and check out into an order; an admin curates the catalogue and moves
orders through their statuses.

## Catalogue

**Catalogue**:
The categories, products and site config. The repo authors and publishes the first version of
each document through `db:sync`; from then on the database owns it, and an admin edits products
and the site config in place through the dashboard. A later sync only adds what is missing.
_Avoid_: inventory, stock, content

**Category**:
One of the three shelves a product belongs to: Headphones, Earphones or Speakers. Every product
has exactly one.
_Avoid_: collection, department, type

**Product**:
A sellable item with one category, one price, its images and its included items.
_Avoid_: item (reserved for cart and order lines), SKU, article

**Slug**:
A product's URL handle, derived from its name when none is given. It is the stable identity the
catalogue is matched on across environments.
_Avoid_: handle, permalink, path

**Short label**:
A product's name as it appears on home-page tiles and related-product cards, for example
"XX99 Mark I".
_Avoid_: title, display name

**Cart label**:
A product's compact name on cart lines and order lines, for example "XX99 MK I".
_Avoid_: short name, line name

**Full label**:
A product's name split into the words of its own page heading, for example "XX99 Mark I" and
"Headphones".
_Avoid_: title, heading

**Included items**:
The pieces that come in a product's box, each with a quantity.
_Avoid_: contents, accessories, bundle

**New product**:
A product flagged to carry the "new product" overline wherever it is shown. It is a property of the
product, not a position on the home page.
_Avoid_: featured, latest

**Site config**:
The single record that names the featured product and the three showcase products. Changing the
home page means changing it, not the products.
_Avoid_: settings, CMS, home config

**Featured product**:
The one product the site config puts in the home-page hero.
_Avoid_: hero product, highlight, promoted product

**Showcase**:
The three home-page slots below the hero, cover, wide and grid, each filled with one product by the
site config.
_Avoid_: spotlight, promotions, featured (that is the hero)

**Related products**:
Up to three other products shown at the bottom of a product page, chosen for sharing the
product's category or sitting near its price.
_Avoid_: recommendations, "you may also like", similar products

## Shopping

**Shopper**:
The person browsing and buying, whether or not they are signed in.
_Avoid_: customer, client, buyer, visitor

**User**:
A shopper's account: a name, an email, a password, a role and whether it is active. A shopper
without one is a guest. An admin can deactivate a user and reactivate them later; a deactivated
account cannot sign in, its open session ends on its next request, and its orders stay. A shopper
who deletes their own account is a deactivated account too, so its email cannot be reused until an
admin reactivates it.
_Avoid_: account, member, profile, deleted user

**Admin**:
A user whose role lets them manage the catalogue and move orders between statuses.
_Avoid_: staff, operator, superuser

**Guest**:
A shopper who is not signed in. A guest can browse and fill a guest cart but cannot check out.
_Avoid_: anonymous user, visitor

**Cart**:
The products a shopper intends to buy, with a quantity for each. A user has exactly one, created
the first time it is needed.
_Avoid_: basket, bag, shopping cart

**Cart item**:
One line in a cart: a product and a quantity. A cart has at most one line per product.
_Avoid_: line item, entry, cart product

**Guest cart**:
The cart a guest keeps in the browser. It becomes part of the user's cart through cart sync.
_Avoid_: local cart, anonymous cart, offline cart

**Cart sync**:
Merging a guest cart into the signed-in user's cart, on sign-in or on reaching checkout.
Quantities for the same product add up; nothing is replaced.
_Avoid_: cart merge, cart migration, catalogue sync (a different operation)

**Mini-cart**:
The dialog opened from the navigation bar that shows the cart and leads to checkout.
_Avoid_: cart drawer, cart popover, cart modal

**Checkout**:
The step that turns a non-empty cart into an order and empties the cart. Only a user can check out.
_Avoid_: purchase, place order, payment

**Order**:
The record of one checkout: its items at the prices paid, its totals, shipping and billing
addresses, payment method, order status and payment status.
_Avoid_: purchase, transaction, sale

**Order item**:
One line in an order: a product, a quantity and the price at the time of checkout. Later price
changes do not touch it.
_Avoid_: line item, order product

**Order status**:
Where an order is in fulfilment: Pending, Processing, Shipped, Delivered or Cancelled. An admin moves
it along `ORDER_STATUS_TRANSITIONS` in `@repo/domain`: Pending to Processing or Cancelled,
Processing to Shipped or Cancelled, Shipped to Delivered or Cancelled, Delivered to Cancelled only.
Cancelled is final. The server refuses any other move and the dashboard offers only these.
_Avoid_: order state, fulfilment status

**Payment status**:
Whether an order has been paid: Pending, Paid, Failed or Refunded. It moves independently of order
status, along `PAYMENT_STATUS_TRANSITIONS` in `@repo/domain`: Pending to Paid or Failed, Failed to
Paid, Paid to Refunded. Refunded is final. There is no payment gateway, so an admin sets it by hand
until one exists; cancelling a Paid order is allowed and may leave a refund due.
_Avoid_: payment state, paid flag

**Order totals**:
An order's subtotal, shipping cost, tax and total. Subtotal is the sum of its lines, shipping is a
flat amount, tax is a fixed share of the subtotal, and total is the three added together.
_Avoid_: grand total, amount, price breakdown

**Stats period**:
The window the dashboard's stats page counts over: the last 7, 30 or 90 days, or all time, chosen
with tabs and never a custom range. Every number is for the orders created in it, except new
customers, which counts the users created in it; revenue is the total of its Paid orders whatever
their order status, so a Refunded order drops out and a cancelled Paid order stays.
_Avoid_: date range, time frame, window

**Ownership**:
A cart item or order belongs to the user who created it. Any other user reaching for it is refused
as forbidden, not treated as unauthenticated and not told it does not exist.
_Avoid_: access control, scoping

## Media

**Media**:
The catalogue's images, owned by the repo and served from the media bucket.
_Avoid_: assets (ambiguous with UI chrome), uploads, static files

**Image key**:
The bucket path that identifies one image file. It is what the catalogue stores; the URL is
derived from it at the API boundary and never stored.
_Avoid_: image URL, src, image path

**Image variant**:
One image file: a key and its pixel width and height.
_Avoid_: size, rendition, crop (that is what a breakpoint selects)

**Single image**:
One picture in one variant with its alt text. Thumbnails are single images.
_Avoid_: static image, plain image

**Responsive image**:
One picture in three variants, mobile, tablet and desktop, sharing one alt text.
_Avoid_: picture set, srcset, image set

**Image role**:
What a product image is for on the page: primary, intro, featured, showcase, related, gallery or
thumbnail. A product has one image per role, except gallery, which has several.
_Avoid_: image type, image slot, image kind

**Manifest**:
The committed listing of every media file with its size and checksum. It is how a changed image
shows up in review; nothing that ships reads it.
_Avoid_: index, registry, media list

**UI chrome**:
Imagery that belongs to the interface rather than to any product or category, such as the
best-gear hero and the icons. It ships with the client, not with the media.
_Avoid_: static assets, decorative images, brand images

## Data operations

**Seed**:
Wiping a local database and recreating the catalogue together with the demo users. It is a local
operation and never runs against production.
_Avoid_: fixtures, bootstrap, reset (that is a seed plus a schema push)

**Demo users**:
The three admins and three shoppers the seed creates so a local or end-to-end run has someone to
sign in as.
_Avoid_: test users, fixtures, mock users

**Catalogue sync**:
Writing the catalogue the repo owns onto a database by matching on each record's stable key, so
users, carts and orders survive and running it twice changes nothing. It is the migration step after
a catalogue or schema change and runs after every deploy.
_Avoid_: migration, seed, cart sync, media sync

**Media sync**:
Uploading the repo's media to the bucket and, when asked, removing bucket files the repo no longer
has.
_Avoid_: deploy images, publish images, catalogue sync
