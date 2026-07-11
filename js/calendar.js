/* =========================================================================
   calendar.js — month view: the primary screen of the app.
   Renders a 6-week grid, paints block colour bands behind days,
   and stacks session chips inside each day cell.
   ========================================================================= */
const Calendar = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(), // 0-indexed

  gridStart() {
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const dow = first.getDay(); // 0 = Sunday
    const start = new Date(first);
    start.setDate(1 - dow);
    return start;
  },

  async render() {
    const start = this.gridStart();
    const startISO = fmtISO(start);
    const endISO = addDays(startISO, 41); // 6 weeks

    await Blocks.loadAll();
    await Sessions.loadRange(startISO, endISO);

    document.getElementById("calMonthLabel").textContent =
      new Date(this.viewYear, this.viewMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const grid = document.getElementById("calGrid");
    grid.innerHTML = "";
    const todayIso = todayISO();

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = fmtISO(d);
      const isOutside = d.getMonth() !== this.viewMonth;
      const isToday = iso === todayIso;
      const block = Blocks.forDate(iso);
      const sessions = Sessions.byDate[iso] || [];

      const cell = document.createElement("div");
      cell.className = "cal-day" + (isOutside ? " is-outside" : "") + (isToday ? " is-today" : "") + (block ? " has-block" : "");
      cell.tabIndex = 0;
      cell.dataset.date = iso;
      if (block) {
        const p = blockPaletteFor(block.phase);
        cell.style.setProperty("--block-color", p.color);
        cell.style.setProperty("--block-tint", p.tint);
      }

      const showBlockTag = block && (i === 0 || d.getDate() === 1 || iso === block.startDate);

      const chipsHtml = sessions.slice(0, 3).map((s) => this.chipHtml(s)).join("");
      const moreCount = sessions.length - 3;

      cell.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          ${showBlockTag ? `<span class="cal-block-tag">${escapeHtml(block.name)}</span>` : "<span></span>"}
          <span class="cal-day-num">${d.getDate()}</span>
        </div>
        <div class="cal-sessions">
          ${chipsHtml}
          ${moreCount > 0 ? `<div class="cal-more">+${moreCount} more</div>` : ""}
        </div>
      `;

      cell.addEventListener("click", () => this.openDay(iso));
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.openDay(iso); }
      });

      grid.appendChild(cell);
    }
  },

  chipHtml(s) {
    const meta = SESSION_TYPES[s.type] || SESSION_TYPES.erg;
    const statusClass = s.status === "done" ? "is-done" : s.status === "skipped" ? "is-skipped" : "";
    const testClass = s.type === "test" ? "is-test" : "";
    const label = s.type === "test" ? `${s.title} · ${s.testDistance}m` : s.title;
    return `<div class="sess-chip ${statusClass} ${testClass}" style="--chip-color:${meta.color}">
      <i class="bi ${meta.icon}"></i><span>${escapeHtml(label)}</span>
    </div>`;
  },

  openDay(iso) {
    DayPanel.open(iso);
  },

  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
    this.render();
  },
  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
    this.render();
  },
  goToday() {
    const t = new Date();
    this.viewYear = t.getFullYear();
    this.viewMonth = t.getMonth();
    this.render();
  },
};

/* Day panel — offcanvas showing all sessions on a day with add/edit/status controls */
const DayPanel = {
  currentDate: null,

  async open(iso) {
    this.currentDate = iso;
    const el = document.getElementById("dayOffcanvas");
    const block = Blocks.forDate(iso);
    document.getElementById("dayOffcanvasLabel").textContent =
      parseISO(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const blockInfo = document.getElementById("dayBlockInfo");
    if (block) {
      const p = blockPaletteFor(block.phase);
      blockInfo.innerHTML = `<span class="badge" style="background:${p.color}">${escapeHtml(block.name)}</span>`;
    } else {
      blockInfo.innerHTML = `<span class="text-muted small">No block assigned</span>`;
    }

    await this.renderSessions();

    document.getElementById("addSessionBtn").onclick = () => Sessions.openEditor(iso, null);

    bootstrap.Offcanvas.getOrCreateInstance(el).show();
  },

  async renderSessions() {
    const iso = this.currentDate;
    await Sessions.loadRange(iso, iso);
    const list = Sessions.byDate[iso] || [];
    const wrap = document.getElementById("daySessionsList");
    if (!list.length) {
      wrap.innerHTML = `<div class="text-muted text-center py-4"><i class="bi bi-calendar2-plus fs-2 d-block mb-2"></i>No sessions planned. Add one below.</div>`;
      return;
    }
    wrap.innerHTML = list.map((s) => {
      const meta = SESSION_TYPES[s.type];
      const statusIcon = s.status === "done" ? "bi-check-circle-fill text-success"
        : s.status === "skipped" ? "bi-x-circle text-secondary" : "bi-circle text-muted";
      return `
        <div class="card-quiet p-2 px-3 mb-2 d-flex flex-row justify-content-between align-items-center">
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="type-badge type-${s.type}"><i class="bi ${meta.icon}"></i>${meta.label}</span>
              ${s.time ? `<span class="text-mono small text-muted">${s.time}</span>` : ""}
            </div>
            <div class="fw-semibold mt-1">${escapeHtml(s.title)}${s.type === "test" ? ` — ${s.testDistance}m` : ""}</div>
            ${s.plannedDetail ? `<div class="small text-muted">${escapeHtml(s.plannedDetail)}</div>` : ""}
            ${s.status === "done" && s.type === "test" && s.actual && s.actual.timeSeconds
              ? `<div class="small text-mono mt-1">Result: ${formatSplit(s.actual.timeSeconds)}</div>` : ""}
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-light" data-status="${s.id}" title="Cycle status"><i class="bi ${statusIcon}"></i></button>
            <button class="btn btn-sm btn-outline-secondary" data-edit="${s.id}"><i class="bi bi-pencil"></i></button>
          </div>
        </div>`;
    }).join("");

    wrap.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = list.find((x) => x.id === btn.dataset.edit);
        Sessions.openEditor(iso, s);
      });
    });
    wrap.querySelectorAll("[data-status]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const s = list.find((x) => x.id === btn.dataset.status);
        const order = ["planned", "done", "skipped"];
        s.status = order[(order.indexOf(s.status) + 1) % order.length];
        await Sessions.save(s);
        await this.renderSessions();
        Calendar.render();
      });
    });
  },
};

function formatSplit(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}
