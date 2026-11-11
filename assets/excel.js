(function () {
  const $ = (s) => document.querySelector(s);
  const cache = {};
  let currentDataset = "raw";
  let rawRows = [];
  let viewRows = [];
  let headers = [];
  let sortKey = null;
  let sortDir = 1;
  let currentPage = 1;
  const PAGE_SIZE = 100;

  const HEADER_LABELS = {
    record_id: "ID",
    date: "日付",
    day_of_week: "曜日",
    weather: "天気",
    temperature_c: "気温(℃)",
    is_weekend: "週末フラグ",
    is_holiday: "祝日フラグ",
    event_flag: "イベント",
    park_visitors: "来園者数",
    attraction: "アトラクション",
    category: "エリア/分類",
    hour: "時間帯(時)",
    capacity_per_hour: "時間定員",
    wait_time_min: "待ち時間(分)",
    downtime_flag: "休止フラグ",
    satisfaction_1to5: "満足度(1-5)",
    food_sales_yen: "飲食売上(円)"
  };

  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    const cols = lines.shift().split(",");
    const rows = lines.map((line, idx) => {
      const cells = [];
      let cur = "", inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inQuotes = !inQuotes;
        else if (c === "," && !inQuotes) {
          cells.push(cur);
          cur = "";
        } else {
          cur += c;
        }
      }
      cells.push(cur);
      const obj = { __rowNum: idx + 1 };
      cols.forEach((k, i) => {
        obj[k] = cells[i] !== undefined ? cells[i] : "";
      });
      return obj;
    });
    return { cols, rows };
  }

  function toNum(v) {
    if (v === "" || v === null || v === undefined) return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function quantile(sorted, q) {
    if (!sorted.length) return NaN;
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  }

  function calcStats(rows) {
    const waits = rows.map((r) => toNum(r.wait_time_min)).filter(Number.isFinite);
    const missingCount = rows.filter((r) => r.wait_time_min === "").length;
    const outlierCount = rows.filter((r) => {
      const w = toNum(r.wait_time_min);
      return Number.isFinite(w) && (w >= 180 || w < 0);
    }).length;
    if (!waits.length) {
      return { count: rows.length, mean: "-", median: "-", std: "-", min: "-", q1: "-", q3: "-", max: "-", missingCount, outlierCount };
    }
    const n = waits.length;
    const sum = waits.reduce((a, b) => a + b, 0);
    const meanVal = sum / n;
    const variance = waits.reduce((acc, w) => acc + Math.pow(w - meanVal, 2), 0) / n;
    const stdVal = Math.sqrt(variance);
    const sorted = [...waits].sort((a, b) => a - b);
    return {
      count: rows.length,
      meanVal,
      stdVal,
      minVal: sorted[0],
      maxVal: sorted[sorted.length - 1],
      mean: meanVal.toFixed(1),
      median: quantile(sorted, 0.5).toFixed(1),
      q1: quantile(sorted, 0.25).toFixed(1),
      q3: quantile(sorted, 0.75).toFixed(1),
      std: stdVal.toFixed(1),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      missingCount,
      outlierCount
    };
  }

  function ensureExtraUI() {
    const toolbar = $(".toolbar");
    if (toolbar && !$("#btn-checklist")) {
      const extraBtns = [
        { id: "btn-checklist", label: "📋 p.74 データチェックリスト", cls: "secondary" },
        { id: "btn-charts", label: "📊 p.78-81 ヒストグラム・箱ひげ・クロス集計", cls: "secondary" },
        { id: "btn-preprocess", label: "⚙️ p.86-90 標準化・偏差値・One-Hot変換", cls: "secondary" }
      ];
      extraBtns.forEach((b) => {
        const btn = document.createElement("button");
        btn.id = b.id;
        btn.type = "button";
        btn.className = b.cls;
        btn.textContent = b.label;
        toolbar.appendChild(btn);
      });
    }
    if (!$("#metrics-bar")) {
      const mb = document.createElement("div");
      mb.id = "metrics-bar";
      mb.className = "metrics-bar";
      const sheet = $(".sheet");
      sheet.parentNode.insertBefore(mb, sheet);
    }
    if (!$("#analysis-drawer")) {
      const ad = document.createElement("div");
      ad.id = "analysis-drawer";
      ad.className = "analysis-drawer";
      ad.style.display = "none";
      const sheet = $(".sheet");
      sheet.parentNode.insertBefore(ad, sheet);
    }
    if (!$("#pagination-bar")) {
      const pb = document.createElement("div");
      pb.id = "pagination-bar";
      pb.className = "pagination-bar";
      const sheet = $(".sheet");
      sheet.parentNode.insertBefore(pb, sheet.nextSibling);
    }
  }

  function updateMetrics(stats, modeLabel) {
    ensureExtraUI();
    const mb = $("#metrics-bar");
    mb.innerHTML = `
      <div class="metric-item"><span>対象件数</span><strong>${stats.count.toLocaleString()} 件</strong></div>
      <div class="metric-item"><span>平均値 (p.83)</span><strong>${stats.mean} 分</strong></div>
      <div class="metric-item"><span>中央値 (p.83)</span><strong>${stats.median} 分</strong></div>
      <div class="metric-item"><span>標準偏差 (p.84)</span><strong>${stats.std} 分</strong></div>
      <div class="metric-item"><span>四分位 Q1 / Q3 (p.80)</span><strong>${stats.q1} / ${stats.q3} 分</strong></div>
      <div class="metric-item"><span>欠損 / 異常値(≥180分)</span><strong>${stats.missingCount}件 / ${stats.outlierCount}件</strong></div>
    `;
    if ($("#status")) {
      $("#status").textContent = `【${modeLabel}】 全 ${stats.count.toLocaleString()} 件 | 平均: ${stats.mean}分 / 中央値: ${stats.median}分 / 標準偏差: ${stats.std}分`;
    }
  }

  function colLetter(idx) {
    let s = "";
    let n = idx;
    while (n >= 0) {
      s = String.fromCharCode((n % 26) + 65) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  }

  function renderTable(modeLabel = "標準表示") {
    const tbl = $("#tbl");
    if (!tbl) return;

    const stats = calcStats(viewRows);
    updateMetrics(stats, modeLabel);

    const totalPages = Math.max(1, Math.ceil(viewRows.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    const pageRows = viewRows.slice(startIdx, startIdx + PAGE_SIZE);

    const theadHtml = `<thead><tr><th>#</th>${headers
      .map((h, i) => {
        const arrow = sortKey === h ? (sortDir === 1 ? " ▲" : " ▼") : "";
        const label = HEADER_LABELS[h] || h;
        return `<th data-col="${h}" title="${h}">${colLetter(i)}: ${label}${arrow}</th>`;
      })
      .join("")}</tr></thead>`;

    const tbodyHtml = `<tbody>${pageRows
      .map((row, rIdx) => {
        const w = toNum(row.wait_time_min);
        const isOutlier = Number.isFinite(w) && (w >= 180 || w < 0);
        const trClass = isOutlier ? "outlier" : "";
        const cellsHtml = headers
          .map((h, cIdx) => {
            const val = row[h];
            const isMissing = val === "";
            const tdClass = isMissing ? "missing" : "";
            const displayVal = isMissing ? "欠損(NULL)" : val;
            const addr = `${colLetter(cIdx)}${startIdx + rIdx + 2}`;
            return `<td class="${tdClass}" data-addr="${addr}" data-col="${h}" data-val="${String(val).replace(/"/g, "&quot;")}">${displayVal}</td>`;
          })
          .join("");
        return `<tr class="${trClass}"><td class="row-num">${startIdx + rIdx + 1}</td>${cellsHtml}</tr>`;
      })
      .join("")}</tbody>`;

    tbl.innerHTML = theadHtml + tbodyHtml;

    tbl.querySelectorAll("th[data-col]").forEach((th) => {
      th.onclick = () => {
        const col = th.dataset.col;
        if (sortKey === col) sortDir *= -1;
        else {
          sortKey = col;
          sortDir = 1;
        }
        viewRows.sort((a, b) => {
          let va = a[col], vb = b[col];
          const na = toNum(va), nb = toNum(vb);
          if (Number.isFinite(na) && Number.isFinite(nb)) {
            return (na - nb) * sortDir;
          }
          return String(va).localeCompare(String(vb), "ja") * sortDir;
        });
        currentPage = 1;
        renderTable(`ソート: ${HEADER_LABELS[col] || col} (${sortDir === 1 ? "昇順" : "降順"})`);
      };
    });

    tbl.querySelectorAll("td[data-addr]").forEach((td) => {
      td.onclick = () => {
        tbl.querySelectorAll("td.selected-cell").forEach((el) => el.classList.remove("selected-cell"));
        td.classList.add("selected-cell");
        if ($("#cell")) $("#cell").textContent = td.dataset.addr;
        if ($("#fx")) {
          const colName = HEADER_LABELS[td.dataset.col] || td.dataset.col;
          const rawVal = td.dataset.val;
          if (td.dataset.col === "wait_time_min" && Number.isFinite(toNum(rawVal)) && stats.stdVal > 0) {
            const z = ((toNum(rawVal) - stats.meanVal) / stats.stdVal).toFixed(2);
            const tScore = (50 + 10 * ((toNum(rawVal) - stats.meanVal) / stats.stdVal)).toFixed(1);
            $("#fx").value = `${colName}: ${rawVal}分 | 標準化zスコア(p.90)= ${z} | 偏差値(p.86)= ${tScore}`;
          } else {
            $("#fx").value = `${colName}: ${rawVal === "" ? "(空白/欠損値)" : rawVal}`;
          }
        }
      };
    });

    const pb = $("#pagination-bar");
    if (pb) {
      pb.innerHTML = `
        <div>表示中: <strong>${viewRows.length ? startIdx + 1 : 0} 〜 ${Math.min(startIdx + PAGE_SIZE, viewRows.length)} 件</strong> / 全 ${viewRows.length.toLocaleString()} 件（高速描画のため ${PAGE_SIZE} 件ずつ表示）</div>
        <div>
          <button type="button" class="secondary" id="pg-prev" ${currentPage <= 1 ? "disabled" : ""}>◀ 前の100件</button>
          <span style="margin:0 8px;font-weight:700;">ページ ${currentPage} / ${totalPages}</span>
          <button type="button" class="secondary" id="pg-next" ${currentPage >= totalPages ? "disabled" : ""}>次の100件 ▶</button>
        </div>
      `;
      const prevBtn = $("#pg-prev");
      const nextBtn = $("#pg-next");
      if (prevBtn) prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(modeLabel); $(".sheet").scrollTop = 0; } };
      if (nextBtn) nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderTable(modeLabel); $(".sheet").scrollTop = 0; } };
    }
  }

  // Textbook p.74 Data Checklist View
  function showChecklistDrawer() {
    const ad = $("#analysis-drawer");
    if (!ad) return;
    const stats = calcStats(viewRows);
    const dates = viewRows.map((r) => r.date).filter(Boolean).sort();
    const minDate = dates[0] || "-";
    const maxDate = dates[dates.length - 1] || "-";
    const missingByCol = headers.map((h) => {
      const cnt = viewRows.filter((r) => r[h] === "").length;
      const pct = viewRows.length ? ((cnt / viewRows.length) * 100).toFixed(1) : "0.0";
      return `${HEADER_LABELS[h] || h}: ${cnt}件 (${pct}%)`;
    });

    ad.style.display = "block";
    ad.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>📋 テキスト第4章 p.74「データチェックリスト」自動診断結果</h3>
        <button type="button" class="secondary" onclick="document.getElementById('analysis-drawer').style.display='none'">閉じる ✕</button>
      </div>
      <div class="grid-3" style="margin-top:10px;">
        <div class="dilite-box">
          <h3>① 期間・件数の充足性</h3>
          <p style="margin:4px 0;font-size:13px;">レコード件数: <strong>${stats.count.toLocaleString()} 件</strong><br>データ期間: <strong>${minDate} 〜 ${maxDate}</strong></p>
        </div>
        <div class="dilite-box">
          <h3>② 異常値・外れ値の有無 (p.91)</h3>
          <p style="margin:4px 0;font-size:13px;">待ち時間180分以上または負値: <strong style="color:var(--bad);">${stats.outlierCount} 件</strong><br>最大値: <strong>${stats.max} 分</strong> / 最小値: <strong>${stats.min} 分</strong></p>
        </div>
        <div class="dilite-box">
          <h3>③ カラム別の欠損数・欠損率 (p.74)</h3>
          <p style="margin:4px 0;font-size:12.5px;">${missingByCol.join(" / ")}</p>
        </div>
      </div>
    `;
  }

  // Textbook p.78-81 Charts: Histogram, Cross-Tab, Quartile Box Summary & Correlation
  function showChartsDrawer(binWidth = 20) {
    const ad = $("#analysis-drawer");
    if (!ad) return;
    const waits = viewRows.map((r) => toNum(r.wait_time_min)).filter((w) => Number.isFinite(w) && w >= 0 && w <= 240);
    const maxBin = 160;
    const bins = [];
    for (let b = 0; b < maxBin; b += binWidth) {
      const cnt = waits.filter((w) => w >= b && w < b + binWidth).length;
      bins.push({ label: `${b}〜${b + binWidth - 1}分`, cnt });
    }
    const overCnt = waits.filter((w) => w >= maxBin).length;
    bins.push({ label: `${maxBin}分以上`, cnt: overCnt });
    const maxCnt = Math.max(1, ...bins.map((b) => b.cnt));

    // Cross-tab weather x category (p.79)
    const weathers = ["sunny", "cloudy", "rainy"];
    const cats = [...new Set(viewRows.map((r) => r.category).filter(Boolean))];
    const crossRowsHtml = weathers
      .map((w) => {
        const cells = cats
          .map((c) => {
            const sub = viewRows.filter((r) => r.weather === w && r.category === c).map((r) => toNum(r.wait_time_min)).filter(Number.isFinite);
            const avg = sub.length ? (sub.reduce((a, b) => a + b, 0) / sub.length).toFixed(1) + `分 (${sub.length}件)` : "-";
            return `<td>${avg}</td>`;
          })
          .join("");
        return `<tr><th>${w}</th>${cells}</tr>`;
      })
      .join("");

    // Correlation between park_visitors and wait_time_min (p.81)
    const pairs = viewRows
      .map((r) => [toNum(r.park_visitors), toNum(r.wait_time_min)])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && y >= 0 && y < 180);
    let corrStr = "-";
    if (pairs.length > 2) {
      const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
      const my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
      let num = 0, dx2 = 0, dy2 = 0;
      pairs.forEach(([x, y]) => {
        num += (x - mx) * (y - my);
        dx2 += (x - mx) ** 2;
        dy2 += (y - my) ** 2;
      });
      corrStr = (num / Math.sqrt(dx2 * dy2)).toFixed(3);
    }

    ad.style.display = "block";
    ad.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>📊 テキスト第4章 p.78-81「データ理解（ヒストグラム・クロス集計表・相関係数）」</h3>
        <div>
          <button type="button" class="secondary" id="bin-10">ビン幅: 10分</button>
          <button type="button" class="secondary" id="bin-20">ビン幅: 20分</button>
          <button type="button" class="secondary" id="bin-30">ビン幅: 30分</button>
          <button type="button" class="secondary" onclick="document.getElementById('analysis-drawer').style.display='none'">閉じる ✕</button>
        </div>
      </div>
      <div class="grid" style="margin-top:12px;">
        <div>
          <h4 style="margin:0 0 8px;color:var(--navy);">ヒストグラム（p.78：区間幅 ${binWidth}分 ごとの度数分布）</h4>
          ${bins
            .map(
              (b) => `
            <div class="hist-row">
              <span>${b.label}</span>
              <div class="hist-bar-bg"><div class="hist-bar-fill" style="width:${((b.cnt / maxCnt) * 100).toFixed(1)}%"></div></div>
              <strong>${b.cnt} 件</strong>
            </div>`
            )
            .join("")}
        </div>
        <div>
          <h4 style="margin:0 0 8px;color:var(--navy);">クロス集計表（p.79：天気 × エリア分類別の平均待ち時間）</h4>
          <table>
            <thead><tr><th>天気 \ 分類</th>${cats.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
            <tbody>${crossRowsHtml}</tbody>
          </table>
          <p style="margin-top:12px;font-size:13px;background:var(--sky);padding:10px;border-radius:8px;">
            <strong>📈 散布図・相関分析 (p.81)：</strong> 「来園者数 (park_visitors)」と「待ち時間 (wait_time_min)」の相関係数 <code>r = ${corrStr}</code>
          </p>
        </div>
      </div>
    `;
    if ($("#bin-10")) $("#bin-10").onclick = () => showChartsDrawer(10);
    if ($("#bin-20")) $("#bin-20").onclick = () => showChartsDrawer(20);
    if ($("#bin-30")) $("#bin-30").onclick = () => showChartsDrawer(30);
  }

  // Textbook p.86-90 Preprocessing Preview (One-Hot, Binning, Standardization, Normalization, T-score)
  function showPreprocessDrawer() {
    const ad = $("#analysis-drawer");
    if (!ad) return;
    const stats = calcStats(viewRows);
    const sample = viewRows.filter((r) => Number.isFinite(toNum(r.wait_time_min))).slice(0, 5);
    const range = Math.max(1, stats.maxVal - stats.minVal);

    const rowsHtml = sample
      .map((r) => {
        const w = toNum(r.wait_time_min);
        const z = stats.stdVal > 0 ? ((w - stats.meanVal) / stats.stdVal).toFixed(2) : "0.00";
        const norm = ((w - stats.minVal) / range).toFixed(3);
        const dev = stats.stdVal > 0 ? (50 + 10 * ((w - stats.meanVal) / stats.stdVal)).toFixed(1) : "50.0";
        const disc = w < 30 ? "短(0-29分)" : w < 60 ? "中(30-59分)" : "長(60分〜)";
        return `
          <tr>
            <td>${r.date} (${r.attraction})</td>
            <td><strong>${w} 分</strong></td>
            <td>${z}</td>
            <td>${norm}</td>
            <td>${dev}</td>
            <td>${disc}</td>
            <td>${r.weather === "sunny" ? 1 : 0} / ${r.weather === "cloudy" ? 1 : 0} / ${r.weather === "rainy" ? 1 : 0}</td>
          </tr>`;
      })
      .join("");

    ad.style.display = "block";
    ad.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>⚙️ テキスト第4章 p.86-90「データ加工（標準化・正規化・偏差値・離散化・One-Hotエンコーディング）」変換プレビュー</h3>
        <button type="button" class="secondary" onclick="document.getElementById('analysis-drawer').style.display='none'">閉じる ✕</button>
      </div>
      <p style="margin:6px 0 10px;font-size:13px;color:var(--muted);">現在のデータ先頭5件に対して、テキストp.86〜90で学ぶ変換処理を適用した結果の比較表です（表内のセルをクリックしても数式バーにzスコアと偏差値が表示されます）。</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>対象レコード</th>
              <th>元の待ち時間</th>
              <th>標準化 z変換 (p.90)<br><small>平均0, 標準偏差1</small></th>
              <th>正規化 Min-Max (p.90)<br><small>0〜1の範囲</small></th>
              <th>偏差値 (p.86)<br><small>平均50, 標準偏差10</small></th>
              <th>量的データの離散化 (p.89)<br><small>3区分カテゴリ化</small></th>
              <th>One-Hot化 (p.88)<br><small>晴 / 曇 / 雨</small></th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }

  async function loadDataset(type) {
    currentDataset = type;
    const url = type === "cleaned" ? "data/theme_park_wait_times_clean.csv" : "data/theme_park_wait_times_raw.csv";
    if ($("#status")) $("#status").textContent = "データを読み込んでいます...";
    try {
      if (!cache[type]) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        cache[type] = parseCSV(text);
      }
      headers = cache[type].cols;
      rawRows = cache[type].rows;
      viewRows = [...rawRows];
      sortKey = null;
      currentPage = 1;
      setActiveButton(type === "cleaned" ? "btn-cleaned" : "btn-raw");
      const label = type === "cleaned" ? "theme_park_cleaned (整形済みデータ)" : "theme_park_raw (生データ)";
      if ($("#fx")) $("#fx").value = `${label} を読み込みました（全 ${rawRows.length.toLocaleString()} 行）。任意のセルをクリックすると詳細・偏差値を表示します。`;
      renderTable(label);
      bindExtraButtons();
    } catch (err) {
      if ($("#status")) $("#status").textContent = "データの読み込みに失敗しました: " + err.message;
    }
  }

  function setActiveButton(id) {
    document.querySelectorAll(".toolbar button").forEach((b) => {
      b.classList.toggle("active", b.id === id);
    });
  }

  function bindExtraButtons() {
    if ($("#btn-checklist")) $("#btn-checklist").onclick = showChecklistDrawer;
    if ($("#btn-charts")) $("#btn-charts").onclick = () => showChartsDrawer(20);
    if ($("#btn-preprocess")) $("#btn-preprocess").onclick = showPreprocessDrawer;
  }

  if ($("#btn-raw")) $("#btn-raw").onclick = () => loadDataset("raw");
  if ($("#btn-cleaned")) $("#btn-cleaned").onclick = () => loadDataset("cleaned");
  if ($("#btn-q3")) {
    $("#btn-q3").onclick = () => {
      setActiveButton("btn-q3");
      const hasFantasy = rawRows.some((r) => /fantasy|ファンタジー/i.test(r.category) || /fantasy|ファンタジー/i.test(r.attraction));
      if (hasFantasy) {
        viewRows = rawRows.filter((r) => /fantasy|ファンタジー/i.test(r.category) || /fantasy|ファンタジー/i.test(r.attraction));
      } else {
        viewRows = rawRows.filter((r) => r.category === "family" || r.category === "kids");
      }
      currentPage = 1;
      const stats = calcStats(viewRows);
      if ($("#fx")) $("#fx").value = `=AVERAGEIF(category, "ファミリー/ファンタジー系", wait_time_min) => 平均 ${stats.mean} 分 / 中央値 ${stats.median} 分`;
      renderTable("問3: フィルタ (ファンタジー/ファミリーエリア)");
    };
  }
  if ($("#btn-q4")) {
    $("#btn-q4").onclick = () => {
      setActiveButton("btn-q4");
      viewRows = [...rawRows].sort((a, b) => {
        const wa = toNum(a.wait_time_min);
        const wb = toNum(b.wait_time_min);
        if (!Number.isFinite(wa) && !Number.isFinite(wb)) return 0;
        if (!Number.isFinite(wa)) return 1;
        if (!Number.isFinite(wb)) return -1;
        return wb - wa;
      });
      sortKey = "wait_time_min";
      sortDir = -1;
      currentPage = 1;
      const stats = calcStats(viewRows);
      if ($("#fx")) $("#fx").value = `=MAX(wait_time_min) => 最大 ${stats.max} 分 （赤色セルは180分以上の外れ値・異常値 p.91）`;
      renderTable("問4: 待機時間（降順ソート・外れ値確認）");
    };
  }
  if ($("#btn-q5")) {
    $("#btn-q5").onclick = () => {
      setActiveButton("btn-q5");
      const beforeStats = calcStats(rawRows);
      viewRows = rawRows.filter((r) => {
        const w = toNum(r.wait_time_min);
        return Number.isFinite(w) && w >= 0 && w < 180;
      });
      currentPage = 1;
      const afterStats = calcStats(viewRows);
      if ($("#fx")) {
        $("#fx").value = `異常値・欠損除外(p.91): 平均 ${beforeStats.mean}分 → ${afterStats.mean}分 / 中央値 ${beforeStats.median}分 → ${afterStats.median}分 (${rawRows.length - viewRows.length}件除外)`;
      }
      renderTable("問5: 異常値(≥180分・負値)および欠損値を除外");
    };
  }
  if ($("#btn-reset")) {
    $("#btn-reset").onclick = () => {
      setActiveButton(currentDataset === "cleaned" ? "btn-cleaned" : "btn-raw");
      viewRows = [...rawRows];
      sortKey = null;
      currentPage = 1;
      if ($("#fx")) $("#fx").value = "フィルタ・ソートをリセットしました";
      renderTable("初期表示");
    };
  }

  loadDataset("raw");
})();
