/* =========================================================
   🔗 快捷网站链接
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const PRESET_GROUPS = ["工作网站", "素材网站", "工具网站"];
  const state = { group: "all" };

  function groups() {
    const set = new Set(PRESET_GROUPS);
    App.data.links.forEach(l => l.group && set.add(l.group));
    return [...set];
  }

  function openEditor(link) {
    const isEdit = !!link;
    const l = link || { name: "", url: "", icon: "", img: "", group: "工作网站" };
    App.ui.modal({
      title: isEdit ? "编辑链接" : "添加链接",
      html: `
        ${App.ui.field("网站名称", `<input class="input" id="fName" value="${App.util.escape(l.name)}" placeholder="例如：WorkBuddy">`)}
        ${App.ui.field("网址", `<input class="input" id="fUrl" value="${App.util.escape(l.url)}" placeholder="https://...">`)}
        ${App.ui.field("分组", `<input class="input" id="fGroup" value="${App.util.escape(l.group)}" placeholder="工作网站 / 素材网站 / 工具网站 / 自定义">`)}
        ${App.ui.field("自定义图标（可选：上传图片，留空则用首字母）", `<input class="input" id="fImg" type="file" accept="image/*">`)}
        <div class="note">提示：图标留空时自动取名称首字；也可上传一张图片作为图标。</div>
      `,
      onMount(box) {
        const f = box.querySelector("#fImg");
        f._data = l.img || "";
        f.onchange = () => {
          const file = f.files[0];
          if (!file) return;
          const r = new FileReader();
          r.onload = () => { f._data = r.result; };
          r.readAsDataURL(file);
        };
      },
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: isEdit ? "保存" : "添加", cls: "btn", onClick: c => {
          const name = document.getElementById("fName").value.trim();
          let url = document.getElementById("fUrl").value.trim();
          const group = document.getElementById("fGroup").value.trim() || "工作网站";
          if (!name) { App.toast("请输入网站名称"); return; }
          if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
          const img = document.getElementById("fImg")._data;
          if (isEdit) { l.name = name; l.url = url; l.group = group; l.img = img; }
          else App.data.links.push({ id: App.util.uid(), name, url, group, img, icon: name.slice(0, 1).toUpperCase() });
          App.commit(); c(); App.render("links");
        } },
      ],
    });
  }

  function render(view) {
    const wrap = document.createElement("div");
    const gs = groups();
    const items = App.data.links.filter(l => state.group === "all" || l.group === state.group);

    wrap.innerHTML = `
      <div class="page-head">
        <div class="page-title"><span class="pt-ico">${App.icons.nav.links}</span>快捷网站链接</div>
        <button class="btn" id="addLink">＋ 添加链接</button>
      </div>
      <div class="row" style="margin-bottom:16px">
        <span class="chip ${state.group === "all" ? "active" : ""}" data-group="all">全部</span>
        ${gs.map(g => `<span class="chip ${state.group === g ? "active" : ""}" data-group="${App.util.escape(g)}">${App.util.escape(g)}</span>`).join("")}
      </div>
      <div id="linkGrid"></div>
    `;
    view.appendChild(wrap);

    const grid = wrap.querySelector("#linkGrid");
    if (!items.length) {
      grid.innerHTML = App.ui.empty("todo", "还没有收藏的网站，点右上角添加吧～");
    } else {
      items.forEach(l => {
        const card = document.createElement("div");
        card.className = "link-card";
        const ico = l.img
          ? `<img src="${l.img}" alt="">`
          : `<span>${App.util.escape((l.icon || l.name.slice(0, 1)).toUpperCase())}</span>`;
        card.innerHTML = `
          <div class="lc-ico">${ico}</div>
          <div class="li-main" style="flex:1;min-width:0">
            <div class="lc-name">${App.util.escape(l.name)}</div>
            <div class="lc-url">${App.util.escape(l.url || "（未填网址）")}</div>
          </div>
          <button class="icon-btn" data-act="edit" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L18 10l-4-4L4 16z"/></svg></button>
          <button class="icon-btn" data-act="del" title="删除"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        `;
        card.querySelector(".li-main").onclick = () => { if (l.url) App.ui.openExternal(l.url); };
        card.querySelector('[data-act="edit"]').onclick = e => { e.stopPropagation(); openEditor(l); };
        card.querySelector('[data-act="del"]').onclick = async e => {
          e.stopPropagation();
          if (await App.ui.confirm("确定删除这个链接吗？")) {
            App.data.links = App.data.links.filter(x => x.id !== l.id); App.commit(); App.render("links");
          }
        };
        grid.appendChild(card);
        grid.className = "link-grid";
      });
    }

    wrap.querySelectorAll("[data-group]").forEach(el => el.onclick = () => { state.group = el.dataset.group; App.render("links"); });
    wrap.querySelector("#addLink").onclick = () => openEditor(null);
  }

  App.modules.links = { render };
})();
