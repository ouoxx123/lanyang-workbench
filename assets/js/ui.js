/* =========================================================
   共享 UI 组件：弹窗 / 轻提示 / 确认框 / 空状态
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  const ui = (App.ui = {});

  /* 轻提示 */
  App.toast = function (msg) {
    const root = document.getElementById("toastRoot");
    if (!root) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateY(8px)"; t.style.transition = ".3s"; }, 1800);
    setTimeout(() => t.remove(), 2200);
  };

  /* 弹窗
     opts: { title, html, onMount(modalEl), actions:[{label,cls,onClick(close)}] }
     返回 { close } */
  ui.modal = function (opts) {
    const root = document.getElementById("modalRoot");
    const mask = document.createElement("div");
    mask.className = "modal-mask";
    const box = document.createElement("div");
    box.className = "modal";
    const closeBtn = document.createElement("button");
    closeBtn.className = "icon-btn close";
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
    box.appendChild(closeBtn);
    const h = document.createElement("h3");
    h.textContent = opts.title || "";
    box.appendChild(h);
    if (opts.html) {
      const body = document.createElement("div");
      body.innerHTML = opts.html;
      box.appendChild(body);
    }
    const bar = document.createElement("div");
    bar.className = "row";
    bar.style.marginTop = "20px";
    bar.style.justifyContent = "flex-end";
    (opts.actions || [{ label: "知道了", cls: "btn", onClick: c => c() }]).forEach(a => {
      const b = document.createElement("button");
      b.className = a.cls || "btn";
      b.textContent = a.label;
      b.onclick = () => a.onClick && a.onClick(close);
      bar.appendChild(b);
    });
    box.appendChild(bar);

    function close() { root.classList.remove("show"); mask.remove(); box.remove(); }
    closeBtn.onclick = close;
    mask.onclick = close;

    root.appendChild(mask);
    root.appendChild(box);
    root.classList.add("show");
    if (opts.onMount) opts.onMount(box);
    return { close, box };
  };

  /* 复制文本：优先 Clipboard API，HTTP/移动端降级到 textarea+execCommand */
  ui.copyText = function (text) {
    return new Promise(resolve => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(() => resolve(true), () => resolve(fallbackCopy(text)));
        } else {
          resolve(fallbackCopy(text));
        }
      } catch (e) { resolve(fallbackCopy(text)); }
    });
    function fallbackCopy(t) {
      try {
        const ta = document.createElement("textarea");
        ta.value = t; ta.setAttribute("readonly", "");
        ta.style.position = "fixed"; ta.style.top = "-9999px"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
        const ok = document.execCommand("copy");
        ta.remove(); return ok;
      } catch (e) { return false; }
    }
  };

  /* 打开外部链接：用真实 <a> 触发，移动端比 window.open 更可靠 */
  ui.openExternal = function (url) {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); a.remove();
  };

  /* 确认框 -> Promise<bool> */
  ui.confirm = function (msg, title) {
    return new Promise(res => {
      ui.modal({
        title: title || "确认操作",
        html: `<p style="font-size:14px;line-height:1.7;color:var(--text)">${App.util.escape(msg)}</p>`,
        actions: [
          { label: "取消", cls: "btn ghost", onClick: c => { c(); res(false); } },
          { label: "确定", cls: "btn danger", onClick: c => { c(); res(true); } },
        ],
      });
    });
  };

  /* 空状态 HTML */
  ui.empty = function (iconKey, text) {
    const svg = App.icons.empty[iconKey] || App.icons.empty.todo;
    return `<div class="empty"><div class="e-illu">${svg}</div><div class="e-text">${App.util.escape(text)}</div></div>`;
  };

  /* 简单表单字段助手（返回 HTML 字符串） */
  ui.field = function (label, inner) {
    return `<div class="field"><label class="fld">${label}</label>${inner}</div>`;
  };

  /* SVG 柱状图（返回 HTML 字符串）
     items: [{label, value, color?}]   opts: {height, max, unit?} */
  ui.barChart = function (items, opts) {
    opts = opts || {};
    items = items || [];
    const h = opts.height || 170;
    const pad = 26, gap = 10;
    const n = Math.max(items.length, 1);
    const fullW = Math.max(300, n * 46);
    const maxV = Math.max(opts.max || 0, ...items.map(i => i.value || 0), 1);
    const bw = (fullW - pad * 2 - gap * (n - 1)) / n;
    const bars = items.map((it, idx) => {
      const v = it.value || 0;
      const bh = maxV ? (v / maxV) * (h - pad) : 0;
      const x = pad + idx * (bw + gap);
      const y = h - pad - bh;
      const col = it.color || "var(--primary)";
      return `<g>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(bh, 0).toFixed(1)}" rx="7" fill="${col}"></rect>
        ${v ? `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" font-size="11" fill="var(--text)" text-anchor="middle">${v}</text>` : ""}
        <text x="${(x + bw / 2).toFixed(1)}" y="${(h - 8).toFixed(1)}" font-size="11" fill="var(--text-soft)" text-anchor="middle">${it.label}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 ${fullW} ${h}" width="100%" style="max-width:100%;display:block">${bars}<line x1="${pad}" y1="${h - pad}" x2="${fullW - pad}" y2="${h - pad}" stroke="var(--border)"></line></svg>`;
  };
})();
