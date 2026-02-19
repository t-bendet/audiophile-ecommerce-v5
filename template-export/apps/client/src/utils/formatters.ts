export default function currencyFormatter(price: number) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const parts = formatter.formatToParts(price);
  const filterParts = parts.map((part) => {
    if (part.type === "currency") {
      return `${part.value} `;
    }
    if (part.type === "fraction" || part.type === "decimal") {
      return "";
    }
    return part.value;
  });
  return filterParts.join("");
}
