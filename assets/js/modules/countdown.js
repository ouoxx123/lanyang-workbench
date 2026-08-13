/* =========================================================
   ⏳ 倒计时
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  function compute(c) {
    const today = new Date(App.util.todayKey() + "T00:00:00");
    if (c.mode === "down") {
      const t = new Date(c.targetDate + "T00:00:00");
      const diff = App.util.daysBetween(today, t);
      if (diff > 0) return { num: diff, unit: "天后", sub: "距离 " + c.targetDate };
      if (diff === 0) return { num: "今天", unit: "就是这天", sub: c.targetDate };
      return { num: -diff, unit: "天前", sub: "已过期 · " + c.targetDate };
    } else {
      const s = new Date(c.startDate + "T00:00:00");
      const diff = App.util.daysBetween(s, today);
      return { num: diff, unit: "天前起", sub: "始于 " + c.startDate };
    }
  }

  function openEditor(c) {
    const isEdit = !!c;
    const it = c || { title: "", mode: "down", targetDate: "", startDate: App.util.todayKey(), color: "#ffce5c" };
    App.ui.modal({
      title: isEdit ? "编辑倒计时" : "新建倒计时",
      html: `
        ${App.ui.field("事件名称", `<input class="input" id="ct" value="${App.util.escape(it.title)}" placeholder="如：去旅行 / 在一起第几天">`)}
        ${App.ui.field("计时模式", `<select class="input" id="cm">
          <option value="down"${it.mode === "down" ? " selected" : ""}>倒数模式（距离目标日还剩）</option>
          <option value="up"${it.mode === "up" ? " selected" : ""}>正向计时（从起始日已历经）</option></select>`)}
        <div id="dateField"></div>
        ${App.ui.field("主题色", `<input class="input" id="cc" type="color" value="${it.color || "#ffce5c"}" style="height:42px;padding:4px">`)}
      `,
      onMount(box) {
        const sync = () => {
          const mode = box.querySelector("#cm").value;
          box.querySelector("#dateField").innerHTML = App.ui.field(
            mode === "down" ? "目标日期" : "起始日期",
            `<input class="input" id="cd" type="date" value="${mode === "down" ? (it.targetDate || "") : (it.startDate || App.util.todayKey())}">`);
        };
        box.querySelector("#cm").onchange = sync; sync();
      },
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c2 => c2() },
        { label: isEdit ? "保存" : "添加", cls: "btn", onClick: c2 => {
          const title = document.getElementById("ct").value.trim();
          if (!title) { App.toast("请输入事件名称"); return; }
          const mode = document.getElementById("cm").value;
          const date = document.getElementById("cd").value;
          if (!date) { App.toast("请选择日期"); return; }
          if (isEdit) {
            it.title = title; it.mode = mode; it.color = document.getElementById("cc").value;
            if (mode === "down") it.targetDate = date; else it.startDate = date;
          } else {
            App.data.countdowns.push({ id: App.util.uid(), title, mode, targetDate: mode === "down" ? date : "", startDate: mode === "up" ? date : App.util.todayKey(), color: document.getElementById("cc").value, pinned: false });
          }
          App.commit(); c2(); App.render("countdown");
        } },
      ],
    });
  }

  function render(view) {
    const wrap = document.createElement("div");
    const items = [...App.data.countdowns].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    wrap.innerHTML = `
      <div class="page-head">
        <div class="page-title"><span class="pt-ico">${App.icons.nav.countdown}</span>倒计时</div>
        <button class="btn" id="addC">＋ 新建倒计时</button>
      </div>
      <div id="cdGrid"></div>`;
    view.appendChild(wrap);
    const grid = wrap.querySelector("#cdGrid");
    if (!items.length) {
      grid.innerHTML = App.ui.empty("todo", "还没有倒计时，添加假期或纪念日试试吧～");
    } else {
      grid.className = "cd-grid";
      items.forEach(c => {
        const r = compute(c);
        const card = document.createElement("div");
        card.className = "cd-card";
        card.style.borderTop = "4px solid " + (c.color || "var(--primary)");
        card.innerHTML = `
          <button class="icon-btn" style="position:absolute;top:12px;right:12px" data-act="edit" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L18 10l-4-4L4 16z"/></svg></button>
          <button class="icon-btn" style="position:absolute;top:12px;right:52px" data-act="del" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
          <button class="icon-btn" style="position:absolute;top:12px;right:92px" data-act="pin" title="${c.pinned ? "取消置顶" : "置顶"}"><svg viewBox="0 0 24 24" fill="none" stroke="${c.pinned ? "var(--primary-deep)" : "currentColor"}" stroke-width="2"><path d="M9 4h6l-1 7 3 3v2H7v-2l3-3z"/></svg></button>
          <div class="cd-title">${c.pinned ? '<span class="badge low" style="margin-right:6px">置顶</span>' : ""}${App.util.escape(c.title)}</div>
          <div class="cd-mode">${c.mode === "down" ? "倒数模式" : "正向计时"} · ${r.sub}</div>
          <div class="cd-big">${r.num}</div>
          <div class="cd-unit">${r.unit}</div>`;
        card.querySelector('[data-act="edit"]').onclick = () => openEditor(c);
        card.querySelector('[data-act="pin"]').onclick = () => { c.pinned = !c.pinned; App.commit(); App.render("countdown"); };
        card.querySelector('[data-act="del"]').onclick = async () => { if (await App.ui.confirm("确定删除这个倒计时吗？")) { App.data.countdowns = App.data.countdowns.filter(x => x.id !== c.id); App.commit(); App.render("countdown"); } };
        grid.appendChild(card);
      });
    }
    wrap.querySelector("#addC").onclick = () => openEditor(null);
  }

  App.modules.countdown = { render };
})();
