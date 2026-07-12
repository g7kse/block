/* =========================================================================
   constants.js
   ========================================================================= */
const SESSION_TYPES = {
  erg:        { label: "Erg",        icon: "bi-speedometer2",      color: "var(--teal)"  },
  water:      { label: "On Water",   icon: "bi-water",             color: "var(--slate)" },
  weights:    { label: "Weights",    icon: "bi-lightning-charge-fill", color: "var(--oak)" },
  flexibility:{ label: "Flexibility",icon: "bi-flower1",           color: "var(--moss)"  },
  running:    { label: "Running",    icon: "bi-person-walking",    color: "var(--dusk)"  },
  cycling:    { label: "Cycling",    icon: "bi-bicycle",           color: "var(--harbor)"},
  test:       { label: "Test",       icon: "bi-stopwatch-fill",    color: "var(--buoy)"  },
};

const TEST_DISTANCES = [500, 1000, 2000]; // metres — 500m, 1k, 2k

const BLOCK_PALETTE = [
  { key: "base",     label: "Base Building", color: "#3E6FA6", tint: "var(--band-base)" },
  { key: "build",    label: "Build",         color: "#1F6F78", tint: "var(--band-build)" },
  { key: "race",     label: "Race Prep",     color: "#C9822A", tint: "var(--band-race)" },
  { key: "taper",    label: "Taper",         color: "#5B8A46", tint: "var(--band-taper)" },
  { key: "recovery", label: "Recovery",      color: "#7A7A7A", tint: "var(--band-recovery)" },
  { key: "custom",   label: "Custom",        color: "#8A4B86", tint: "var(--band-custom)" },
];

function blockPaletteFor(key) {
  return BLOCK_PALETTE.find((b) => b.key === key) || BLOCK_PALETTE[BLOCK_PALETTE.length - 1];
}

function fmtISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return fmtISO(d);
}
function todayISO() {
  return fmtISO(new Date());
}
