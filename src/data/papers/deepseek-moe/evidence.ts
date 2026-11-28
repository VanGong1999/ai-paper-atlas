export function filterEvidenceRows<T extends { text: string }>(
  rows: T[][],
  query: string,
): T[][] {
  return rows.length
    ? [
        rows[0],
        ...rows
          .slice(1)
          .filter(
            (row) =>
              !query ||
              row.some((cell) =>
                cell.text.toLowerCase().includes(query.toLowerCase()),
              ),
          ),
      ]
    : [];
}
export function isolationBudget(total: number, active: number, shared: number) {
  if (shared < 0 || shared >= active || active > total)
    throw new Error("Invalid isolation budget");
  return { routed: total - shared, topK: active - shared };
}
