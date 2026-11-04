export function isValidTz(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// Calendar date (YYYY-MM-DD) of a moment in a given timezone
export function dayKey(date: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function resolveTz(req: Request) {
  const p = new URL(req.url).searchParams.get("tz") ?? "UTC";
  return isValidTz(p) ? p : "UTC";
}