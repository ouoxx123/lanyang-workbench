/* =========================================================
   🍰 好好吃饭
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const MEAL_TYPES = ["早餐", "午餐", "晚餐", "加餐"];
  const state = { month: "" };

  function stats() {
    const m = App.data.meals;
    const todayK = App.util.todayKey();
    const todayMeals = m.records.filter(r => r.date === todayK);
    const days = new Set(m.records.map(r => r.date));
    return {
      todayMeals: todayMeals.length,
      todayWater: m.water[todayK] || 0,
      days: days.size,
      total: m.records.length,
    };
  }

  function addMeal() {
    App.ui.modal({
      title: "新增用餐",
      html: `
        ${App.ui.field("餐次", `<select class="input" id="mt">${MEAL_TYPES.map(t => `<option>${t}</option>`).join("")}</select>`)}
        ${App.ui.field("备注", `<textarea class="input" id="mn" placeholder="今天吃了什么好吃的～"></textarea>`)}
        ${App.ui.field("食物照片（可选）", `<input class="input" id="mp" type="file" accept="image/*">`)}
      `,
      onMount(box) { box.querySelector("#mp")._data = ""; box.querySelector("#mp").onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => box.querySelector("#mp")._data = r.result; r.readAsDataURL(f); }; },
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: "保存", cls: "btn", onClick: c => {
          const photo = document.getElementById("mp")._data;
          App.data.meals.records.unshift({
            id: App.util.uid(), type: document.getElementById("mt").value,
            note: document.getElementById("mn").value.trim(), photo, date: App.util.todayKey(), time: App.util.fmtTime(),
          });
          App.commit(); c(); App.render("meal");
        } },
      ],
    });
  }

  function addWater(n) {
    const todayK = App.util.todayKey();
    const cur = App.data.meals.water[todayK] || 0;
    App.data.meals.water[todayK] = Math.max(0, cur + n);
    App.commit(); App.render("meal");
  }

  function render(view) {
    const s = stats();
    const set = App.data.settings;
    const todayK = App.util.todayKey();
    if (!state.month) state.month = todayK.slice(0, 7);

    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="page-head"><div class="page-title"><span class="pt-ico">${App.icons.nav.meal}</span>好好吃饭</div>
        <button class="btn" id="addMeal">＋ 记录用餐</button></div>
      <div class="stat-grid" style="margin-bottom:18px">
        <div class="stat"><span class="s-val">${s.todayMeals}</span><span class="s-lab">今日餐次</span></div>
        <div class="stat"><span class="s-val">${s.todayWater}/${set.waterGoal}</span><span class="s-lab">今日饮水（杯）</span></div>
        <div class="stat"><span class="s-val">${s.days}</span><span class="s-lab">记录天数</span></div>
        <div class="stat"><span class="s-val">${s.total}</span><span class="s-lab">累计餐次</span></div>
      </div>

      <div class="card">
        <div class="card-title">饮水打卡（每杯 ${set.waterCup} ml）</div>
        <div class="row" style="align-items:center;margin-bottom:14px">
          <div style="font-size:30px;font-weight:800;color:var(--primary-deep)">${s.todayWater} <span style="font-size:15px;color:var(--text-soft)">/ ${set.waterGoal} 杯</span></div>
          <button class="btn soft" id="wPlus">＋ 喝一杯</button>
          <button class="btn ghost sm" id="wMinus">－ 少一杯</button>
        </div>
        <div class="row">
          ${App.ui.field("每日目标（杯）", `<input class="input" id="wg" type="number" min="1" value="${set.waterGoal}" style="max-width:120px">`)}
          ${App.ui.field("单杯容量（ml）", `<input class="input" id="wc" type="number" min="50" value="${set.waterCup}" style="max-width:120px">`)}
          ${App.ui.field("提醒间隔（分钟）", `<input class="input" id="wi" type="number" min="5" value="${set.reminderInterval}" style="max-width:120px">`)}
          <button class="btn" id="wSave" style="align-self:flex-end">保存饮水设置</button>
        </div>
        <div class="note" style="margin-top:8px">开启后将按间隔弹出喝水提醒（需在「工作台设置-模块预设」保持一致）。</div>
      </div>

      <div class="card">
        <div class="card-title" style="display:flex;justify-content:space-between">
          <span>用餐相册</span>
          <span><input class="input" id="monthPick" type="month" value="${state.month}" style="max-width:160px;padding:6px 10px"></span>
        </div>
        <div id="album"></div>
      </div>`;
    view.appendChild(wrap);

    // 相册
    const album = wrap.querySelector("#album");
    const monthRecs = App.data.meals.records.filter(r => r.date.slice(0, 7) === state.month);
    if (!monthRecs.length) {
      album.innerHTML = App.ui.empty("meal", "抱着水杯啃口青草蛋糕，今天也要好好吃饭呀～");
    } else {
      // 按天分组
      const byDay = {};
      monthRecs.forEach(r => { (byDay[r.date] = byDay[r.date] || []).push(r); });
      let html = `<div class="album" style="margin-bottom:16px">`;
      monthRecs.filter(r => r.photo).forEach(r => { html += `<div class="a-img"><img src="${r.photo}" alt=""></div>`; });
      html += `</div>`;
      Object.keys(byDay).sort().reverse().forEach(d => {
        html += `<div style="font-weight:700;margin:12px 0 8px">${d}</div>`;
        byDay[d].forEach(r => {
          html += `<div class="list-item" data-del="${r.id}"><div class="li-main"><div class="li-title">${r.type} ${r.time}</div><div class="li-sub">${App.util.escape(r.note || "（无备注）")}</div></div>${r.photo ? `<span class="badge low">图</span>` : ""}<button class="icon-btn" data-act="del" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`;
        });
      });
      album.innerHTML = html;
      album.querySelectorAll(".list-item[data-del]").forEach(el => {
        el.querySelector('[data-act="del"]').onclick = async () => {
          if (await App.ui.confirm("删除这条用餐记录？")) { App.data.meals.records = App.data.meals.records.filter(x => x.id !== el.dataset.del); App.commit(); App.render("meal"); }
        };
      });
    }

    wrap.querySelector("#addMeal").onclick = addMeal;
    wrap.querySelector("#wPlus").onclick = () => addWater(1);
    wrap.querySelector("#wMinus").onclick = () => addWater(-1);
    wrap.querySelector("#wSave").onclick = () => {
      set.waterGoal = Math.max(1, parseInt(wrap.querySelector("#wg").value, 10) || 8);
      set.waterCup = Math.max(50, parseInt(wrap.querySelector("#wc").value, 10) || 250);
      set.reminderInterval = Math.max(5, parseInt(wrap.querySelector("#wi").value, 10) || 60);
      App.commit(); App.toast("饮水设置已保存"); App.render("meal");
    };
    wrap.querySelector("#monthPick").onchange = e => { state.month = e.target.value; App.render("meal"); };
  }

  App.modules.meal = { render };
})();
