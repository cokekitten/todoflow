import test from "node:test";
import assert from "node:assert/strict";

import { generateOccurrences } from "./dates";

test("daily: generates correct dates", () => {
  const dates = generateOccurrences({
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-04-01",
  });
  assert.deepEqual(dates, [
    "2026-03-28",
    "2026-03-29",
    "2026-03-30",
    "2026-03-31",
    "2026-04-01",
  ]);
});

test("weekly: generates same day-of-week", () => {
  const dates = generateOccurrences({
    frequency: "weekly",
    startDate: "2026-03-28",
    endDate: "2026-04-25",
  });
  assert.deepEqual(dates, [
    "2026-03-28",
    "2026-04-04",
    "2026-04-11",
    "2026-04-18",
    "2026-04-25",
  ]);
});

test("monthly: generates same day-of-month", () => {
  const dates = generateOccurrences({
    frequency: "monthly",
    startDate: "2026-01-15",
    endDate: "2026-05-15",
  });
  assert.deepEqual(dates, [
    "2026-01-15",
    "2026-02-15",
    "2026-03-15",
    "2026-04-15",
    "2026-05-15",
  ]);
});

test("monthly: clamps to last day for short months (31st)", () => {
  const dates = generateOccurrences({
    frequency: "monthly",
    startDate: "2026-01-31",
    endDate: "2026-04-30",
  });
  assert.deepEqual(dates, [
    "2026-01-31",
    "2026-02-28",
    "2026-03-31",
    "2026-04-30",
  ]);
});

test("monthly: Feb 29 in leap year, Feb 28 in non-leap", () => {
  const dates = generateOccurrences({
    frequency: "monthly",
    startDate: "2028-01-29",
    endDate: "2028-03-29",
  });
  assert.deepEqual(dates, ["2028-01-29", "2028-02-29", "2028-03-29"]);

  const dates2 = generateOccurrences({
    frequency: "monthly",
    startDate: "2026-01-29",
    endDate: "2026-03-29",
  });
  assert.deepEqual(dates2, ["2026-01-29", "2026-02-28", "2026-03-29"]);
});

test("yearly: generates same month and day", () => {
  const dates = generateOccurrences({
    frequency: "yearly",
    startDate: "2026-03-28",
    endDate: "2030-03-28",
  });
  assert.deepEqual(dates, [
    "2026-03-28",
    "2027-03-28",
    "2028-03-28",
    "2029-03-28",
    "2030-03-28",
  ]);
});

test("yearly: Feb 29 start uses Feb 28 in non-leap years", () => {
  const dates = generateOccurrences({
    frequency: "yearly",
    startDate: "2028-02-29",
    endDate: "2032-02-29",
  });
  assert.deepEqual(dates, [
    "2028-02-29",
    "2029-02-28",
    "2030-02-28",
    "2031-02-28",
    "2032-02-29",
  ]);
});

test("no endDate: generates up to 20 years from startDate", () => {
  const dates = generateOccurrences({
    frequency: "yearly",
    startDate: "2026-03-28",
  });
  assert.equal(dates.length, 21);
  assert.equal(dates[0], "2026-03-28");
  assert.equal(dates[dates.length - 1], "2046-03-28");
});

test("endDate before startDate: returns empty array", () => {
  const dates = generateOccurrences({
    frequency: "daily",
    startDate: "2026-03-28",
    endDate: "2026-03-20",
  });
  assert.deepEqual(dates, []);
});
