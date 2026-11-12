/* Python ページ：グラフは Plotly.js で全員に表示し、同じグラフを作る Python コードを「実行してみる」ことができる。
   Python は assets/pyrun.js（同梱の Pyodide）で、ボタンを押したときだけ読み込む。 */
(function () {
  "use strict";
  const P = window.ParkData;
  const $ = (s) => document.querySelector(s);
  const PLOT_CFG = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["lasso2d", "select2d"] };
  const LAYOUT = { margin: { l: 55, r: 20, t: 30, b: 50 }, height: 340, template: "plotly_white", font: { family: "Noto Sans JP, sans-serif", size: 12 }, legend: { orientation: "h", y: -0.2 } };

  const CHARTS = [
    {
      id: "c1", module: "Module 6", title: "① 月×回答方法の満足度（2026年）",
      note: "6月から回答方法がアプリだけになりました。満足度が下がったのは、誰の回答でしょうか。",
      code: `import pandas as pd
import plotly.express as px

df = pd.read_csv("data/survey_clean.csv")
df = df[df["date"] >= "2026-04-01"]
df["month"] = df["date"].str[:7]

m = df.groupby(["month", "channel"], as_index=False)["overall_sat"].mean()
print(m)

fig = px.bar(m, x="month", y="overall_sat", color="channel", barmode="group",
             range_y=[1, 5], title="月×回答方法の満足度")
fig.show()`,
      draw: (t, el) => {
        const s = t.survey_clean.filter((r) => r.date >= "2026-04-01");
        const months = ["2026-04", "2026-05", "2026-06"];
        const traces = ["paper", "app"].map((ch) => ({
          type: "bar", name: ch, x: months,
          y: months.map((mm) => P.mean(s.filter((r) => r.channel === ch && r.date.startsWith(mm)).map((r) => r.overall_sat))),
        }));
        Plotly.newPlot(el, traces, { ...LAYOUT, barmode: "group", yaxis: { range: [1, 5], title: "総合満足度" } }, PLOT_CFG);
      },
    },
    {
      id: "c2", module: "Module 6", title: "② 公式発表と一般列の待ち時間（月別）",
      note: "公式発表の平均待ち時間は横ばいです。優先パスを使わない人が並ぶ「一般列」はどうでしょうか。",
      code: `import pandas as pd
import plotly.express as px

w = pd.read_csv("data/wait_times_clean.csv")
w = w[w["downtime_flag"] == 0]
w["month"] = w["date"].str[:7]

m = w.groupby("month", as_index=False)[["wait_time_min", "wait_standby_min"]].mean()
print(m.round(1))

fig = px.line(m, x="month", y=["wait_time_min", "wait_standby_min"], markers=True,
              title="公式発表（wait_time_min）と一般列（wait_standby_min）")
fig.show()`,
      draw: (t, el) => {
        const w = t.wait_times_clean.filter((r) => r.downtime_flag === 0);
        const months = ["2026-04", "2026-05", "2026-06"];
        const traces = [["wait_time_min", "公式発表"], ["wait_standby_min", "一般列"]].map(([col, name]) => ({
          type: "scatter", mode: "lines+markers", name, x: months,
          y: months.map((mm) => P.mean(w.filter((r) => r.date.startsWith(mm)).map((r) => r[col]))),
        }));
        Plotly.newPlot(el, traces, { ...LAYOUT, yaxis: { title: "平均待ち時間（分）" } }, PLOT_CFG);
      },
    },
    {
      id: "c3", module: "Module 7", title: "③ 待ち時間のヒストグラム（元データ）",
      note: "右の端に、ほかから離れた値があります。マウスを重ねて、何分の値が何件あるか確かめましょう。",
      code: `import pandas as pd
import plotly.express as px

df = pd.read_csv("data/wait_times_raw.csv")
print(df["wait_time_min"].describe())

fig = px.histogram(df, x="wait_time_min", nbins=60, title="待ち時間の分布（元データ）")
fig.show()`,
      draw: (t, el) => {
        Plotly.newPlot(el, [{ type: "histogram", x: t.wait_times_raw.map((r) => r.wait_time_min), nbinsx: 60, name: "件数" }],
          { ...LAYOUT, xaxis: { title: "wait_time_min（分）" }, yaxis: { title: "件数" } }, PLOT_CFG);
      },
    },
    {
      id: "c4", module: "Module 2", title: "④ 売店売上と平均待ち時間（日別、色＝来園者数）",
      note: "点の色は来園者数です。売店が売れる日ほど待つのは、売店のせいでしょうか。",
      code: `import pandas as pd
import plotly.express as px

d = pd.read_csv("data/daily_ops.csv")
w = pd.read_csv("data/wait_times_clean.csv")
w = w[w["downtime_flag"] == 0]

wait_by_day = w.groupby("date", as_index=False)["wait_time_min"].mean()
x = d[d["year"] == 2026].merge(wait_by_day, on="date")
print(x[["food_sales_yen_total", "wait_time_min", "park_visitors"]].corr().round(2))

fig = px.scatter(x, x="food_sales_yen_total", y="wait_time_min", color="park_visitors",
                 hover_data=["date", "weather"], title="売店売上×平均待ち時間（日別）")
fig.show()`,
      draw: (t, el) => {
        const w = t.wait_times_clean.filter((r) => r.downtime_flag === 0);
        const byDay = new Map([...P.groupBy(w, (r) => r.date)].map(([k, v]) => [k, P.mean(v.map((r) => r.wait_time_min))]));
        const d = t.daily_ops.filter((r) => r.year === 2026);
        Plotly.newPlot(el, [{
          type: "scatter", mode: "markers", x: d.map((r) => r.food_sales_yen_total), y: d.map((r) => byDay.get(r.date)),
          text: d.map((r) => `${r.date}（${r.weather}）`),
          marker: { color: d.map((r) => r.park_visitors), colorscale: "Viridis", showscale: true, colorbar: { title: "来園者数" }, size: 8 },
          hovertemplate: "%{text}<br>売上 %{x:,}円<br>待ち %{y:.1f}分<extra></extra>",
        }], { ...LAYOUT, showlegend: false, xaxis: { title: "売店売上の合計（円）" }, yaxis: { title: "平均待ち時間（分）" } }, PLOT_CFG);
      },
    },
    {
      id: "c5", module: "Module 6", title: "⑤ 天気別の満足度（2025年と2026年）",
      note: "雨の日の満足度の低さは、今年だけのことでしょうか。前年と比べましょう。",
      code: `import pandas as pd
import plotly.express as px

s = pd.read_csv("data/survey_clean.csv")
d = pd.read_csv("data/daily_ops.csv")
x = s.merge(d[["date", "year", "weather"]], on="date")

m = x.groupby(["year", "weather"], as_index=False)["overall_sat"].mean()
print(m.round(2))

fig = px.bar(m, x="weather", y="overall_sat", color=m["year"].astype(str), barmode="group",
             range_y=[1, 5], title="天気別の満足度（前年との比較）")
fig.show()`,
      draw: (t, el) => {
        const wx = new Map(t.daily_ops.map((r) => [r.date, r.weather]));
        const weathers = ["sunny", "cloudy", "rainy"];
        const traces = ["2025", "2026"].map((y) => ({
          type: "bar", name: y, x: weathers,
          y: weathers.map((wv) => P.mean(t.survey_clean.filter((r) => r.date.startsWith(y) && wx.get(r.date) === wv).map((r) => r.overall_sat))),
        }));
        Plotly.newPlot(el, traces, { ...LAYOUT, barmode: "group", yaxis: { range: [1, 5], title: "総合満足度" } }, PLOT_CFG);
      },
    },
  ];

  const FREE_CODE = `import pandas as pd
import plotly.express as px

df = pd.read_csv("data/survey_clean.csv")
print(df.columns.tolist())
print(df.head())

# 好きなグラフを作ってみましょう（例：年代別の満足度）
fig = px.histogram(df, x="overall_sat", color="age_group", barmode="group")
fig.show()`;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function cardHTML(c) {
    return `
      <section class="card py-card" id="${c.id}">
        <i>${c.module} とつながる演習</i>
        <h2>${c.title}</h2>
        <p class="py-note">${c.note}</p>
        <div class="py-grid">
          <div><div class="py-plot" id="${c.id}-plot"></div></div>
          <div>
            <div class="py-code-head"><b>同じグラフを作る Python コード（書き換えられます）</b></div>
            <textarea class="py-code" id="${c.id}-code" spellcheck="false" rows="14">${esc(c.code)}</textarea>
            <div class="py-actions">
              <button type="button" data-run="${c.id}">▶ Python で実行してみる</button>
              <button type="button" class="secondary" data-copy="${c.id}">コードをコピー</button>
              <button type="button" class="secondary" data-reset="${c.id}">元に戻す</button>
            </div>
          </div>
        </div>
        <div class="py-result" id="${c.id}-result" hidden>
          <pre class="py-out" id="${c.id}-out"></pre>
          <div class="py-plot" id="${c.id}-pyplot"></div>
        </div>
      </section>`;
  }

  function setStatus(text, isError) {
    const el = $("#py-status");
    el.textContent = text;
    el.classList.toggle("py-error", !!isError);
  }

  async function runCell(id) {
    const code = $(`#${id}-code`).value;
    const result = $(`#${id}-result`), outEl = $(`#${id}-out`), plotEl = $(`#${id}-pyplot`);
    result.hidden = false;
    outEl.textContent = "実行中…";
    plotEl.innerHTML = "";
    let py;
    try {
      py = await ParkPy.load((s) => setStatus(s));
    } catch (e) {
      setStatus(`⚠️ Python を読み込めませんでした（${e.message}）。会社のネットワークやブラウザの設定で止められている可能性があります。グラフとコードはこのまま見られます。`, true);
      outEl.textContent = "Python を読み込めなかったため、実行できませんでした。";
      return;
    }
    setStatus("✅ Python の準備ができています（pandas・numpy・plotly が使えます）");
    const r = await ParkPy.run(py, code);
    if (!r.ok) {
      outEl.innerHTML = `${esc(r.out)}<span class="py-err">⚠️ ${esc(r.hint)}\n（エラー：${esc(r.error)}）</span>`;
      return;
    }
    outEl.textContent = r.out || "（print の出力はありません）";
    r.figs.forEach((json, i) => {
      const fig = JSON.parse(json);
      const div = document.createElement("div");
      div.className = "py-plot";
      plotEl.appendChild(div);
      Plotly.newPlot(div, fig.data, { ...fig.layout, height: 340, autosize: true }, PLOT_CFG);
    });
  }

  async function init() {
    const wrap = $("#py-charts");
    const all = [...CHARTS, { id: "free", module: "自由演習", title: "⑥ 自由に書いてみる", note: "data フォルダの5つの CSV（wait_times_raw / wait_times_clean / survey_raw / survey_clean / daily_ops）を読み込めます。", code: FREE_CODE }];
    wrap.innerHTML = all.map(cardHTML).join("");
    $("#free-plot").parentElement.remove();
    $("#free .py-grid").classList.add("py-grid-single");

    wrap.addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.run) {
        b.disabled = true;
        try { await runCell(b.dataset.run); } finally { b.disabled = false; }
      } else if (b.dataset.copy) {
        try { await navigator.clipboard.writeText($(`#${b.dataset.copy}-code`).value); b.textContent = "✓ コピーしました"; } catch (err) { b.textContent = "コピーできませんでした"; }
        setTimeout(() => (b.textContent = "コードをコピー"), 1800);
      } else if (b.dataset.reset) {
        $(`#${b.dataset.reset}-code`).value = all.find((c) => c.id === b.dataset.reset).code;
      }
    });
    wrap.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && e.target.classList.contains("py-code")) {
        e.preventDefault();
        runCell(e.target.id.replace(/-code$/, ""));
      }
    });

    try {
      const t = await P.loadTables(["wait_times_raw", "wait_times_clean", "survey_clean", "daily_ops"]);
      CHARTS.forEach((c) => c.draw(t, $(`#${c.id}-plot`)));
    } catch (e) {
      setStatus("⚠️ データを読み込めませんでした（" + e.message + "）。このページはサーバー経由で開く必要があります。", true);
    }
  }
  init();
})();
