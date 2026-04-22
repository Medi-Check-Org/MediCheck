// Safe date display: avoid "Invalid Date" when product or date is null
export const formatProductDate = (date: Date | string | null | undefined): string => {
  if (date == null) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};
