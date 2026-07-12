/* =========================================================================
   app.js — bootstraps the app, wires navigation and settings.
   ========================================================================= */
const App = {
  currentView: "month",

  async init() {
    this.wireNav();
    this.wireModals();
    this.wireSettings();
    Countdown.init();
    try {
      await Countdown.loadFromSettings();
    } catch (err) {
      console.error("Countdown: could not load saved event date", err);
    }
    try {
      await this.showView("month");
    } catch (err) {
      console.error("App: failed to render initial view", err);
    }
    this.registerServiceWorker();
  },

  wireNav() {
    document.querySelectorAll("[data-view]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.showView(link.dataset.view);
      });
    });
    document.getElementById("prevMonthBtn").addEventListener("click", () => Calendar.prevMonth());
    document.getElementById("nextMonthBtn").addEventListener("click", () => Calendar.nextMonth());
    document.getElementById("todayBtn").addEventListener("click", () => Calendar.goToday());
    document.getElementById("newBlockBtn").addEventListener("click", () => Blocks.openEditor(null));
    document.getElementById("newBlockBtn2").addEventListener("click", () => Blocks.openEditor(null));
  },

  wireModals() {
    // nothing global needed yet; each module wires its own form submit handlers
  },

  async showView(view) {
    this.currentView = view;
    document.querySelectorAll(".view").forEach((v) => (v.hidden = v.dataset.view !== view));
    document.querySelectorAll(".sidebar-nav .nav-link").forEach((l) =>
      l.classList.toggle("active", l.dataset.view === view)
    );
    await this.refreshCurrentView();
  },

  async refreshCurrentView() {
    if (this.currentView === "month") await Calendar.render();
    else if (this.currentView === "blocks") { await Blocks.loadAll(); Blocks.renderList(); }
    else if (this.currentView === "tests") await Tests.render();
    else if (this.currentView === "settings") await this.renderSettings();
  },

  wireSettings() {
    document.getElementById("eventForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const dateVal = form.elements.eventDate.value;
      const name = form.elements.eventName.value.trim() || "Race Day";
      if (!dateVal) return;
      const [y, m, d] = dateVal.split("-").map(Number);
      await Countdown.setEventDate(new Date(y, m - 1, d), name);
      this.toast("Race day updated.");
    });

    document.getElementById("exportBtn").addEventListener("click", async () => {
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rowing-planner-backup-${todayISO()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("importInput").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (!confirm("Import will replace all current data on this device. Continue?")) {
          e.target.value = "";
          return;
        }
        await DB.importAll(data, { replace: true });
        await Countdown.loadFromSettings();
        this.toast("Data imported.");
        await this.refreshCurrentView();
      } catch (err) {
        alert("Could not read that file. Make sure it's a Rowing Planner backup JSON.");
      }
      e.target.value = "";
    });
  },

  async renderSettings() {
    const iso = await DB.getSetting("eventDate", null);
    const name = await DB.getSetting("eventName", "Race Day");
    const form = document.getElementById("eventForm");
    if (iso) form.elements.eventDate.value = fmtISO(new Date(iso));
    form.elements.eventName.value = name;
  },

  toast(msg) {
    const el = document.getElementById("appToast");
    el.querySelector(".toast-body").textContent = msg;
    bootstrap.Toast.getOrCreateInstance(el).show();
  },

  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      // relative path so it works under any subpath (Netlify or local file server)
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
