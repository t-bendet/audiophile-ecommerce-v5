export function trackingUrl(
  carrier: string,
  number: string,
): string | undefined {
  const encoded = encodeURIComponent(number);
  switch (carrier.trim().toLowerCase()) {
    case "ups":
      return `https://www.ups.com/track?tracknum=${encoded}`;
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
    case "dhl":
      return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encoded}`;
    default:
      return undefined;
  }
}
