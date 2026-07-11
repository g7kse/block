/* =========================================================================
   sessions.js — individual activities on a specific date.
   Types: erg, water, weights, flexibility, running, cycling, test.
   Each has planned details, a status (planned/done/skipped), and,
   once done, actuals. Test sessions also record a result time/split.
   ========================================================================= */
const Sessions = {
  cache: [],       // sessions currently loaded for the visible range
  byDate: {},      // iso -> [session,...]

  async loadRange(startISO, endISO) {
    this.cache = await DB.sessionsInRange(startISO, endISO);
    this.byDate = {};
    this.cache.forEach((s) => {
      (this.byDate[s.date] = this.byDate[s.date] || []).push(s);
    });
    Object.values(this.byDate).forEach((list) =>
      list.sort((a, b) => (a.time || "").localeCompare(b.time || ""))
    );
    return this.cache;
  },

  async save(session) {
    if (!session.id) session.id = DB.uid();
    await DB.put("sessions", session);
  },

  async remove(id) {
    await DB.delete("sessions", id);
  },

  async allTestResults() {
    const all = await DB.all("sessions");
    return all
      .filter((s) => s.type === "test" && s.status === "done" && s.actual && s.actual.timeSeconds)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  openEditor(dateISO, existing) {
    const isNew = !existing;
    const s = existing || {
      id: null, date: dateISO, type: "erg", time: "", title: "",
      plannedDetail: "", status: "planned", testDistance: 2000,
      actual: {},
    };

    const modalEl = document.getElementById("sessionModal");
    const form = document.getElementById("sessionForm");
    form.reset();
    document.getElementById("sessionModalTitle").textContent = isNew ? "New session" : "Edit session";
    form.elements.date.value = s.date;
    form.elements.type.value = s.type;
    form.elements.time.value = s.time || "";
    form.elements.title.value = s.title || "";
    form.elements.plannedDetail.value = s.plannedDetail || "";
    form.elements.status.value = s.status || "planned";
    form.elements.testDistance.value = s.testDistance || 2000;

    // actuals
    form.elements.actualDuration.value = s.actual && s.actual.duration || "";
    form.elements.actualDistance.value = s.actual && s.actual.distance || "";
    form.elements.actualNotes.value = s.actual && s.actual.notes || "";
    form.elements.testMinutes.value = s.actual && s.actual.timeSeconds != null ? Math.floor(s.actual.timeSeconds / 60) : "";
    form.elements.testSeconds.value = s.actual && s.actual.timeSeconds != null ? (s.actual.timeSeconds % 60).toFixed(1) : "";

    this.toggleTypeFields(form);
    form.elements.type.onchange = () => this.toggleTypeFields(form);
    form.elements.status.onchange = () => this.toggleTypeFields(form);

    document.getElementById("sessionDeleteBtn").hidden = isNew;
    document.getElementById("sessionDeleteBtn").onclick = async () => {
      if (confirm("Delete this session?")) {
        await this.remove(s.id);
        bootstrap.Modal.getInstance(modalEl).hide();
        App.refreshCurrentView();
      }
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const type = form.elements.type.value;
      const status = form.elements.status.value;
      const mins = parseFloat(form.elements.testMinutes.value);
      const secs = parseFloat(form.elements.testSeconds.value);
      const hasTestTime = !isNaN(mins) || !isNaN(secs);

      const updated = {
        id: s.id,
        date: form.elements.date.value,
        type,
        time: form.elements.time.value,
        title: form.elements.title.value.trim() || SESSION_TYPES[type].label,
        plannedDetail: form.elements.plannedDetail.value.trim(),
        status,
        testDistance: type === "test" ? Number(form.elements.testDistance.value) : undefined,
        actual: {
          duration: form.elements.actualDuration.value.trim(),
          distance: form.elements.actualDistance.value.trim(),
          notes: form.elements.actualNotes.value.trim(),
          timeSeconds: (type === "test" && hasTestTime)
            ? (isNaN(mins) ? 0 : mins * 60) + (isNaN(secs) ? 0 : secs)
            : (s.actual ? s.actual.timeSeconds : undefined),
        },
      };
      await this.save(updated);
      bootstrap.Modal.getInstance(modalEl).hide();
      App.refreshCurrentView();
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  },

  toggleTypeFields(form) {
    const isTest = form.elements.type.value === "test";
    document.getElementById("testDistanceGroup").hidden = !isTest;
    document.getElementById("testResultGroup").hidden = !isTest;
  },
};
