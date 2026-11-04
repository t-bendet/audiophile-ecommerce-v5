# Order status events are embedded in orders

Each order embeds its status events. Creation records Pending with the shopper as actor; each status move records the acting user or the system, its time and any shipment tracking. Existing orders without events read as one Pending event at creation time without a backfill.

## Considered options

A separate audit collection would support independent queries but would require coordinating multiple writes for every status move. Embedded events keep the history with the order and let one write change the status and append its event.

## Consequences

The update is guarded by the current status, so concurrent moves cannot both succeed from the same state. The event history grows with the order and is read with it. Payment changes are separate from order status events.
