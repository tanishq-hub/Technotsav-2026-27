// Keep event schedules anchored to IST, regardless of each visitor's device timezone.
// Future event timestamps should include an explicit UTC offset and render with this zone.
export const EVENT_TIME_ZONE = "Asia/Kolkata";
export const TECHNOTSAV_EVENT_START = Date.parse("2026-11-27T00:00:00+05:30");
