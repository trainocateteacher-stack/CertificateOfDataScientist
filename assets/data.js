/* テーマパーク演習データの読み込みと集計（全ページ共通）。ブラウザでは window.ParkData、Node では module.exports。 */
(function (root) {
  "use strict";
  const ATTRACTIONS = ["Sky Coaster", "Galaxy Flight", "Jungle Cruise", "Pirate Voyage",
    "Magic Castle", "Wonder Carousel", "Dinosaur Lab", "Ocean Theater"];
  const NUM_RE = /^-?\d+(\.\d+)?$/;

  function splitLine(line) {
    const cells = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === "," && !q) { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    return cells;
  }

  function parseCSV(text) {
    const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.length);
    const cols = splitLine(lines.shift());
    return lines.map((line) => {
      const cells = splitLine(line); const o = {};
      cols.forEach((k, i) => {
        const v = cells[i] === undefined ? "" : cells[i];
        o[k] = v === "" ? null : NUM_RE.test(v) ? Number(v) : v;
      });
      return o;
    });
  }

  async function loadTables(names, base = "data/") {
    const out = {};
    await Promise.all(names.map(async (n) => {
      const r = await fetch(`${base}${n}.csv`);
      if (!r.ok) throw new Error(`${n}.csv を読み込めませんでした（HTTP ${r.status}）`);
      out[n] = parseCSV(await r.text());
    }));
    return out;
  }

  const num = (xs) => xs.filter((v) => typeof v === "number" && Number.isFinite(v));
  const mean = (xs) => { const a = num(xs); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; };
  function quantile(xs, q) {
    const a = num(xs).sort((x, y) => x - y); if (!a.length) return null;
    const pos = (a.length - 1) * q; const lo = Math.floor(pos); const hi = Math.ceil(pos);
    return a[lo] + (a[hi] - a[lo]) * (pos - lo);
  }
  function median(xs) {
    const a = num(xs).sort((x, y) => x - y); if (!a.length) return null;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function std(xs) {
    const a = num(xs); const m = mean(a); if (m === null) return null;
    return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length);
  }
  function pearson(xs, ys) {
    const pairs = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    const mx = mean(pairs.map((p) => p[0])); const my = mean(pairs.map((p) => p[1]));
    let sxy = 0, sxx = 0, syy = 0;
    pairs.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
  }
  function resid(ys, zs) {
    const mz = mean(zs); const my = mean(ys);
    let szy = 0, szz = 0;
    zs.forEach((z, i) => { szy += (z - mz) * (ys[i] - my); szz += (z - mz) ** 2; });
    const b = szz ? szy / szz : 0;
    return ys.map((y, i) => y - (my + b * (zs[i] - mz)));
  }
  const partialR = (xs, ys, zs) => pearson(resid(xs, zs), resid(ys, zs));
  function groupBy(rows, keyFn) {
    const m = new Map();
    rows.forEach((r) => { const k = keyFn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    return m;
  }
  const fmt = (x, d = 1) => (x === null || x === undefined || Number.isNaN(x) ? "-" : Number(x).toFixed(d));

  const api = { ATTRACTIONS, parseCSV, loadTables, num, mean, median, quantile, std, pearson, partialR, groupBy, fmt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ParkData = api;
})(this);
