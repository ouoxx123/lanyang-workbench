/* =========================================================
   💰 简易记账
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const CATS = ["餐饮", "交通", "购物", "娱乐", "日常开销", "工资", "兼职", "红包", "其他"];

  function sum(filter) {
    let in_ = 0, out_ = 0;
    App.data.finance.forEach(f => { if (filter(f)) { if (f.type === "in") in_ += f.amount; else out_ += f.amount; } });
    return { in: in_, out: out_, net: in_ - out_ };
  }

  function openEditor(rec) {
    const isEdit = !!rec;
    const it = rec || { type: "out", category: CATS[0], amount: "", note: "" };
    App.ui.modal({
      title: isEdit ? "编辑账单" : "记一笔",
      html: `
        ${App.ui.field("类型", `<select class="input" id="ft"><option value="out"${it.type === "out" ? " selected" : ""}>支出</option><option value="in"${it.type === "in" ? " selected" : ""}>收入</option></select>`)}
        ${App.ui.field("分类", `<select class="input" id="fc">${CATS.map(c => `<option${c === it.category ? " selected" : ""}>${c}</option>`).join("")}</select>`)}
        ${App.ui.field("金额（元）", `<input class="input" id="fa" type="number" min="0" step="0.01" placeholder="0.00" value="${it.amount || ""}">`)}
        ${App.ui.field("备注", `<input class="input" id="fn" placeholder="可选" value="${App.util.escape(it.note || "")}">`)}
      `,
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: isEdit ? "保存" : "保存", cls: "btn", onClick: c => {
          const amount = parseFloat(document.getElementById("fa").value);
          if (isNaN(amount) || amount <= 0) { App.toast("请输入有效金额"); return; }
          if (isEdit) {
            rec.type = document.getElementById("ft").value;
            rec.category = document.getElementById("fc").value;
            rec.amount = amount;
            rec.note = document.getElementById("fn").value.trim();
          } else {
            App.data.finance.unshift({
              id: App.util.uid(), type: document.getElementById("ft").value, category: document.getElementById("fc").value,
              amount, note: document.getElementById("fn").value.trim(), date: App.util.todayKey(), time: App.util.fmtTime(),
            });
          }
          App.commit(); c(); App.render("finance");
        } },
      ],
    });
  }

  function exportJSON() {
    const data = JSON.stringify(App.data.finance, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "记账备份_" + App.util.todayKey() + ".json";
    a.click(); URL.revokeObjectURL(url);
    App.toast("已导出账单 JSON");
  }

  function render(view) {
    const todayK = App.util.todayKey();
    const mk = todayK.slice(0, 7);
    const t = sum(f => f.date === todayK);
    const m = sum(f => f.date.slice(0, 7) === mk);

    const wrap = document.createElement("div");
    // 本月分类支出柱状图
    const catMap = {};
    App.data.finance.forEach(f => { if (f.type === "out" && f.date.slice(0, 7) === mk) catMap[f.category] = (catMap[f.category] || 0) + f.amount; });
    const catItems = Object.keys(catMap).map(c => ({ label: c, value: +catMap[c].toFixed(0) }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
    const chartHtml = catItems.length
      ? `<div class="card" style="margin-bottom:18px"><div class="card-title">本月支出分类（元）</div>${App.ui.barChart(catItems, {})}</div>`
      : "";

    wrap.innerHTML = `
      <div class="page-head">
        <div class="page-title"><span class="pt-ico">${App.icons.nav.finance}</span>简易记账</div>
        <div class="row" style="gap:8px">
          <button class="btn ghost sm" id="expF">导出备份</button>
          <button class="btn" id="addF">＋ 记一笔</button>
        </div>
      </div>
      <div class="stat-grid" style="margin-bottom:18px">
        <div class="stat"><span class="s-val" style="color:var(--good)">+${t.in.toFixed(2)}</span><span class="s-lab">今日收入</span></div>
        <div class="stat"><span class="s-val" style="color:var(--danger)">-${t.out.toFixed(2)}</span><span class="s-lab">今日支出</span></div>
        <div class="stat"><span class="s-val">${t.net.toFixed(2)}</span><span class="s-lab">今日结余</span></div>
        <div class="stat"><span class="s-val">${m.net.toFixed(2)}</span><span class="s-lab">本月结余</span></div>
      </div>
      ${chartHtml}
      <div class="card"><div class="card-title">账单列表（${App.data.finance.length}）</div><div id="fList"></div></div>`;
    view.appendChild(wrap);

    const list = wrap.querySelector("#fList");
    if (!App.data.finance.length) {
      list.innerHTML = App.ui.empty("todo", "还没有账单记录，记一笔开启理财之旅吧～");
    } else {
      App.data.finance.forEach(f => {
        const el = document.createElement("div");
        el.className = "list-item";
        el.innerHTML = `
          <div class="li-main">
            <div class="li-title">${f.type === "in" ? "收入" : "支出"} · ${App.util.escape(f.category)}${f.note ? " · " + App.util.escape(f.note) : ""}</div>
            <div class="li-sub">${f.date} ${f.time}</div>
          </div>
          <div style="font-weight:800;color:${f.type === "in" ? "var(--good)" : "var(--danger)"}">${f.type === "in" ? "+" : "-"}${f.amount.toFixed(2)}</div>
          <button class="icon-btn" data-act="edit" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L18 10l-4-4L4 16z"/></svg></button>
          <button class="icon-btn" data-x="${f.id}" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
        el.querySelector(".li-main").onclick = () => openEditor(f);
        el.querySelector('[data-act="edit"]').onclick = e => { e.stopPropagation(); openEditor(f); };
        el.querySelector("[data-x]").onclick = async e => { e.stopPropagation(); if (await App.ui.confirm("删除这条账单？")) { App.data.finance = App.data.finance.filter(x => x.id !== f.id); App.commit(); App.render("finance"); } };
        list.appendChild(el);
      });
    }
    wrap.querySelector("#addF").onclick = () => openEditor(null);
    wrap.querySelector("#expF").onclick = exportJSON;
  }

  App.modules.finance = { render };
})();
