const count = new Intl.NumberFormat("en-PH");
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export const formatCount = (value: number) => count.format(value);
export const formatPeso = (value: number) => peso.format(value);
