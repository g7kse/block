/* =========================================================================
   tests.js — 500m / 1k / 2k test-piece results and trend view.
   ========================================================================= */
const Tests = {
  async render() {
    const results = await Sessions.allTestResults();
    const wrap = document.getElementById("testsGrid");
    wrap.innerHTML = "";

    TEST_DISTANCES.forEach((dist) => {
      const rows = results.filter((r) => r.testDistance === dist);
      const tile = document.createElement("div");
      tile.className = "test-tile";
      if (!rows.length) {
        tile.innerHTML = `
          <div class="test-dist">${dist} m</div>
          <div class="test-best text-muted">—</div>
          <div class="test-sub">No results yet</div>`;
      } else {
        const best = rows.reduce((a, b) => (a.actual.timeSeconds < b.actual.timeSeconds ? a : b));
        const latest = rows[rows.length - 1];
        tile.innerHTML = `
          <div class="test-dist">${dist} m</div>
          <div class="test-best">${formatSplit(best.actual.timeSeconds)}</div>
          <div class="test-sub">Best · ${rows.length} test${rows.length > 1 ? "s" : ""} · latest ${formatSplit(latest.actual.timeSeconds)} on ${latest.date}</div>
          ${this.sparklineSvg(rows)}
        `;
      }
      wrap.appendChild(tile);
    });

    this.renderHistoryTable(results);
  },

  sparklineSvg(rows) {
    if (rows.length < 2) return "";
    const times = rows.map((r) => r.actual.timeSeconds);
    const min = Math.min(...times), max = Math.max(...times);
    const w = 260, h = 46, pad = 4;
    const pts = times.map((t, i) => {
      const x = pad + (i / (times.length - 1)) * (w - pad * 2);
      // lower time is better -> plot inverted so improvement trends upward visually
      const norm = max === min ? 0.5 : (t - min) / (max - min);
      const y = pad + norm * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${pts.join(" ")}" fill="none" stroke="var(--buoy)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  },

  renderHistoryTable(results) {
    const tbody = document.getElementById("testsHistoryBody");
    if (!results.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No test results logged yet. Mark a test session as done with a result to see it here.</td></tr>`;
      return;
    }
    const rows = [...results].sort((a, b) => b.date.localeCompare(a.date));
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td class="text-mono">${r.date}</td>
        <td>${r.testDistance} m</td>
        <td class="text-mono">${formatSplit(r.actual.timeSeconds)}</td>
        <td class="small text-muted">${escapeHtml(r.actual.notes || "")}</td>
      </tr>
    `).join("");
  },
};
