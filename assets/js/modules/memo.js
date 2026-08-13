/* =========================================================
   📒 备忘录 & 短句收藏
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const state = { tab: "note", q: "" };

  function list() { return state.tab === "note" ? App.data.memo.notes : App.data.memo.quotes; }
  function pushItem(it) { (state.tab === "note" ? App.data.memo.notes : App.data.memo.quotes).unshift(it); }
  function removeItem(id) { const a = state.tab === "note" ? App.data.memo.notes : App.data.memo.quotes; const i = a.findIndex(x => x.id === id); if (i >= 0) a.splice(i, 1); }

  function openEditor(item) {
    const isEdit = !!item;
    const it = item || { title: "", text: "", pinned: false };
    const isNote = state.tab === "note";
    App.ui.modal({
      title: isEdit ? "编辑" : (isNote ? "新建备忘录" : "新建短句"),
      html: `
        ${isNote ? App.ui.field("标题", `<input class="input" id="ft" value="${App.util.escape(it.title)}" placeholder="标题（可选）">`) : ""}
        ${App.ui.field(isNote ? "内容" : "短句", `<textarea class="input" id="fb" placeholder="${isNote ? "写点什么…" : "一句灵感、语录…"}">${App.util.escape(it.text)}</textarea>`)}
        <label class="row" style="align-items:center;gap:8px;font-size:13px;color:var(--text-soft)">
          <input type="checkbox" id="fp" ${it.pinned ? "checked" : ""}> 置顶
        </label>
      `,
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: isEdit ? "保存" : "添加", cls: "btn", onClick: c => {
          const text = document.getElementById("fb").value.trim();
          if (!text) { App.toast("内容不能为空"); return; }
          const pinned = document.getElementById("fp").checked;
          if (isEdit) { if (isNote) it.title = document.getElementById("ft").value.trim(); it.text = text; it.pinned = pinned; it.updatedAt = Date.now(); }
          else pushItem({ id: App.util.uid(), title: isNote ? document.getElementById("ft").value.trim() : "", text, pinned, updatedAt: Date.now() });
          App.commit(); c(); App.render("memo");
        } },
      ],
    });
  }

  function render(view) {
    const wrap = document.createElement("div");
    const items = [...list()].filter(it => !state.q || (it.title || "").includes(state.q) || (it.text || "").includes(state.q))
      .sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
    wrap.innerHTML = `
      <div class="page-head">
        <div class="page-title"><span class="pt-ico">${App.icons.nav.memo}</span>备忘录 & 短句收藏</div>
        <button class="btn" id="addM">＋ 新建</button>
      </div>
      <div class="tabs" style="margin-bottom:14px">
        <span class="tab ${state.tab === "note" ? "active" : ""}" data-t="note">备忘录</span>
        <span class="tab ${state.tab === "quote" ? "active" : ""}" data-t="quote">灵感短句</span>
      </div>
      <input class="input" id="searchM" style="max-width:340px;margin-bottom:16px" placeholder="搜索内容…" value="${App.util.escape(state.q)}">
      <div id="mList"></div>`;
    view.appendChild(wrap);
    wrap.querySelector("#searchM").oninput = e => { state.q = e.target.value.trim(); App.render("memo"); };

    const listEl = wrap.querySelector("#mList");
    if (!items.length) {
      listEl.innerHTML = App.ui.empty("todo", state.tab === "note" ? "还没有备忘录，点右上角写第一条吧～" : "灵感短句收藏夹空空如也～");
    } else {
      items.forEach(it => {
        const el = document.createElement("div");
        el.className = "list-item";
        const preview = state.tab === "note"
          ? `<div class="li-title">${it.pinned ? '<span class="badge low">置顶</span> ' : ""}${App.util.escape(it.title || "（无标题）")}</div><div class="li-sub">${App.util.escape(it.text).slice(0, 50)}${it.text.length > 50 ? "…" : ""}</div>`
          : `<div class="li-title">${it.pinned ? '<span class="badge low">置顶</span> ' : ""}${App.util.escape(it.text)}</div>`;
        el.innerHTML = `<div class="li-main">${preview}</div>
          <button class="icon-btn" data-act="pin" title="置顶"><svg viewBox="0 0 24 24" fill="none" stroke="${it.pinned ? "var(--primary-deep)" : "currentColor"}" stroke-width="2"><path d="M9 4h6l-1 7 3 3v2H7v-2l3-3z"/></svg></button>
          <button class="icon-btn" data-act="edit" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L18 10l-4-4L4 16z"/></svg></button>
          <button class="icon-btn" data-act="del" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
        el.querySelector('[data-act="pin"]').onclick = () => { it.pinned = !it.pinned; it.updatedAt = Date.now(); App.commit(); App.render("memo"); };
        el.querySelector('[data-act="edit"]').onclick = () => openEditor(it);
        el.querySelector('[data-act="del"]').onclick = async () => { if (await App.ui.confirm("确定删除吗？")) { removeItem(it.id); App.commit(); App.render("memo"); } };
        listEl.appendChild(el);
      });
    }

    wrap.querySelectorAll("[data-t]").forEach(el => el.onclick = () => { state.tab = el.dataset.t; App.render("memo"); });
    wrap.querySelector("#addM").onclick = () => openEditor(null);
  }

  App.modules.memo = { render };
})();
