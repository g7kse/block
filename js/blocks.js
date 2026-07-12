/* =========================================================================
   blocks.js — training blocks (multi-week phases): Base, Build, Race Prep,
   Taper, Recovery, Custom. Each spans a date range and paints the calendar.
   ========================================================================= */
const Blocks = {
  cache: [],

  async loadAll() {
    this.cache = await DB.all("blocks");
    this.cache.sort((a, b) => a.startDate.localeCompare(b.startDate));
    return this.cache;
  },

  // returns the block covering a given ISO date, or null
  forDate(iso) {
    return this.cache.find((b) => iso >= b.startDate && iso <= b.endDate) || null;
  },

  async save(block) {
    if (!block.id) block.id = DB.uid();
    await DB.put("blocks", block);
    await this.loadAll();
  },

  async remove(id) {
    await DB.delete("blocks", id);
    await this.loadAll();
  },

  openEditor(existing) {
    const isNew = !existing;
    const b = existing || {
      id: null, name: "", phase: "base", startDate: todayISO(),
      endDate: addDays(todayISO(), 27), notes: "",
    };

    const modalEl = document.getElementById("blockModal");
    const form = document.getElementById("blockForm");
    form.reset();
    document.getElementById("blockModalTitle").textContent = isNew ? "New training block" : "Edit training block";
    form.elements.name.value = b.name;
    form.elements.phase.value = b.phase;
    form.elements.startDate.value = b.startDate;
    form.elements.endDate.value = b.endDate;
    form.elements.notes.value = b.notes || "";
    document.getElementById("blockDeleteBtn").hidden = isNew;
    document.getElementById("blockDeleteBtn").onclick = async () => {
      if (confirm(`Delete block "${b.name}"? Sessions inside it are kept.`)) {
        await this.remove(b.id);
        bootstrap.Modal.getInstance(modalEl).hide();
        App.refreshCurrentView();
      }
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      if (form.elements.startDate.value > form.elements.endDate.value) {
        alert("Start date must be before end date.");
        return;
      }
      const updated = {
        id: b.id,
        name: form.elements.name.value.trim() || blockPaletteFor(form.elements.phase.value).label,
        phase: form.elements.phase.value,
        startDate: form.elements.startDate.value,
        endDate: form.elements.endDate.value,
        notes: form.elements.notes.value.trim(),
      };
      await this.save(updated);
      bootstrap.Modal.getInstance(modalEl).hide();
      App.refreshCurrentView();
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  },

  renderList() {
    const wrap = document.getElementById("blocksList");
    if (!this.cache.length) {
      wrap.innerHTML = `<div class="text-center text-muted py-5">
        <i class="bi bi-flag fs-1 d-block mb-2"></i>
        No blocks yet. Create one to start painting the calendar.
      </div>`;
      return;
    }
    wrap.innerHTML = this.cache.map((b) => {
      const p = blockPaletteFor(b.phase);
      const weeks = Math.max(1, Math.round((parseISO(b.endDate) - parseISO(b.startDate)) / (7 * 86400000)));
      return `
        <div class="block-card mb-2" style="--block-color:${p.color}">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="block-swatch"></span>
              <strong>${escapeHtml(b.name)}</strong>
              <span class="text-muted small">· ${p.label} · ${weeks} wk${weeks > 1 ? "s" : ""}</span>
            </div>
            <div class="text-mono small text-muted">${b.startDate} → ${b.endDate}</div>
            ${b.notes ? `<div class="small mt-1">${escapeHtml(b.notes)}</div>` : ""}
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" data-edit-block="${b.id}"><i class="bi bi-pencil"></i></button>
          </div>
        </div>`;
    }).join("");

    wrap.querySelectorAll("[data-edit-block]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const b = this.cache.find((x) => x.id === btn.dataset.editBlock);
        this.openEditor(b);
      });
    });
  },
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
