/* =========================================================
   📋 待办清单
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const state = { view: "all", tag: "all" };

  function cycleKeyOf(task, today) {
    if (task.repeat === "daily") return App.util.todayKey(today);
    if (task.repeat === "weekly") {
      const d = new Date(today);
      const day = (d.getDay() + 6) % 7; // 周一为 0
      d.setDate(d.getDate() - day);
      return App.util.todayKey(d);
    }
    return null;
  }

  // 周期任务状态刷新（每日/每周自动重置为未完成）
  function normalize() {
    const today = new Date();
    let changed = false;
    App.data.todos.forEach(t => {
      if (t.repeat && t.repeat !== "none") {
        const ck = cycleKeyOf(t, today);
        if (t.cycleKey !== ck) { t.cycleKey = ck; if (t.done) { t.done = false; changed = true; } }
      }
    });
    if (changed) App.commit();
  }

  function allTags() {
    const set = new Set();
    App.data.todos.forEach(t => (t.tags || []).forEach(x => set.add(x)));
    return [...set];
  }

  function dueInfo(t) {
    if (!t.due || t.done) return null;
    const todayK = App.util.todayKey();
    if (t.due < todayK) return { cls: "danger", txt: "已逾期" };
    if (t.due === todayK) return { cls: "warn", txt: "今天到期" };
    const d = new Date(t.due + "T00:00:00");
    const diff = App.util.daysBetween(new Date(todayK + "T00:00:00"), d);
    if (diff <= 2) return { cls: "warn", txt: "即将到期" };
    return null;
  }

  function filtered() {
    const todayK = App.util.todayKey();
    return App.data.todos.filter(t => {
      if (state.tag !== "all" && !(t.tags || []).includes(state.tag)) return false;
      if (state.view === "undone") return !t.done;
      if (state.view === "done") return t.done;
      if (state.view === "upcoming") return !t.done && t.due && t.due <= App.util.todayKey(new Date(Date.now() + 2 * 86400000));
      return true;
    });
  }

  function openEditor(task) {
    const isEdit = !!task;
    const t = task || { text: "", priority: "mid", due: "", repeat: "none", tags: [] };
    App.ui.modal({
      title: isEdit ? "编辑任务" : "新建任务",
      html: `
        ${App.ui.field("任务内容", `<input class="input" id="fText" value="${App.util.escape(t.text)}" placeholder="今天要做什么呢～">`)}
        ${App.ui.field("优先级", `<select class="input" id="fPri">
          <option value="high"${t.priority === "high" ? " selected" : ""}>高（红）</option>
          <option value="mid"${t.priority === "mid" ? " selected" : ""}>中（黄）</option>
          <option value="low"${t.priority === "low" ? " selected" : ""}>低（绿）</option></select>`)}
        ${App.ui.field("截止日期", `<input class="input" id="fDue" type="date" value="${t.due || ""}">`)}
        ${App.ui.field("重复", `<select class="input" id="fRep">
          <option value="none"${t.repeat === "none" ? " selected" : ""}>不重复</option>
          <option value="daily"${t.repeat === "daily" ? " selected" : ""}>每日循环</option>
          <option value="weekly"${t.repeat === "weekly" ? " selected" : ""}>每周循环</option></select>`)}
        ${App.ui.field("标签（逗号分隔，如 工作,私事）", `<input class="input" id="fTags" value="${App.util.escape((t.tags || []).join(","))}" placeholder="工作,私事">`)}
      `,
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: isEdit ? "保存" : "添加", cls: "btn", onClick: c => {
          const text = document.getElementById("fText").value.trim();
          if (!text) { App.toast("请输入任务内容"); return; }
          const obj = {
            text,
            priority: document.getElementById("fPri").value,
            due: document.getElementById("fDue").value,
            repeat: document.getElementById("fRep").value,
            tags: document.getElementById("fTags").value.split(/[,，]/).map(x => x.trim()).filter(Boolean),
          };
          if (isEdit) { Object.assign(task, obj); } else {
            App.data.todos.unshift({ id: App.util.uid(), done: false, createdAt: Date.now(), ...obj });
          }
          App.commit();
          c(); App.render("todo");
        } },
      ],
    });
  }

  function render(view) {
    normalize();
    const done = App.data.todos.filter(t => t.done).length;
    const total = App.data.todos.length;

    const wrap = document.createElement("div");
    const tags = allTags();
    const filterBtns = [
      ["all", "全部任务"], ["undone", "未完成"], ["done", "已完成"], ["upcoming", "即将到期"],
    ].map(([k, l]) => `<span class="chip ${state.view === k ? "active" : ""}" data-view="${k}">${l}</span>`).join("");
    const pct = total ? Math.round((done / total) * 100) : 0;

    let html = `
      <div class="page-head">
        <div class="page-title"><span class="pt-ico">${App.icons.nav.todo}</span>待办清单</div>
        <div class="row" style="gap:8px">
          ${done ? `<button class="btn ghost sm" id="clearDone">清空已完成</button>` : ""}
          <button class="btn" id="addTodo">＋ 新建任务</button>
        </div>
      </div>
      <div class="stat-grid" style="margin-bottom:12px">
        <div class="stat"><span class="s-val">${done}/${total}</span><span class="s-lab">已完成 / 总任务</span></div>
      </div>
      <div class="progress" style="margin-bottom:18px">
        <div class="progress-bar" style="width:${pct}%"></div>
        <span class="progress-txt">${pct}% 完成</span>
      </div>
      <div class="row" style="margin-bottom:14px">${filterBtns}</div>
      <div class="row" style="margin-bottom:18px">
        <span class="chip ${state.tag === "all" ? "active" : ""}" data-tag="all">全部标签</span>
        ${tags.map(t => `<span class="chip ${state.tag === t ? "active" : ""}" data-tag="${App.util.escape(t)}">${App.util.escape(t)}</span>`).join("")}
      </div>
      <div id="todoList"></div>
    `;
    wrap.innerHTML = html;
    view.appendChild(wrap);

    const list = wrap.querySelector("#todoList");
    const items = filtered();
    if (!items.length) {
      list.innerHTML = App.ui.empty("todo", state.view === "done" ? "还没有完成的任务哦" : "今天可以偷偷摸鱼啦～\n躺平摆烂一下也没关系");
    } else {
      items.forEach(t => {
        const di = dueInfo(t);
        const tagsHtml = (t.tags || []).map(x => `<span class="badge low">${App.util.escape(x)}</span>`).join(" ");
        const item = document.createElement("div");
        item.className = "list-item" + (t.done ? " li-done" : "");
        item.draggable = true;
        item.innerHTML = `
          <span class="drag-h" title="拖动排序"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>
          <button class="icon-btn" data-act="toggle" title="完成切换">${t.done
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="var(--good)" stroke-width="3"><path d="M5 12l5 5L20 6"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" stroke-width="2.4"><circle cx="12" cy="12" r="8"/></svg>`}</button>
          <div class="li-main">
            <div class="li-title">${App.util.escape(t.text)}</div>
            <div class="li-sub">
              <span class="badge ${t.priority}">${t.priority === "high" ? "高" : t.priority === "mid" ? "中" : "低"}</span>
              ${t.due ? `<span style="margin-left:6px">到期 ${t.due}</span>` : ""}
              ${di ? `<span class="badge ${di.cls}" style="margin-left:6px">${di.txt}</span>` : ""}
              ${t.repeat && t.repeat !== "none" ? `<span class="badge warn" style="margin-left:6px">${t.repeat === "daily" ? "每日" : "每周"}</span>` : ""}
              ${tagsHtml}
            </div>
          </div>
          <button class="icon-btn" data-act="edit" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L18 10l-4-4L4 16z"/></svg></button>
          <button class="icon-btn" data-act="del" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        `;
        item.querySelector('[data-act="toggle"]').onclick = () => { t.done = !t.done; App.commit(); App.render("todo"); };
        item.querySelector('[data-act="edit"]').onclick = () => openEditor(t);
        item.querySelector('[data-act="del"]').onclick = async () => {
          if (await App.ui.confirm("确定删除这个任务吗？")) {
            App.data.todos = App.data.todos.filter(x => x.id !== t.id); App.commit(); App.render("todo");
          }
        };
        // 拖拽排序
        item.ondragstart = e => e.dataTransfer.setData("text/plain", t.id);
        item.ondragover = e => { e.preventDefault(); item.classList.add("drag-over"); };
        item.ondragleave = () => item.classList.remove("drag-over");
        item.ondrop = e => {
          e.preventDefault(); item.classList.remove("drag-over");
          const fromId = e.dataTransfer.getData("text/plain");
          if (!fromId || fromId === t.id) return;
          const arr = App.data.todos;
          const from = arr.findIndex(x => x.id === fromId);
          const to = arr.findIndex(x => x.id === t.id);
          if (from < 0 || to < 0) return;
          const [moved] = arr.splice(from, 1);
          arr.splice(to, 0, moved);
          App.commit(); App.render("todo");
        };
        list.appendChild(item);
      });
    }

    wrap.querySelectorAll("[data-view]").forEach(el => el.onclick = () => { state.view = el.dataset.view; App.render("todo"); });
    wrap.querySelectorAll("[data-tag]").forEach(el => el.onclick = () => { state.tag = el.dataset.tag; App.render("todo"); });
    wrap.querySelector("#addTodo").onclick = () => openEditor(null);
    const clearBtn = wrap.querySelector("#clearDone");
    if (clearBtn) clearBtn.onclick = async () => {
      if (await App.ui.confirm("将删除所有已完成的任务，且无法恢复。确定？")) {
        App.data.todos = App.data.todos.filter(x => !x.done); App.commit(); App.render("todo");
      }
    };
  }

  App.modules.todo = { render };
})();
