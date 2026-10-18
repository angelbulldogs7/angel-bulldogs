import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calendarAgeMonthsDays,
  formatCalendarAge,
  getZonedYmd,
  parseIsoDateParts,
} from "./puppyAge.ts";

describe("parseIsoDateParts", () => {
  it("accepts real calendar dates", () => {
    assert.deepEqual(parseIsoDateParts("2026-08-05"), { year: 2026, month: 8, day: 5 });
  });

  it("rejects invalid calendar dates", () => {
    assert.equal(parseIsoDateParts("2026-02-30"), null);
    assert.equal(parseIsoDateParts("not-a-date"), null);
  });
});

describe("calendarAgeMonthsDays for Angel litter", () => {
  const birth = "2026-08-05";

  it("is 0 days on the birth date in Chicago", () => {
    const age = calendarAgeMonthsDays(birth, new Date("2026-08-05T17:00:00Z"));
    assert.deepEqual(age, { months: 0, days: 0 });
    assert.equal(formatCalendarAge(age!), "0 days old");
  });

  it("is 1 day on August 6 Chicago", () => {
    const age = calendarAgeMonthsDays(birth, new Date("2026-08-06T17:00:00Z"));
    assert.deepEqual(age, { months: 0, days: 1 });
    assert.equal(formatCalendarAge(age!), "1 day old");
  });

  it("is 1 month on September 5 Chicago", () => {
    const age = calendarAgeMonthsDays(birth, new Date("2026-09-05T17:00:00Z"));
    assert.deepEqual(age, { months: 1, days: 0 });
    assert.equal(formatCalendarAge(age!), "1 month old");
  });

  it("is 1 month, 29 days on October 4 Chicago", () => {
    const age = calendarAgeMonthsDays(birth, new Date("2026-10-04T17:00:00Z"));
    assert.deepEqual(age, { months: 1, days: 29 });
    assert.equal(formatCalendarAge(age!), "1 month, 29 days old");
  });

  it("is 2 months, 12 days on October 17 Chicago", () => {
    const age = calendarAgeMonthsDays(birth, new Date("2026-10-17T17:00:00Z"));
    assert.deepEqual(age, { months: 2, days: 12 });
    assert.equal(formatCalendarAge(age!), "2 months, 12 days old");
  });

  it("keeps Chicago October 17 just before the UTC date rolls", () => {
    const age = calendarAgeMonthsDays(birth, new Date("2026-10-18T04:59:59Z"));
    assert.deepEqual(getZonedYmd(new Date("2026-10-18T04:59:59Z")), {
      year: 2026,
      month: 10,
      day: 17,
    });
    assert.deepEqual(age, { months: 2, days: 12 });
  });

  it("moves to October 18 Chicago at 05:00 UTC", () => {
    const instant = new Date("2026-10-18T05:00:00Z");
    assert.deepEqual(getZonedYmd(instant), { year: 2026, month: 10, day: 18 });
    assert.deepEqual(calendarAgeMonthsDays(birth, instant), { months: 2, days: 13 });
  });

  it("is 3 months on November 5 Chicago", () => {
    const age = calendarAgeMonthsDays(birth, new Date("2026-11-05T17:00:00Z"));
    assert.deepEqual(age, { months: 3, days: 0 });
    assert.equal(formatCalendarAge(age!), "3 months old");
  });

  it("counts calendar days across the November DST change", () => {
    const before = calendarAgeMonthsDays(birth, new Date("2026-11-01T17:00:00Z"));
    const after = calendarAgeMonthsDays(birth, new Date("2026-11-03T17:00:00Z"));
    assert.deepEqual(before, { months: 2, days: 27 });
    assert.deepEqual(after, { months: 2, days: 29 });
  });

  it("does not return negative ages for future birth dates", () => {
    assert.equal(calendarAgeMonthsDays("2099-01-01", new Date("2026-10-17T17:00:00Z")), null);
  });
});
