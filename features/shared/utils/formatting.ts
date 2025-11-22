export function formatNumber(value: number, decimals: number = 1): string {
  return Number(value.toFixed(decimals)).toString();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateToCompare = new Date(date);
  dateToCompare.setHours(0, 0, 0, 0);

  if (dateToCompare.getTime() === today.getTime()) return "Today";
  if (dateToCompare.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

export function getDaysBetween(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split("T")[0]);
  }

  return days;
}
