(function () {
  const CHAPTERS = [
    {
      id: "ch1",
      badge: "第1章 p.6-16",
      title: "デジタルリテラシーとDS検定（Di-Lite）",
      questions: [
        {
          q: "【p.10】デジタルリテラシー協議会が推奨する「Di-Lite」の3領域と対応する試験の組み合わせとして、正しいものはどれですか。",
          options: [
            "IT・ソフトウェア領域：ITパスポート試験 ／ 数理・データサイエンス領域：データサイエンティスト検定 ／ AI・ディープラーニング領域：G検定",
            "IT・ソフトウェア領域：G検定 ／ 数理・データサイエンス領域：ITパスポート試験 ／ AI・ディープラーニング領域：DS検定",
            "すべての領域が単一の試験（基本情報技術者試験のみ）で定義されている"
          ],
          answer: 0,
          explanation: "Di-Lite（デジタルリテラシー領域）は、ITパスポート試験・データサイエンティスト検定（DS検定）・G検定の3つの試験で定義されています（テキスト p.10）。"
        },
        {
          q: "【p.14-16】データサイエンティスト検定（リテラシーレベル）が対象としているスキルレベルと3つのスキルカテゴリはどれですか。",
          options: [
            "シニアデータサイエンティスト対象 ／ 営業力・デザイン力・経理力",
            "アシスタントデータサイエンティスト（見習いレベル）対象 ／ ビジネス力・データサイエンス力・データエンジニアリング力",
            "経営層のみ対象 ／ 財務分析力・法務力・人事評価力"
          ],
          answer: 1,
          explanation: "DS検定リテラシーレベルは「アシスタントデータサイエンティスト」を対象とし、「ビジネス力」「データサイエンス力」「データエンジニアリング力」の3領域から出題されます（p.14-16）。"
        }
      ]
    },
    {
      id: "ch2",
      badge: "第2章 p.17-33",
      title: "社会におけるデータ・AI利活用",
      questions: [
        {
          q: "【p.25, p.32 練習問題】「小学生が学ぶ漢字の数が増えると身長が伸びる」のように、2つのデータ間に相関関係はあるが直接の因果関係はない（疑似相関）と考えられる例はどれですか。",
          options: [
            "アイスクリームの売上個数と、プールの水難事故件数（背後に『気温の上昇』という共通要因がある）",
            "商品の単価を上げたときの、1個あたりの販売価格",
            "スマートフォンの画面の明るさ設定と、バッテリーの消費速度"
          ],
          answer: 0,
          explanation: "漢字の数と身長には「年齢（学年）」、アイス売上と水難事故には「気温（季節）」という第3の変数（交絡因子）が存在するため、相関関係はあっても因果関係はありません（p.25, p.32）。"
        },
        {
          q: "【p.29, p.32 練習問題】自社のWebサイトにアクセスした顧客の情報を活用する際、個人情報保護法やGDPR、データ倫理の観点から最も適切な対応はどれですか。",
          options: [
            "利用目的をプライバシーポリシー等で明示し、必要な同意取得や安全管理措置（匿名加工・アクセス制限など）を講じた上で活用する",
            "収集した購買ログや個人情報を、本人の同意なく無断で外部の名簿業者へ売却する",
            "分析結果が自社の仮説通りになるよう、都合の悪いアンケート回答データを書き換える（改ざん）"
          ],
          answer: 0,
          explanation: "個人情報保護法やGDPR（EU一般データ保護規則）に基づき、利用目的の明示・同意取得・安全管理措置の徹底が必要です（p.29, p.32）。"
        },
        {
          q: "【p.24-27】データリテラシーを構成する3つの基本的な力として、テキストで挙げられている組み合わせはどれですか。",
          options: [
            "データを適切に「読み解く力」「説明する力」「扱う力」",
            "データを「暗記する力」「隠蔽する力」「削除する力」",
            "ハードウェアを「製造する力」「修理する力」「廃棄する力」"
          ],
          answer: 0,
          explanation: "データリテラシーは、①適切に読み解く力（分布・相関と因果・母集団）、②適切に説明する力（図表表現・比較対象の設定）、③適切に扱う力（集計・加工）の3つで構成されます（p.24-27）。"
        }
      ]
    },
    {
      id: "ch3",
      badge: "第3章 p.34-65",
      title: "ビジネス力",
      questions: [
        {
          q: "【p.64 練習問題】新商品の営業支援プロジェクトに参画し、商品開発部からいくつかのデータを受け取った。次に行うべき行動として「適切でないもの」はどれですか。",
          options: [
            "ビジネスの目的（KGI/KPI）や検証したい仮説を整理し、受け取ったデータの定義・集計期間・粒度を確認する",
            "データの背景や定義を一切確認せず、また仮説と異なる結果が出た際にデータを都合よく書き換えて報告する",
            "論理構成（空・雨・傘やWHYの並び立て）を意識し、ステークホルダーと定期的にレビューを行う"
          ],
          answer: 1,
          explanation: "データ入手後はまずデータの定義・期間・粒度を確認し、仮説と異なる結果が出た場合は処理ミスがないか確認した上で、データから得られた新しい知見を柔軟に受け入れます（p.43-44, p.54, p.64）。"
        },
        {
          q: "【p.53, p.64 練習問題】MECE（Mutually Exclusive and Collectively Exhaustive：漏れなく・ダブりなく）を意識したアンケートの年代設問として、最も適切なものはどれですか。",
          options: [
            "①20歳未満　②20歳〜30歳　③30歳〜40歳　④40歳以上（※30歳や40歳が重複している）",
            "①20代　②30代　③40代（※10代以下と50代以上が漏れている）",
            "①20歳未満　②20歳以上40歳未満　③40歳以上60歳未満　④60歳以上"
          ],
          answer: 2,
          explanation: "「未満」と「以上」を正しく使い分け、すべての年齢がどれか1つの選択肢に重複なく当てはまる状態がMECE（漏れなくダブりなく）です（p.53, p.64）。"
        },
        {
          q: "【p.57-61】AI・データ分析プロジェクトの開発手法・契約形態・情報の種類に関する記述として、正しいものはどれですか。",
          options: [
            "AI開発では事前の精度保証が難しく探索的に進めることが多いため、アジャイル型のアプローチや「準委任契約」が採用されるケースが多い",
            "他者が執筆した書籍やネット記事のまとめは「一次情報」と呼ばれ、自社で直接取得したアンケートは「三次情報」と呼ばれる",
            "存在しないデータを作成することを「盗用」といい、他人のデータを無断引用することを「捏造」という"
          ],
          answer: 0,
          explanation: "AI・データ分析では探索的アプローチが適しているためアジャイル的進行と準委任契約が多く用いられます（p.57-58）。自身で収集した情報は一次情報、存在しないデータの作成は捏造です（p.60-61）。"
        }
      ]
    },
    {
      id: "ch4",
      badge: "第4章 p.66-130",
      title: "データサイエンス力",
      questions: [
        {
          q: "【p.129 練習問題】4つのデータ「 -2, 1, 4, 5 」の分散（標本分散）の値として、適切なものはどれですか。",
          options: [
            "2.0",
            "7.5",
            "30.0"
          ],
          answer: 1,
          explanation: "平均値は (-2 + 1 + 4 + 5) ÷ 4 = 2 です。各データの平均からの差（偏差）の2乗は (-4)²=16, (-1)²=1, 2²=4, 3²=9 となり、合計は 30。データ数 4 で割ると 分散 = 30 ÷ 4 = 7.5 となります（p.83-85, p.129）。"
        },
        {
          q: "【p.78-81, p.129 練習問題】2変数（または3変数）の量的データの関係性や分布を把握するために利用する可視化表現として、最も適切なものはどれですか。",
          options: [
            "散布図（またはバブルチャート）",
            "円グラフ",
            "単一変数のヒストグラムのみ"
          ],
          answer: 0,
          explanation: "2つの量的変数の関係（相関関係など）を可視化するには「散布図」（3変数の場合は円の大きさを加えたバブルチャート）が適しています（p.81, p.129）。"
        },
        {
          q: "【p.94, p.96 例題】①「1〜5の5枚のカードから3枚を選ぶ組合せの数」と、②「1,2,3が赤・4,5,6が青のサイコロを振って青が出たとき、その目が偶数である条件付き確率」の正しい組み合わせはどれですか。",
          options: [
            "① 10通り ／ ② 2/3",
            "① 60通り ／ ② 1/2",
            "① 15通り ／ ② 1/6"
          ],
          answer: 0,
          explanation: "①選ぶだけの組合せは 5C3 = (5×4×3)/(3×2×1) = 10通り（並べる順列 5P3 なら60通り、p.94）。②青の目は {4, 5, 6} の3通りで、そのうち偶数は {4, 6} の2通りなので条件付き確率は 2/3 です（p.96）。"
        },
        {
          q: "【p.90, p.105-106, p.120-126】スケーリング・推測統計・機械学習に関する記述として、正しいものはどれですか。",
          options: [
            "平均を0、標準偏差を1に変換する処理を「標準化（z変換）」といい、サンプルサイズ n が大きくなるほど標本平均のばらつき（標準誤差）は小さくなる",
            "正解ラベル付きデータから未知の数値を予測する手法を「強化学習」という",
            "標本数（サンプルサイズ）を大きくすると、標準誤差は必ず無限大に大きくなる"
          ],
          answer: 0,
          explanation: "平均0・標準偏差1への変換は標準化（p.90）、サンプルサイズが大きくなると標準誤差は小さくなります（p.106）。正解データから学習するのは教師あり学習です（p.121）。"
        }
      ]
    },
    {
      id: "ch5",
      badge: "第5章 p.131-171",
      title: "データエンジニアリング力",
      questions: [
        {
          q: "【p.142, p.170 練習問題】RDB（リレーショナルデータベース）に関する記述として、適切なものはどれですか。",
          options: [
            "データを列（カラム）と行（レコード）からなる2次元の表（テーブル）形式で管理し、SQLを用いて操作するデータベース",
            "表形式のデータは一切扱えず、音声ファイルしか保存できないシステム",
            "バックアップやアクセス権限の設定が構造上不可能なデータベース"
          ],
          answer: 0,
          explanation: "RDB（Relational Database）は構造化データを行と列の表形式で管理し、複数のテーブルを関連付けてSQLで効率的に操作できます（p.141-142, p.170）。"
        },
        {
          q: "【p.157, p.170 練習問題】データベース内の既存レコードの値を更新（変更）するためのSQL構文（DML）として、適切なものはどれですか。",
          options: [
            "UPDATE テーブル名 SET カラム名 = 新しい値 WHERE 条件;",
            "INSERT INTO テーブル名 VALUES (...);",
            "SELECT * FROM テーブル名 ORDER BY カラム名;"
          ],
          answer: 0,
          explanation: "既存データの更新には `UPDATE` 文を使用します。`INSERT` は新規追加、`DELETE` は削除、`SELECT` はデータ参照です（p.152-157, p.170）。"
        },
        {
          q: "【p.137-140, p.163, p.165】データ分析基盤・サンプリング・情報セキュリティの3要素に関する記述として、正しいものはどれですか。",
          options: [
            "男女比8:2の学生1000人から100人を調査する際、母集団の比率に合わせて男性80人・女性20人を抽出する手法（層化抽出）が有効であり、セキュリティの3要素は「機密性・完全性・可用性」である",
            "生データをそのまま長期保管する環境を「BIツール」といい、グラフを可視化する画面を「データレイク」という",
            "データが不正に改ざんされていないことを保証する性質を「可用性」という"
          ],
          answer: 0,
          explanation: "母集団の属性比率を保ってサンプリングする層化抽出（p.163）、生データ保管の「データレイク」→分析用「DWH」→可視化「BI」（p.137-140）、情報セキュリティ3要素「機密性・完全性・可用性」（p.165）はDS検定の頻出ポイントです。"
        }
      ]
    }
  ];

  const root = document.getElementById("root");
  if (!root) return;

  const totalQCount = CHAPTERS.reduce((s, c) => s + c.questions.length, 0);

  const html = CHAPTERS.map((ch) => {
    const qHtml = ch.questions
      .map((item, qIdx) => {
        const qKey = `${ch.id}_q${qIdx}`;
        const opts = item.options
          .map(
            (opt, oIdx) => `
            <label>
              <input type="radio" name="${qKey}" value="${oIdx}">
              ${opt}
            </label>`
          )
          .join("");
        return `
          <fieldset class="question-box" id="box_${qKey}" data-answer="${item.answer}">
            <legend>Q${qIdx + 1}. ${item.q}</legend>
            ${opts}
            <div class="explanation" id="exp_${qKey}"></div>
          </fieldset>
        `;
      })
      .join("");

    return `
      <section class="card chapter-section" id="${ch.id}">
        <div class="chapter-header">
          <div>
            <i>${ch.badge}</i>
            <h2>${ch.title}</h2>
          </div>
          <button type="button" class="grade-chapter-btn" data-chapter="${ch.id}">この章を採点する</button>
        </div>
        ${qHtml}
      </section>
    `;
  }).join("");

  root.innerHTML =
    html +
    `
    <div class="score-banner">
      <div>
        <strong id="total-score">全${totalQCount}問（テキスト練習問題・例題完全対応）：回答を選んで「採点」を押してください</strong>
      </div>
      <div>
        <button type="button" id="grade-all-btn">全章をまとめて採点</button>
        <button type="button" class="secondary" id="reset-quiz-btn">回答をクリア</button>
      </div>
    </div>
  `;

  function gradeChapter(chId) {
    const ch = CHAPTERS.find((c) => c.id === chId);
    if (!ch) return { correct: 0, total: 0 };
    let correct = 0;
    ch.questions.forEach((item, qIdx) => {
      const qKey = `${ch.id}_q${qIdx}`;
      const box = document.getElementById(`box_${qKey}`);
      const exp = document.getElementById(`exp_${qKey}`);
      const checked = document.querySelector(`input[name="${qKey}"]:checked`);
      const isOk = checked && Number(checked.value) === item.answer;
      if (isOk) correct++;
      box.classList.toggle("correct", Boolean(isOk));
      box.classList.toggle("incorrect", !isOk);
      exp.innerHTML = `<strong>${isOk ? "⭕ 正解！" : "❌ 解説を確認："}</strong> ${item.explanation}`;
    });
    return { correct, total: ch.questions.length };
  }

  function updateTotalScore() {
    let totalCorrect = 0;
    let totalQuestions = 0;
    CHAPTERS.forEach((ch) => {
      ch.questions.forEach((item, qIdx) => {
        totalQuestions++;
        const qKey = `${ch.id}_q${qIdx}`;
        const checked = document.querySelector(`input[name="${qKey}"]:checked`);
        if (checked && Number(checked.value) === item.answer) {
          totalCorrect++;
        }
      });
    });
    const scoreEl = document.getElementById("total-score");
    if (scoreEl) {
      const pct = Math.round((totalCorrect / totalQuestions) * 100);
      scoreEl.textContent = `現在のスコア: ${totalCorrect} / ${totalQuestions} 問正解 （正答率 ${pct}%）`;
    }
  }

  document.querySelectorAll(".grade-chapter-btn").forEach((btn) => {
    btn.onclick = () => {
      gradeChapter(btn.dataset.chapter);
      updateTotalScore();
    };
  });

  const gradeAllBtn = document.getElementById("grade-all-btn");
  if (gradeAllBtn) {
    gradeAllBtn.onclick = () => {
      CHAPTERS.forEach((ch) => gradeChapter(ch.id));
      updateTotalScore();
    };
  }

  const resetBtn = document.getElementById("reset-quiz-btn");
  if (resetBtn) {
    resetBtn.onclick = () => {
      document.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
      document.querySelectorAll(".question-box").forEach((b) => {
        b.classList.remove("correct", "incorrect");
      });
      document.querySelectorAll(".explanation").forEach((e) => (e.innerHTML = ""));
      const scoreEl = document.getElementById("total-score");
      if (scoreEl) scoreEl.textContent = `全${totalQCount}問（テキスト練習問題・例題完全対応）：回答を選んで「採点」を押してください`;
    };
  }
})();
