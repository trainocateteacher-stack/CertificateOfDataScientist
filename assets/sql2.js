/* SQL Lab：sql.js（ブラウザで動く SQLite）で、入力した SQL をそのまま実行する。部品は assets/sqldb.js。 */
(function () {
  const $ = (s) => document.querySelector(s);
  const DEFAULT_SQL = "SELECT category, AVG(wait_time_min), COUNT(*)\nFROM wait_times\nWHERE downtime_flag = 0\nGROUP BY category\nORDER BY AVG(wait_time_min) DESC;";
  const PRESETS = [
    { group: "案件の調査", label: "① 月別の満足度（2026年）", sql: "SELECT substr(date, 1, 7) AS month, ROUND(AVG(overall_sat), 2) AS avg_sat, COUNT(*) AS n\nFROM survey\nWHERE date >= '2026-04-01'\nGROUP BY month;" },
    { group: "案件の調査", label: "② 6月の回答方法別", sql: "SELECT channel, ROUND(AVG(overall_sat), 2) AS avg_sat, COUNT(*) AS n\nFROM survey\nWHERE date >= '2026-06-01'\nGROUP BY channel;" },
    { group: "案件の調査", label: "③ 月×年代の満足度", sql: "SELECT substr(date, 1, 7) AS month, age_group, ROUND(AVG(overall_sat), 2) AS avg_sat, COUNT(*) AS n\nFROM survey\nWHERE date >= '2026-04-01'\nGROUP BY month, age_group\nORDER BY age_group, month;" },
    { group: "案件の調査", label: "④ 優先パスの有無と待ち時間満足度", sql: "SELECT priority_pass, ROUND(AVG(wait_sat), 2) AS avg_wait_sat, COUNT(*) AS n\nFROM survey\nWHERE date >= '2026-05-01'\nGROUP BY priority_pass;" },
    { group: "案件の調査", label: "⑤ 公式と一般列の待ち時間（月別）", sql: "SELECT substr(date, 1, 7) AS month,\n       ROUND(AVG(wait_time_min), 1) AS official,\n       ROUND(AVG(wait_standby_min), 1) AS standby\nFROM wait_times\nWHERE downtime_flag = 0\nGROUP BY month;" },
    { group: "案件の調査", label: "⑥ 天気と満足度（JOIN・前年比較）", sql: "SELECT d.year, d.weather, ROUND(AVG(s.overall_sat), 2) AS avg_sat, COUNT(*) AS n\nFROM survey s\nJOIN daily_ops d ON s.date = d.date\nGROUP BY d.year, d.weather\nORDER BY d.year, avg_sat DESC;" },
    { group: "案件の調査", label: "⑦ 未回答（NULL）の数", sql: "SELECT channel, age_group, COUNT(*) AS n,\n       SUM(CASE WHEN overall_sat IS NULL THEN 1 ELSE 0 END) AS missing\nFROM survey\nGROUP BY channel, age_group\nORDER BY missing DESC;" },
    { group: "スライド p.153-157", label: "p.154 SELECT + WHERE", sql: "SELECT student_id, l_name, f_name, birth_date, pref, club_id\nFROM students\nWHERE student_id = 101;" },
    { group: "スライド p.153-157", label: "p.155 WHERE 比較", sql: "SELECT student_id, l_name, f_name, height\nFROM students\nWHERE height >= 180;" },
    { group: "スライド p.153-157", label: "p.156 ORDER BY", sql: "SELECT student_id, l_name, f_name, height\nFROM students\nORDER BY height;" },
    { group: "スライド p.153-157", label: "p.152 JOIN", sql: "SELECT s.student_id, s.l_name, c.club_name\nFROM students s\nJOIN club c ON s.club_id = c.club_id;" },
    { group: "スライド p.153-157", label: "p.157 INSERT", sql: "INSERT INTO club (club_id, club_name) VALUES (50, 'Football');" },
    { group: "スライド p.153-157", label: "p.157 UPDATE", sql: "UPDATE club SET club_name = 'Soccer' WHERE club_id = 50;" },
    { group: "スライド p.153-157", label: "p.157 DELETE", sql: "DELETE FROM club WHERE club_id = 50;" },
  ];

  let ctx = null; // { SQL, park, db }

  function setStage(text, isError) {
    const el = $("#stage");
    el.textContent = text;
    el.classList.toggle("sql-error", !!isError);
  }

  function renderFields() {
    const tables = ["wait_times", "survey", "daily_ops", "students", "club"];
    $("#fields").innerHTML = tables.map((t) => {
      const cols = ctx.db.exec(`PRAGMA table_info("${t}")`)[0].values.map((r) => r[1]);
      const n = ctx.db.exec(`SELECT COUNT(*) FROM "${t}"`)[0].values[0][0];
      return `<div class="field" data-col="${t}" title="クリックで SQL に挿入"><strong>${t}</strong><small>${n.toLocaleString()}行</small></div>`
        + `<div class="field-cols">${cols.map((c) => `<span class="field" data-col="${c}" title="クリックで SQL に挿入">${c}</span>`).join("")}</div>`;
    }).join("");
    $("#fields").querySelectorAll(".field").forEach((el) => {
      el.onclick = () => {
        const ta = $("#sql");
        const start = ta.selectionStart ?? ta.value.length, end = ta.selectionEnd ?? ta.value.length;
        ta.value = ta.value.slice(0, start) + el.dataset.col + ta.value.slice(end);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + el.dataset.col.length;
      };
    });
  }

  function runQuery() {
    if (!ctx) return;
    const res = ParkSQL.run(ctx.db, $("#sql").value);
    const tbl = $("#table");
    if (!res.ok) {
      setStage(`⚠️ ${res.hint}（エラー：${res.error}）`, true);
      tbl.innerHTML = "";
      return;
    }
    const last = res.results[res.results.length - 1];
    if (last) {
      const shown = Math.min(200, last.values.length);
      setStage(`✅ ${last.values.length.toLocaleString()} 行（${shown.toLocaleString()} 行を表示）`);
      tbl.innerHTML = ParkSQL.toTableHTML(last, 200);
    } else if (res.touched) {
      const after = ctx.db.exec(`SELECT * FROM "${res.touched}" LIMIT 200`)[0];
      setStage(`✅ ${res.touched} テーブルの ${res.changes} 行を変更しました。下は変更後の ${res.touched} テーブルです。`);
      tbl.innerHTML = after ? ParkSQL.toTableHTML(after, 200) : "";
      renderFields();
    } else {
      setStage("✅ 実行しました（表示する結果はありません）。");
      tbl.innerHTML = "";
    }
  }

  function initPresets() {
    const wrap = document.createElement("div");
    wrap.className = "sql-presets";
    let lastGroup = "";
    wrap.innerHTML = PRESETS.map((p, i) => {
      const head = p.group !== lastGroup ? `<span class="preset-group">${p.group}</span>` : "";
      lastGroup = p.group;
      return `${head}<button type="button" data-idx="${i}">${p.label}</button>`;
    }).join("");
    $("#sql").parentNode.insertBefore(wrap, $("#sql"));
    wrap.querySelectorAll("button").forEach((b) => {
      b.onclick = () => { $("#sql").value = PRESETS[Number(b.dataset.idx)].sql; runQuery(); };
    });
  }

  async function init() {
    $("#sql").value = DEFAULT_SQL;
    initPresets();
    $("#run").onclick = runQuery;
    $("#sql").addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runQuery(); }
    });
    $("#reset").onclick = () => {
      if (!ctx) return;
      ctx.db.close();
      ctx.db = ParkSQL.build(ctx.SQL, ctx.park);
      $("#sql").value = DEFAULT_SQL;
      renderFields();
      runQuery();
      setStage("↺ すべてのテーブルを初期状態に戻しました。" + $("#stage").textContent);
    };
    setStage("SQL エンジンとデータを読み込んでいます…");
    try {
      ctx = await ParkSQL.open();
      renderFields();
      runQuery();
    } catch (e) {
      setStage("⚠️ 読み込みに失敗しました：" + e.message + "（このページはサーバー経由で開く必要があります）", true);
    }
  }
  init();
})();
