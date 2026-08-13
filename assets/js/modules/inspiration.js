/* =========================================================
   💡 每日灵感（推广文案素材库）
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const state = { tag: "all", q: "" };

  function allTags() {
    const set = new Set();
    App.data.inspirations.forEach(i => (i.tags || []).forEach(x => set.add(x)));
    return [...set];
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      App.toast("已复制到剪贴板");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); App.toast("已复制"); } catch (e2) { App.toast("复制失败，请手动选择"); }
      ta.remove();
    }
  }

  function openEditor(item) {
    const isEdit = !!item;
    const it = item || { text: "", tags: [] };
    App.ui.modal({
      title: isEdit ? "编辑文案" : "新建文案",
      html: `
        ${App.ui.field("文案内容（短视频口播 / 小红书文案等）", `<textarea class="input" id="fText" placeholder="在这里写下你的灵感吧～">${App.util.escape(it.text)}</textarea>`)}
        ${App.ui.field("标签分类（逗号分隔，如 短视频口播,小红书文案,标题,脚本）", `<input class="input" id="fTags" value="${App.util.escape((it.tags || []).join(","))}" placeholder="短视频口播,小红书文案">`)}
      `,
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: isEdit ? "保存" : "添加", cls: "btn", onClick: c => {
          const text = document.getElementById("fText").value.trim();
          if (!text) { App.toast("请输入文案内容"); return; }
          const tags = document.getElementById("fTags").value.split(/[,，]/).map(x => x.trim()).filter(Boolean);
          if (isEdit) { it.text = text; it.tags = tags; }
          else App.data.inspirations.unshift({ id: App.util.uid(), text, tags, pinned: false, createdAt: Date.now() });
          App.commit(); c(); App.render("inspiration");
        } },
      ],
    });
  }

  function render(view) {
    const wrap = document.createElement("div");
    const tags = allTags();
    const items = App.data.inspirations
      .filter(i => (state.tag === "all" || (i.tags || []).includes(state.tag)))
      .filter(i => !state.q || i.text.includes(state.q) || (i.tags || []).some(t => t.includes(state.q)))
      .sort((a, b) => (b.pinned - a.pinned) || (b.createdAt - a.createdAt));

    wrap.innerHTML = `
      <div class="page-head">
        <div class="page-title"><span class="pt-ico">${App.icons.nav.inspiration}</span>每日灵感</div>
        <button class="btn" id="addIns">＋ 新建文案</button>
      </div>
      <div class="row" style="margin-bottom:14px;align-items:center">
        <input class="input" id="searchIns" style="max-width:320px" placeholder="搜索关键词" value="${App.util.escape(state.q)}">
        <span class="chip ${state.tag === "all" ? "active" : ""}" data-tag="all">全部</span>
        ${tags.map(t => `<span class="chip ${state.tag === t ? "active" : ""}" data-tag="${App.util.escape(t)}">${App.util.escape(t)}</span>`).join("")}
      </div>
      <div id="insList"></div>
    `;
    view.appendChild(wrap);

    const list = wrap.querySelector("#insList");
    if (!items.length) {
      list.innerHTML = App.ui.empty("todo", "还没有灵感素材，点右上角添加第一条吧～");
    } else {
      items.forEach(i => {
        const el = document.createElement("div");
        el.className = "list-item";
        const tagsHtml = (i.tags || []).map(t => `<span class="badge low">${App.util.escape(t)}</span>`).join(" ");
        el.innerHTML = `
          <div class="li-main">
            <div class="li-title">${i.pinned ? '<span class="badge low">置顶</span> ' : ""}${App.util.escape(i.text).slice(0, 60)}${i.text.length > 60 ? "…" : ""}</div>
            <div class="li-sub">${tagsHtml}</div>
          </div>
          <button class="icon-btn" data-act="copy" title="复制"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>
          <button class="icon-btn" data-act="pin" title="${i.pinned ? "取消置顶" : "置顶"}"><svg viewBox="0 0 24 24" fill="none" stroke="${i.pinned ? "var(--primary-deep)" : "currentColor"}" stroke-width="2"><path d="M9 4h6l-1 7 3 3v2H7v-2l3-3z"/></svg></button>
          <button class="icon-btn" data-act="edit" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L18 10l-4-4L4 16z"/></svg></button>
          <button class="icon-btn" data-act="del" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        `;
        el.querySelector('[data-act="copy"]').onclick = () => copyText(i.text);
        el.querySelector('[data-act="pin"]').onclick = () => { i.pinned = !i.pinned; App.commit(); App.render("inspiration"); };
        el.querySelector('[data-act="edit"]').onclick = () => openEditor(i);
        el.querySelector('[data-act="del"]').onclick = async () => {
          if (await App.ui.confirm("确定删除这条文案吗？")) {
            App.data.inspirations = App.data.inspirations.filter(x => x.id !== i.id); App.commit(); App.render("inspiration");
          }
        };
        list.appendChild(el);
      });
    }

    wrap.querySelector("#searchIns").oninput = e => { state.q = e.target.value.trim(); App.render("inspiration"); };
    wrap.querySelectorAll("[data-tag]").forEach(el => el.onclick = () => { state.tag = el.dataset.tag; App.render("inspiration"); });
    wrap.querySelector("#addIns").onclick = () => openEditor(null);
  }

  App.modules.inspiration = { render };
})();
