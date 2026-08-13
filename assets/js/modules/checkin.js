/* =========================================================
   📚 自律打卡区（双标签：学习强国 / 健身锻炼）
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const state = { tab: "study", studyY: 0, studyM: 0, fitTab: "bloggers", fitY: 0, fitM: 0 };

  // 内置博主强度（用于生理期低强度推荐）
  const INTENSITY = { mizi: "low", ouyang: "low", zhouliuye: "low", hanxiaosi: "low", pamela: "high" };

  function weekRange(d) {
    const day = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - day); mon.setHours(0, 0, 0, 0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [mon, sun];
  }
  function monthKey(d) { return d.getFullYear() + "-" + App.util.pad(d.getMonth() + 1); }

  function buildCal(year, month, map, onCell) {
    const grid = App.util.monthMatrix(year, month);
    const todayK = App.util.todayKey();
    let cells = grid.map(d => {
      const k = App.util.todayKey(d);
      const inMonth = d.getMonth() === month;
      let cls = "cal-cell";
      if (!inMonth) cls += " muted";
      if (k === todayK) cls += " today";
      if (map[k]) cls += " done";
      else if (map[k] === 0 && inMonth && k < todayK) cls += " missed";
      return `<div class="${cls}" data-k="${k}" data-in="${inMonth}">${d.getDate()}</div>`;
    }).join("");
    const html = `<div class="cal"><div class="cal-dow">日</div><div class="cal-dow">一</div><div class="cal-dow">二</div><div class="cal-dow">三</div><div class="cal-dow">四</div><div class="cal-dow">五</div><div class="cal-dow">六</div>${cells}</div>`;
    return html;
  }

  /* ---------------- 学习强国 ---------------- */
  function renderStudy(view, wrap) {
    const rec = App.data.study.records;
    const total = Object.values(rec).reduce((a, b) => a + (b || 0), 0);
    const now = new Date();
    const mk = monthKey(now);
    let monthDays = 0, streak = 0;
    Object.keys(rec).forEach(k => { if (k.slice(0, 7) === mk && rec[k] > 0) monthDays++; });
    // 连续打卡天数（截至今天或昨天）
    let d = new Date(now);
    if (!rec[App.util.todayKey(d)]) d.setDate(d.getDate() - 1);
    while (rec[App.util.todayKey(d)] > 0) { streak++; d.setDate(d.getDate() - 1); }

    const todayK = App.util.todayKey();
    const todayDone = rec[todayK] > 0;
    const y = state.studyY || now.getFullYear(), m = state.studyM || now.getMonth();

    // 近 6 月积分趋势
    const studyMonthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.getFullYear() + "-" + App.util.pad(d.getMonth() + 1);
      let sum = 0; Object.keys(rec).forEach(k => { if (k.slice(0, 7) === key) sum += rec[k] || 0; });
      studyMonthly.push({ label: (d.getMonth() + 1) + "月", value: sum });
    }

    const sec = document.createElement("div");
    sec.innerHTML = `
      <div class="stat-grid" style="margin-bottom:18px">
        <div class="stat"><span class="s-val">${total}</span><span class="s-lab">累计总积分</span></div>
        <div class="stat"><span class="s-val">${monthDays}</span><span class="s-lab">本月打卡天数</span></div>
        <div class="stat"><span class="s-val">${streak}</span><span class="s-lab">连续打卡天数</span></div>
      </div>
      <div class="card" style="margin-bottom:18px">
        <div class="card-title">近 6 月积分趋势</div>
        ${App.ui.barChart(studyMonthly, {})}
      </div>
      <div class="card">
        <div class="card-title">今日打卡</div>
        <div class="row" style="align-items:flex-end">
          <div style="flex:1;max-width:220px">${App.ui.field("录入今日学习积分", `<input class="input" id="pts" type="number" min="0" value="${todayDone ? rec[todayK] : ""}" placeholder="例如 42">`)}</div>
          <button class="btn" id="savePts">${todayDone ? "更新今日" : "完成打卡"}</button>
        </div>
        <div class="note" style="margin-top:10px">${todayDone ? "今日已打卡（已完成，仅记录完成状态，不强制目标分值）" : "今天还没打卡，录入积分即视为完成～"}</div>
      </div>
      <div class="card">
        <div class="card-title" style="justify-content:space-between;display:flex">
          <span>打卡日历</span>
          <span>
            <button class="btn sm ghost" id="prevM">‹</button>
            <button class="btn sm ghost" id="nextM">›</button>
          </span>
        </div>
        <div id="calBox">${buildCal(y, m, rec, null)}</div>
        <div class="row" style="margin-top:10px;font-size:12px;color:var(--text-soft)">
          <span><span class="badge" style="background:var(--primary);color:#fff">●</span> 已打卡</span>
          <span style="margin-left:14px"><span class="badge" style="background:var(--surface2)">●</span> 未打卡</span>
        </div>
      </div>
    `;
    wrap.appendChild(sec);

    if (!monthDays && !todayDone && Object.keys(rec).length === 0) {
      // 空状态叠加提示
      const empty = document.createElement("div");
      empty.style.marginTop = "6px";
      empty.innerHTML = App.ui.empty("study", "还没有打卡记录，发呆看会儿书也不错～");
      wrap.appendChild(empty);
    }

    sec.querySelector("#savePts").onclick = () => {
      const v = parseInt(sec.querySelector("#pts").value, 10);
      if (isNaN(v) || v < 0) { App.toast("请输入有效积分"); return; }
      rec[todayK] = v; App.commit(); App.render("checkin");
    };
    sec.querySelector("#prevM").onclick = () => { const d = new Date(y, m - 1, 1); state.studyY = d.getFullYear(); state.studyM = d.getMonth(); App.render("checkin"); };
    sec.querySelector("#nextM").onclick = () => { const d = new Date(y, m + 1, 1); state.studyY = d.getFullYear(); state.studyM = d.getMonth(); App.render("checkin"); };
    sec.querySelectorAll(".cal-cell[data-in='true']").forEach(c => c.onclick = () => {
      const k = c.dataset.k;
      App.ui.modal({
        title: "设置 " + k + " 积分",
        html: App.ui.field("学习积分", `<input class="input" id="cp" type="number" min="0" value="${rec[k] || ""}" placeholder="0">`),
        actions: [
          { label: "取消", cls: "btn ghost", onClick: c2 => c2() },
          { label: "保存", cls: "btn", onClick: c2 => { const v = parseInt(document.getElementById("cp").value, 10); if (!isNaN(v) && v >= 0) rec[k] = v; App.commit(); c2(); App.render("checkin"); } },
        ],
      });
    });
  }

  /* ---------------- 健身锻炼 ---------------- */
  function periodActive() {
    const p = App.data.fitness.period;
    if (!p || !p.start || !p.end) return false;
    const t = App.util.todayKey();
    return t >= p.start && t <= p.end;
  }
  function predictNext() {
    const p = App.data.fitness.period;
    if (!p || !p.end) return null;
    const cycle = p.cycle || 28;
    const end = new Date(p.end + "T00:00:00");
    const next = new Date(end); next.setDate(end.getDate() + cycle);
    return App.util.todayKey(next);
  }

  function renderFitness(view, wrap) {
    const tabs = [["bloggers", "博主卡片"], ["checkin", "今日打卡"], ["weekplan", "周计划"], ["period", "生理期"], ["cal", "记录日历"]];
    const bar = document.createElement("div");
    bar.className = "tabs";
    bar.innerHTML = tabs.map(([k, l]) => `<span class="tab ${state.fitTab === k ? "active" : ""}" data-t="${k}">${l}</span>`).join("");
    wrap.appendChild(bar);
    bar.querySelectorAll("[data-t]").forEach(el => el.onclick = () => { state.fitTab = el.dataset.t; App.render("checkin"); });

    const box = document.createElement("div");
    wrap.appendChild(box);
    if (state.fitTab === "bloggers") renderBloggers(box);
    else if (state.fitTab === "checkin") renderFitCheckin(box);
    else if (state.fitTab === "weekplan") renderWeekPlan(box);
    else if (state.fitTab === "period") renderPeriod(box);
    else renderFitCal(box);
  }

  function renderBloggers(box) {
    const bs = App.data.fitness.bloggers;
    const rec = document.createElement("div");
    rec.innerHTML = `<div class="row" style="margin-bottom:16px;justify-content:space-between">
        <div class="page-sub">内置 5 位标准博主，可手动新增其他博主</div>
        <button class="btn sm" id="addB">＋ 新增博主</button>
      </div><div class="blogger-grid" id="bg"></div>`;
    box.appendChild(rec);
    const g = rec.querySelector("#bg");
    bs.forEach(b => {
      const el = document.createElement("div");
      el.className = "blogger";
      el.innerHTML = `
        <div class="b-head"><div class="b-ava">${App.util.escape(b.name.slice(0, 1))}</div>
          <div><div class="b-name">${App.util.escape(b.name)}</div><div style="font-size:12px;color:var(--text-soft)">${App.util.escape(b.pos)}</div></div></div>
        <div class="b-tags">${(b.tags || []).map(t => `<span class="badge low">${App.util.escape(t)}</span>`).join("")}</div>
        <p><b>风格：</b>${App.util.escape(b.style)}</p>
        <p><b>适合：</b>${App.util.escape(b.suit)}</p>
        <p><b>王牌：</b>${App.util.escape(b.ace)}</p>
        <p class="b-warn">注意：${App.util.escape(b.warn)}</p>
        <div class="b-tagline">${App.util.escape(b.line)}</div>
        ${b.builtin ? "" : `<div style="margin-top:10px;text-align:right"><button class="btn sm ghost" data-del="${b.id}">删除博主</button></div>`}
      `;
      g.appendChild(el);
    });
    rec.querySelector("#addB").onclick = addBlogger;
    rec.querySelectorAll("[data-del]").forEach(btn => btn.onclick = async () => {
      if (await App.ui.confirm("确定删除该博主吗？")) {
        App.data.fitness.bloggers = App.data.fitness.bloggers.filter(x => x.id !== btn.dataset.del);
        App.commit(); App.render("checkin");
      }
    });
  }

  function addBlogger() {
    App.ui.modal({
      title: "新增健身博主",
      html: `
        ${App.ui.field("博主名称", `<input class="input" id="bn" placeholder="博主昵称">`)}
        ${App.ui.field("定位（一句话）", `<input class="input" id="bp" placeholder="如：燃脂派｜短时高效">`)}
        ${App.ui.field("标签（逗号分隔）", `<input class="input" id="bt" placeholder="短时高效,腹臀塑形">`)}
        ${App.ui.field("风格", `<textarea class="input" id="bs" placeholder="训练风格描述"></textarea>`)}
        ${App.ui.field("适合人群", `<input class="input" id="bSu" placeholder="适合谁">`)}
        ${App.ui.field("王牌课程", `<input class="input" id="bA" placeholder="代表课程">`)}
        ${App.ui.field("提醒", `<input class="input" id="bW" placeholder="注意事项">`)}
        ${App.ui.field("底部标语", `<input class="input" id="bL" placeholder="一句推荐语">`)}
      `,
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: "添加", cls: "btn", onClick: c => {
          const name = document.getElementById("bn").value.trim();
          if (!name) { App.toast("请输入博主名称"); return; }
          App.data.fitness.bloggers.push({
            id: App.util.uid(), name,
            pos: document.getElementById("bp").value.trim(),
            tags: document.getElementById("bt").value.split(/[,，]/).map(x => x.trim()).filter(Boolean),
            style: document.getElementById("bs").value.trim(),
            suit: document.getElementById("bSu").value.trim(),
            ace: document.getElementById("bA").value.trim(),
            warn: document.getElementById("bW").value.trim(),
            line: document.getElementById("bL").value.trim(),
            builtin: false,
          });
          App.commit(); c(); App.render("checkin");
        } },
      ],
    });
  }

  function renderFitCheckin(box) {
    const fit = App.data.fitness;
    const todayK = App.util.todayKey();
    const todayRecs = fit.records.filter(r => r.date === todayK);
    const active = periodActive();
    const rec = document.createElement("div");
    let html = "";
    if (active) {
      html += `<div class="warn-box" style="margin-bottom:16px">生理期进行中（${fit.period.start} ~ ${fit.period.end}）。已为你优先推荐低强度温和课程，高强度跳跃 HIIT 课程已屏蔽。</div>`;
    }
    const fnow = new Date();
    const fitMonthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(fnow.getFullYear(), fnow.getMonth() - i, 1);
      const key = d.getFullYear() + "-" + App.util.pad(d.getMonth() + 1);
      const days = new Set(fit.records.filter(r => r.date.slice(0, 7) === key).map(r => r.date)).size;
      fitMonthly.push({ label: (d.getMonth() + 1) + "月", value: days });
    }
    html += `
      <div class="stat-grid" style="margin-bottom:18px">
        <div class="stat"><span class="s-val" id="wk">0</span><span class="s-lab">本周运动次数</span></div>
        <div class="stat"><span class="s-val" id="mh">0</span><span class="s-lab">本月运动天数</span></div>
        <div class="stat"><span class="s-val" id="st">0</span><span class="s-lab">连续运动天数</span></div>
      </div>
      <div class="card" style="margin-bottom:18px">
        <div class="card-title">近 6 月运动天数</div>
        ${App.ui.barChart(fitMonthly, {})}
      </div>
      <div class="card">
        <div class="card-title" style="display:flex;justify-content:space-between"><span>今日打卡（${todayK}）</span><button class="btn sm ghost" id="mgTrain">管理训练库</button></div>
        ${App.ui.field("选择训练课程（可多选 / 也可手动输入）", `<div class="row" id="trainSel"></div>
          <input class="input" id="customTrain" style="margin-top:10px" placeholder="或手动输入本次训练名称">`)}
        ${App.ui.field("运动时长（分钟）", `<input class="input" id="dur" type="number" min="0" placeholder="如 30">`)}
        ${App.ui.field("运动感受", `<input class="input" id="feel" placeholder="爽歪歪 / 有点累 / 轻松…">`)}
        ${App.ui.field("上传运动截图（可选）", `<input class="input" id="att" type="file" accept="image/*" multiple>`)}
        <button class="btn block" id="doCheck">完成今日打卡</button>
      </div>
      <div class="card"><div class="card-title">今日已记录（${todayRecs.length}）</div><div id="todayRecs"></div></div>
    `;
    rec.innerHTML = html;
    box.appendChild(rec);

    // 训练库选择
    const sel = rec.querySelector("#trainSel");
    const trainings = fit.trainings;
    if (!trainings.length) sel.innerHTML = `<span class="note" style="flex:1">训练库为空，先去「今日打卡」下方「管理训练库」添加，或直接手动输入课程名。</span>`;
    else trainings.forEach(t => {
      const s = document.createElement("span");
      s.className = "chip"; s.textContent = t.name; s.dataset.tid = t.id;
      s.onclick = () => s.classList.toggle("active");
      sel.appendChild(s);
    });

    // 统计
    const now = new Date(); const [mon, sun] = weekRange(now); const mk = monthKey(now);
    const wk = fit.records.filter(r => { const d = new Date(r.date + "T00:00:00"); return d >= mon && d <= sun; }).length;
    const mh = new Set(fit.records.filter(r => r.date.slice(0, 7) === mk).map(r => r.date)).size;
    let streak = 0; let d = new Date(now);
    if (!fit.records.some(r => r.date === App.util.todayKey(d))) d.setDate(d.getDate() - 1);
    while (fit.records.some(r => r.date === App.util.todayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
    rec.querySelector("#wk").textContent = wk;
    rec.querySelector("#mh").textContent = mh;
    rec.querySelector("#st").textContent = streak;

    // 今日记录列表
    const tr = rec.querySelector("#todayRecs");
    if (!todayRecs.length) tr.innerHTML = `<div class="note">今天还没有打卡记录。</div>`;
    else todayRecs.forEach(r => {
      const el = document.createElement("div");
      el.className = "list-item";
      el.innerHTML = `<div class="li-main"><div class="li-title">${App.util.escape(r.name)}</div>
        <div class="li-sub">${r.duration ? r.duration + " 分钟 · " : ""}${App.util.escape(r.feeling || "")}</div></div>
        ${r.attach && r.attach.length ? `<span class="badge low">附${r.attach.length}</span>` : ""}
        <button class="icon-btn" data-x="${r.id}" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
      el.querySelector("[data-x]").onclick = async () => {
        if (await App.ui.confirm("删除这条打卡记录？")) { fit.records = fit.records.filter(x => x.id !== r.id); App.commit(); App.render("checkin"); }
      };
      tr.appendChild(el);
    });

    rec.querySelector("#mgTrain").onclick = manageTrainings;
    rec.querySelector("#doCheck").onclick = () => {
      const chosen = [...sel.querySelectorAll(".chip.active")].map(c => c.textContent);
      const custom = rec.querySelector("#customTrain").value.trim();
      const names = [...new Set([...chosen, ...(custom ? [custom] : [])])];
      const dur = parseInt(rec.querySelector("#dur").value, 10);
      const feel = rec.querySelector("#feel").value.trim();
      const files = rec.querySelector("#att").files;
      if (!names.length) { App.toast("请选择或输入训练课程"); return; }
      const attach = [];
      const reader = i => new Promise(res => { if (i >= files.length) finish(); else { const r = new FileReader(); r.onload = () => { attach.push(r.result); reader(i + 1); }; r.readAsDataURL(files[i]); } });
      function finish() {
        names.forEach(n => fit.records.push({ id: App.util.uid(), date: todayK, name: n, duration: isNaN(dur) ? null : dur, feeling: feel, attach: attach.slice() }));
        App.commit(); App.toast("打卡成功！"); App.render("checkin");
      }
      if (files && files.length) reader(0); else finish();
    };
  }

  function manageTrainings() {
    const fit = App.data.fitness;
    App.ui.modal({
      title: "管理训练库",
      html: `
        <div id="tl"></div>
        <div class="field"><label class="fld">新增课程</label>
          <div class="row" style="align-items:flex-end">
            <input class="input" id="tn" placeholder="课程名称">
            <select class="input" id="ti" style="max-width:140px"><option value="low">低强度（温和）</option><option value="high">高强度（HIIT）</option></select>
            <button class="btn sm" id="ta">添加</button>
          </div>
        </div>`,
      actions: [{ label: "完成", cls: "btn", onClick: c => c() }],
      onMount(box) {
        const tl = box.querySelector("#tl");
        const refresh = () => {
          if (!fit.trainings.length) { tl.innerHTML = `<div class="note">训练库为空，添加常用课程方便打卡勾选。</div>`; return; }
          tl.innerHTML = fit.trainings.map(t => `<div class="list-item">
            <div class="li-main"><div class="li-title">${App.util.escape(t.name)}</div><div class="li-sub">${t.intensity === "high" ? "高强度" : "低强度"}</div></div>
            <button class="icon-btn" data-del="${t.id}" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`).join("");
          tl.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
            if (await App.ui.confirm("删除该课程？")) { fit.trainings = fit.trainings.filter(x => x.id !== b.dataset.del); App.commit(); refresh(); }
          });
        };
        refresh();
        box.querySelector("#ta").onclick = () => {
          const n = box.querySelector("#tn").value.trim();
          if (!n) { App.toast("请输入课程名称"); return; }
          fit.trainings.push({ id: App.util.uid(), name: n, intensity: box.querySelector("#ti").value });
          App.commit(); box.querySelector("#tn").value = ""; refresh();
        };
      },
    });
  }

  function renderWeekPlan(box) {
    const wp = App.data.fitness.weeklyPlan;
    const dows = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const rec = document.createElement("div");
    rec.innerHTML = `<div class="card"><div class="card-title">一周训练计划</div>
      ${dows.map((d, i) => `<div style="margin-bottom:10px">${App.ui.field(d, `<input class="input" data-d="${i}" value="${App.util.escape(wp[i] || "")}" placeholder="今日计划训练内容">`)}</div>`).join("")}
      <button class="btn block" id="saveWp">保存周计划</button></div>`;
    box.appendChild(rec);
    rec.querySelector("#saveWp").onclick = () => {
      dows.forEach((_, i) => { wp[i] = rec.querySelector(`[data-d="${i}"]`).value.trim(); });
      App.commit(); App.toast("周计划已保存");
    };
  }

  function renderPeriod(box) {
    const p = App.data.fitness.period || {};
    const next = predictNext();
    const rec = document.createElement("div");
    rec.innerHTML = `
      <div class="card">
        <div class="card-title">生理期管理</div>
        <div class="row">
          ${App.ui.field("开始日期", `<input class="input" id="ps" type="date" value="${p.start || ""}">`)}
          ${App.ui.field("结束日期", `<input class="input" id="pe" type="date" value="${p.end || ""}">`)}
        </div>
        ${App.ui.field("周期长度（天，默认 28）", `<input class="input" id="pc" type="number" min="20" max="40" value="${p.cycle || 28}">`)}
        <button class="btn block" id="saveP">保存生理期</button>
        <div class="note" style="margin-top:12px">下次预测开始日：<b>${next ? next : "（请先填写起止日期）"}</b></div>
      </div>`;
    box.appendChild(rec);
    rec.querySelector("#saveP").onclick = () => {
      App.data.fitness.period = {
        start: rec.querySelector("#ps").value, end: rec.querySelector("#pe").value,
        cycle: parseInt(rec.querySelector("#pc").value, 10) || 28,
      };
      App.commit(); App.toast("已保存"); App.render("checkin");
    };
  }

  function renderFitCal(box) {
    const fit = App.data.fitness;
    const map = {};
    fit.records.forEach(r => { map[r.date] = (map[r.date] || 0) + 1; });
    const now = new Date();
    const y = state.fitY || now.getFullYear(), m = state.fitM || now.getMonth();
    const rec = document.createElement("div");
    rec.innerHTML = `
      <div class="card">
        <div class="card-title" style="display:flex;justify-content:space-between"><span>训练记录日历</span>
          <span><button class="btn sm ghost" id="pM">‹</button><button class="btn sm ghost" id="nM">›</button></span></div>
        <div id="fcal">${buildCal(y, m, map, null)}</div>
        <div class="note" style="margin-top:10px">点击有记录的日期可查看当天训练。</div>
        <div id="fcalDetail"></div>
      </div>`;
    box.appendChild(rec);
    rec.querySelector("#pM").onclick = () => { const d = new Date(y, m - 1, 1); state.fitY = d.getFullYear(); state.fitM = d.getMonth(); App.render("checkin"); };
    rec.querySelector("#nM").onclick = () => { const d = new Date(y, m + 1, 1); state.fitY = d.getFullYear(); state.fitM = d.getMonth(); App.render("checkin"); };
    rec.querySelectorAll(".cal-cell[data-in='true']").forEach(c => c.onclick = () => {
      const k = c.dataset.k;
      const rs = fit.records.filter(r => r.date === k);
      const det = rec.querySelector("#fcalDetail");
      if (!rs.length) { det.innerHTML = `<div class="note" style="margin-top:10px">${k} 无训练记录。</div>`; return; }
      det.innerHTML = `<div style="margin-top:12px">${rs.map(r => `<div class="list-item"><div class="li-main"><div class="li-title">${App.util.escape(r.name)}</div><div class="li-sub">${r.duration ? r.duration + " 分钟 · " : ""}${App.util.escape(r.feeling || "")}</div></div></div>`).join("")}</div>`;
    });
  }

  function render(view) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="page-head"><div class="page-title"><span class="pt-ico">${App.icons.nav.study}</span>自律打卡区</div></div>
      <div class="tabs" id="topTabs">
        <span class="tab ${state.tab === "study" ? "active" : ""}" data-t="study">学习强国打卡</span>
        <span class="tab ${state.tab === "fitness" ? "active" : ""}" data-t="fitness">健身锻炼打卡</span>
      </div>
      <div id="tabBody"></div>`;
    view.appendChild(wrap);
    wrap.querySelector("#topTabs").querySelectorAll("[data-t]").forEach(el => el.onclick = () => { state.tab = el.dataset.t; App.render("checkin"); });
    const body = wrap.querySelector("#tabBody");
    if (state.tab === "study") renderStudy(view, body);
    else renderFitness(view, body);
  }

  App.modules.checkin = { render };
})();
