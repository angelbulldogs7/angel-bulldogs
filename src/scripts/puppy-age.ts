import {
  AGE_TIMEZONE,
  calendarAgeMonthsDays,
  formatCalendarAge,
} from "../utils/puppyAge";

const SELECTOR = "[data-puppy-age][data-birth-date]";

function refreshAges(now = new Date()) {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    const birth = el.dataset.birthDate;
    if (!birth) return;
    const age = calendarAgeMonthsDays(birth, now, AGE_TIMEZONE);
    if (!age) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = formatCalendarAge(age);
  });
}

function chicagoDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

let lastDateKey = chicagoDateKey();
let timer: number | undefined;

function tick() {
  const key = chicagoDateKey();
  if (key !== lastDateKey) {
    lastDateKey = key;
    refreshAges();
  }
}

function start() {
  refreshAges();
  if (timer) window.clearInterval(timer);
  timer = window.setInterval(tick, 60_000);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    lastDateKey = chicagoDateKey();
    refreshAges();
  }
});

window.addEventListener("pageshow", () => {
  lastDateKey = chicagoDateKey();
  refreshAges();
});

start();

document.addEventListener("astro:page-load", start);
