/* =========================================================================
   countdown.js — regatta start-clock countdown to the target event
   ========================================================================= */
const Countdown = {
  eventDate: new Date(2027, 8, 8, 0, 0, 0), // 8 Sept 2027 (month is 0-indexed)
  els: {},

  init() {
    this.els.days = document.getElementById("cw-days");
    this.els.hours = document.getElementById("cw-hours");
    this.els.mins = document.getElementById("cw-mins");
    this.els.secs = document.getElementById("cw-secs");
    this.els.raceName = document.getElementById("cw-race-name");
    this.tick();
    setInterval(() => this.tick(), 1000);
  },

  async setEventDate(dateObj, label) {
    this.eventDate = dateObj;
    await DB.setSetting("eventDate", dateObj.toISOString());
    if (label !== undefined) await DB.setSetting("eventName", label);
    this.tick();
  },

  async loadFromSettings() {
    const iso = await DB.getSetting("eventDate", null);
    const name = await DB.getSetting("eventName", "Race Day");
    if (iso) this.eventDate = new Date(iso);
    if (this.els.raceName) this.els.raceName.textContent = name;
  },

  tick() {
    const now = new Date();
    let diff = this.eventDate.getTime() - now.getTime();
    const past = diff < 0;
    if (past) diff = 0;

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (this.els.days) this.els.days.textContent = String(days);
    if (this.els.hours) this.els.hours.textContent = String(hours).padStart(2, "0");
    if (this.els.mins) this.els.mins.textContent = String(mins).padStart(2, "0");
    if (this.els.secs) this.els.secs.textContent = String(secs).padStart(2, "0");

    const label = document.getElementById("cw-status");
    if (label) label.textContent = past ? "Race day has passed" : "Until race day";
  },
};
