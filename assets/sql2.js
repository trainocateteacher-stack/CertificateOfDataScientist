(function () {
  const $ = (s) => document.querySelector(s);
  let themeParkData = [];
  const DEFAULT_SQL = "SELECT area, AVG(wait_time_min) FROM theme_park GROUP BY area";

  // Textbook p.153-157 students & club sample tables
  const INITIAL_STUDENTS = [
    { student_id: 101, l_name: "佐藤", f_name: "翔太", birth_date: "2005-04-12", pref: "東京都", height: 175, club_id: 10 },
    { student_id: 102, l_name: "鈴木", f_name: "陽菜", birth_date: "2005-08-23", pref: "神奈川県", height: 162, club_id: 20 },
    { student_id: 103, l_name: "高橋", f_name: "健太", birth_date: "2005-11-05", pref: "埼玉県", height: 182, club_id: 10 },
    { student_id: 104, l_name: "田中", f_name: "美咲", birth_date: "2006-01-19", pref: "千葉県", height: 158, club_id: 30 },
    { student_id: 105, l_name: "伊藤", f_name: "大輔", birth_date: "2005-06-30", pref: "東京都", height: 185, club_id: 40 },
    { student_id: 106, l_name: "渡辺", f_name: "結衣", birth_date: "2005-12-14", pref: "神奈川県", height: 165, club_id: 20 }
  ];

  const INITIAL_CLUB = [
    { club_id: 10, club_name: "Basketball" },
    { club_id: 20, club_name: "Tennis" },
    { club_id: 30, club_name: "BrassBand" },
    { club_id: 40, club_name: "Baseball" }
  ];

  let studentsData = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
  let clubData = JSON.parse(JSON.stringify(INITIAL_CLUB));

  const SCHEMA = [
    { name: "theme_park.area", desc: "エリア/分類 (categoryと同義)" },
    { name: "theme_park.attraction", desc: "アトラクション名" },
    { name: "theme_park.weather", desc: "天気 (sunny/cloudy/rainy)" },
    { name: "theme_park.wait_time_min", desc: "待ち時間・分 (数値)" },
    { name: "theme_park.park_visitors", desc: "来園者数 (数値)" },
    { name: "theme_park.satisfaction_1to5", desc: "満足度 (1.0〜5.0)" },
    { name: "students (p.154)", desc: "student_id, l_name, f_name, height, pref, club_id" },
    { name: "club (p.157)", desc: "club_id, club_name" }
  ];

  const PRESETS = [
    {
      label: "演習1: エリア別の平均待ち時間",
      sql: "SELECT area, AVG(wait_time_min), COUNT(*) FROM theme_park GROUP BY area"
    },
    {
      label: "演習2: 雨の日のアトラクション別平均",
      sql: "SELECT attraction, AVG(wait_time_min) FROM theme_park WHERE weather = 'rainy' GROUP BY attraction ORDER BY AVG(wait_time_min) DESC"
    },
    {
      label: "p.154 SELECT+WHERE (student_id=101)",
      sql: "SELECT student_id, l_name, f_name, birth_date, pref, club_id FROM students WHERE student_id = 101;"
    },
    {
      label: "p.155 WHERE比較 (height >= 180)",
      sql: "SELECT student_id, l_name, f_name, height FROM students WHERE height >= 180;"
    },
    {
      label: "p.156 ORDER BY整列 (height順)",
      sql: "SELECT student_id, l_name, f_name, height FROM students ORDER BY height;"
    },
    {
      label: "p.157 INSERT追加 (clubへ50:Football)",
      sql: "INSERT INTO club (club_id, club_name) VALUES (50, 'Football');"
    },
    {
      label: "p.170 UPDATE更新 (student_id=101の身長変更)",
      sql: "UPDATE students SET height = 178 WHERE student_id = 101;"
    }
  ];

  function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    const cols = lines.shift().split(",");
    return lines.map((line) => {
      const cells = [];
      let cur = "", q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') q = !q;
        else if (c === "," && !q) {
          cells.push(cur);
          cur = "";
        } else cur += c;
      }
      cells.push(cur);
      const obj = {};
      cols.forEach((k, i) => (obj[k] = cells[i] ?? ""));
      if (!obj.area && obj.category) obj.area = obj.category;
      return obj;
    });
  }

  function toNum(v) {
    if (v === "" || v === null || v === undefined) return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function getTableData(tableName) {
    const t = tableName.toLowerCase();
    if (t === "theme_park") return themeParkData;
    if (t === "students") return studentsData;
    if (t === "club") return clubData;
    throw new Error(`テーブル '${tableName}' は存在しません（theme_park, students, club が利用可能です）`);
  }

  function evalWhere(rows, whereClause) {
    if (!whereClause) return rows;
    const conds = whereClause.split(/\s+AND\s+/i);
    return rows.filter((row) =>
      conds.every((cond) => {
        const m = cond.trim().match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
        if (!m) return true;
        const col = m[1];
        const op = m[2];
        let valRaw = m[3].trim().replace(/^['"]|['"]$/g, "");
        const rowVal = row[col];
        const nRow = toNum(rowVal);
        const nVal = toNum(valRaw);
        const bothNum = Number.isFinite(nRow) && Number.isFinite(nVal);
        const a = bothNum ? nRow : String(rowVal);
        const b = bothNum ? nVal : String(valRaw);
        if (op === "=") return a == b;
        if (op === "!=" || op === "<>") return a != b;
        if (op === ">=") return a >= b;
        if (op === "<=") return a <= b;
        if (op === ">") return a > b;
        if (op === "<") return a < b;
        return true;
      })
    );
  }

  function computeAgg(func, col, groupRows) {
    const fn = func.toUpperCase();
    if (fn === "COUNT") {
      if (col === "*") return groupRows.length;
      return groupRows.filter((r) => r[col] !== "" && r[col] !== undefined).length;
    }
    const nums = groupRows.map((r) => toNum(r[col])).filter(Number.isFinite);
    if (!nums.length) return null;
    if (fn === "AVG") return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
    if (fn === "SUM") return Number(nums.reduce((a, b) => a + b, 0).toFixed(2));
    if (fn === "MAX") return Math.max(...nums);
    if (fn === "MIN") return Math.min(...nums);
    return null;
  }

  function executeSQL(queryText) {
    const q = queryText.replace(/;\s*$/, "").replace(/\s+/g, " ").trim();

    // 1. Check INSERT INTO (Textbook p.157)
    const insertMatch = q.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i);
    if (insertMatch) {
      const tblName = insertMatch[1];
      const cols = insertMatch[2].split(",").map((c) => c.trim());
      const vals = insertMatch[3].split(",").map((v) => v.trim().replace(/^['"]|['"]$/g, ""));
      const target = getTableData(tblName);
      const newObj = {};
      cols.forEach((c, i) => {
        const n = toNum(vals[i]);
        newObj[c] = Number.isFinite(n) ? n : vals[i];
      });
      target.push(newObj);
      return {
        columns: Object.keys(target[0] || newObj),
        rows: target,
        totalCount: target.length,
        message: `INSERT成功: ${tblName} テーブルに1件追加しました（p.157 データ追加）`
      };
    }

    // 2. Check UPDATE (Textbook p.170)
    const updateMatch = q.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([a-zA-Z0-9_]+)\s*=\s*(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (updateMatch) {
      const tblName = updateMatch[1];
      const setCol = updateMatch[2].trim();
      const setValRaw = updateMatch[3].trim().replace(/^['"]|['"]$/g, "");
      const wherePart = updateMatch[4] ? updateMatch[4].trim() : null;
      const target = getTableData(tblName);
      const matched = evalWhere(target, wherePart);
      matched.forEach((r) => {
        const n = toNum(setValRaw);
        r[setCol] = Number.isFinite(n) ? n : setValRaw;
      });
      return {
        columns: Object.keys(target[0] || {}),
        rows: target.slice(0, 100),
        totalCount: target.length,
        message: `UPDATE成功: ${tblName} テーブルの ${matched.length} 件を更新しました（p.170 データ更新）`
      };
    }

    // 3. Check DELETE
    const deleteMatch = q.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/i);
    if (deleteMatch) {
      const tblName = deleteMatch[1];
      const wherePart = deleteMatch[2] ? deleteMatch[2].trim() : null;
      const target = getTableData(tblName);
      const toRemove = new Set(evalWhere(target, wherePart));
      const kept = target.filter((r) => !toRemove.has(r));
      if (tblName.toLowerCase() === "students") studentsData = kept;
      else if (tblName.toLowerCase() === "club") clubData = kept;
      return {
        columns: Object.keys(kept[0] || {}),
        rows: kept.slice(0, 100),
        totalCount: kept.length,
        message: `DELETE成功: ${toRemove.size} 件を削除しました`
      };
    }

    // 4. SELECT
    const selectMatch = q.match(/^SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (!selectMatch) {
      throw new Error("構文エラー: SELECT 列名 FROM テーブル名(theme_park / students / club) [WHERE ...] [GROUP BY ...] [ORDER BY ...] の形式で入力してください。");
    }

    const selectPart = selectMatch[1].trim();
    const tableName = selectMatch[2].trim();
    const wherePart = selectMatch[3] ? selectMatch[3].trim() : null;
    const groupPart = selectMatch[4] ? selectMatch[4].trim() : null;
    const orderPart = selectMatch[5] ? selectMatch[5].trim() : null;
    const limitNum = selectMatch[6] ? Number(selectMatch[6]) : 100;

    const sourceRows = getTableData(tableName);
    const filtered = evalWhere(sourceRows, wherePart);

    const selectExprs = selectPart.split(",").map((s) => s.trim());
    const hasAgg = selectExprs.some((expr) => /^(AVG|SUM|COUNT|MAX|MIN)\s*\(/i.test(expr));

    let resultRows = [];
    let columns = [];

    if (groupPart || hasAgg) {
      const groupCols = groupPart ? groupPart.split(",").map((s) => s.trim()) : [];
      const groups = new Map();
      filtered.forEach((r) => {
        const key = groupCols.map((c) => r[c] ?? "NULL").join("||");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      });

      let gIdx = 0;
      groups.forEach((gRows) => {
        const out = { __groupColor: `g${gIdx % 4}` };
        gIdx++;
        selectExprs.forEach((expr) => {
          const aliasMatch = expr.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
          const rawExpr = aliasMatch ? aliasMatch[1].trim() : expr;
          const label = aliasMatch ? aliasMatch[2].trim() : expr;
          if (!columns.includes(label)) columns.push(label);

          const aggMatch = rawExpr.match(/^(AVG|SUM|COUNT|MAX|MIN)\s*\(\s*([a-zA-Z0-9_*]+)\s*\)$/i);
          if (aggMatch) {
            out[label] = computeAgg(aggMatch[1], aggMatch[2], gRows);
          } else {
            out[label] = gRows[0] ? gRows[0][rawExpr] : "";
          }
        });
        resultRows.push(out);
      });
    } else {
      if (selectPart === "*") {
        columns = Object.keys(sourceRows[0] || {});
      } else {
        columns = selectExprs.map((e) => {
          const m = e.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
          return m ? m[2].trim() : e;
        });
      }
      resultRows = filtered.map((r) => {
        const out = {};
        if (selectPart === "*") {
          columns.forEach((c) => (out[c] = r[c]));
        } else {
          selectExprs.forEach((e) => {
            const m = e.match(/^(.+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
            const src = m ? m[1].trim() : e;
            const dst = m ? m[2].trim() : e;
            out[dst] = r[src];
          });
        }
        return out;
      });
    }

    if (orderPart) {
      const om = orderPart.match(/^(.+?)(?:\s+(ASC|DESC))?$/i);
      if (om) {
        const col = om[1].trim();
        const dir = om[2] && om[2].toUpperCase() === "DESC" ? -1 : 1;
        resultRows.sort((a, b) => {
          const va = a[col], vb = b[col];
          const na = toNum(va), nb = toNum(vb);
          if (Number.isFinite(na) && Number.isFinite(nb)) return (na - nb) * dir;
          return String(va ?? "").localeCompare(String(vb ?? ""), "ja") * dir;
        });
      }
    }

    const totalCount = resultRows.length;
    return {
      columns,
      rows: resultRows.slice(0, limitNum),
      totalCount,
      message: `${tableName} テーブル抽出結果`
    };
  }

  function renderResult(res, stageTitle) {
    if ($("#stage")) {
      const msg = res.message || stageTitle;
      $("#stage").textContent = `${msg} （該当 ${res.totalCount.toLocaleString()} 件中 ${res.rows.length.toLocaleString()} 件表示）`;
    }
    const tbl = $("#table");
    if (!tbl) return;
    if (!res.columns.length) {
      tbl.innerHTML = "<tbody><tr><td>結果がありません</td></tr></tbody>";
      return;
    }
    const thead = `<thead><tr>${res.columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${res.rows
      .map((r) => {
        const cls = r.__groupColor || "";
        return `<tr class="${cls}">${res.columns
          .map((c) => `<td>${r[c] === null || r[c] === "" || r[c] === undefined ? "NULL" : r[c]}</td>`)
          .join("")}</tr>`;
      })
      .join("")}</tbody>`;
    tbl.innerHTML = thead + tbody;
  }

  function initUI() {
    const fieldsEl = $("#fields");
    if (fieldsEl) {
      fieldsEl.innerHTML = SCHEMA.map(
        (col) => `
        <div class="field" data-col="${col.name.split(" ")[0].replace(/^theme_park\./, "")}" title="クリックしてSQLに挿入">
          <strong>${col.name}</strong>
          <small>${col.desc}</small>
        </div>`
      ).join("");

      fieldsEl.querySelectorAll(".field").forEach((el) => {
        el.onclick = () => {
          const ta = $("#sql");
          if (!ta) return;
          const start = ta.selectionStart || ta.value.length;
          const end = ta.selectionEnd || ta.value.length;
          const col = el.dataset.col;
          ta.value = ta.value.slice(0, start) + col + ta.value.slice(end);
          ta.focus();
        };
      });
    }

    const ta = $("#sql");
    if (ta && !document.querySelector(".sql-presets")) {
      const presetWrap = document.createElement("div");
      presetWrap.className = "sql-presets";
      presetWrap.innerHTML = PRESETS.map(
        (p, idx) => `<button type="button" data-idx="${idx}">${p.label}</button>`
      ).join("");
      ta.parentNode.insertBefore(presetWrap, ta);
      presetWrap.querySelectorAll("button").forEach((btn) => {
        btn.onclick = () => {
          ta.value = PRESETS[Number(btn.dataset.idx)].sql;
          runQuery();
        };
      });
    }

    const tbl = $("#table");
    if (tbl && !tbl.parentElement.classList.contains("table-wrap")) {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    }
  }

  function runQuery() {
    const ta = $("#sql");
    if (!ta) return;
    try {
      const res = executeSQL(ta.value);
      renderResult(res, "SQL実行結果");
    } catch (err) {
      if ($("#stage")) {
        $("#stage").textContent = "⚠️ " + err.message;
      }
    }
  }

  if ($("#run")) $("#run").onclick = runQuery;
  if ($("#reset")) {
    $("#reset").onclick = () => {
      studentsData = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
      clubData = JSON.parse(JSON.stringify(INITIAL_CLUB));
      if ($("#sql")) $("#sql").value = DEFAULT_SQL;
      const res = executeSQL("SELECT * FROM theme_park LIMIT 50");
      renderResult(res, "theme_park 元データ (先頭50件プレビュー)");
    };
  }

  async function init() {
    initUI();
    try {
      const r = await fetch("data/theme_park_wait_times_raw.csv");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      themeParkData = parseCSV(await r.text());
      runQuery();
    } catch (err) {
      if ($("#stage")) $("#stage").textContent = "データの読み込みに失敗しました: " + err.message;
    }
  }

  init();
})();
