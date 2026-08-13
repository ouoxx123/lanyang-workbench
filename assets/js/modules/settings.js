/* =========================================================
   ⚙️ 工作台设置
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  function render(view) {
    const s = App.data.settings;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="page-head"><div class="page-title"><span class="pt-ico">${App.icons.nav.settings}</span>工作台设置</div></div>

      <div class="card">
        <div class="card-title">主题配置</div>
        <div class="field"><label class="fld">主色调</label>
          <div class="theme-swatches">
            <div class="swatch cream ${s.theme === "cream" ? "active" : ""}" data-th="cream" title="奶黄"></div>
            <div class="swatch lilac ${s.theme === "lilac" ? "active" : ""}" data-th="lilac" title="浅紫"></div>
            <div class="swatch pink ${s.theme === "pink" ? "active" : ""}" data-th="pink" title="浅粉"></div>
          </div>
        </div>
        <div class="field"><label class="fld">首页背景壁纸（懒羊羊主题）</label>
          <div class="row" style="align-items:center">
            <input class="input" id="wp" type="file" accept="image/*" style="max-width:300px">
            <button class="btn ghost sm" id="wpClear">清除壁纸</button>
          </div>
          ${s.wallpaper ? `<div style="margin-top:10px;width:160px;height:90px;border-radius:12px;background:url('${s.wallpaper}') center/cover;border:1px solid var(--border)"></div>` : `<div class="note" style="margin-top:8px">未设置壁纸，首页使用纯色主题背景。</div>`}
        </div>
      </div>

      <div class="card">
        <div class="card-title">个性化设置</div>
        ${App.ui.field("首页欢迎昵称", `<input class="input" id="nick" value="${App.util.escape(s.nickname)}" placeholder="留空则显示「朋友」" style="max-width:300px">`)}
        <button class="btn soft" id="saveNick">保存昵称</button>
      </div>

      <div class="card">
        <div class="card-title">云端多端加密同步</div>
        <div class="row" style="align-items:center;justify-content:space-between;margin-bottom:12px">
          <div>
            <div style="font-weight:700">同步开关</div>
            <div style="font-size:12.5px;color:var(--text-soft)" id="syncStateDesc">${s.cloudSync ? "已开启：数据加密上传云端" : "关闭：仅本地存储"}</div>
          </div>
          <div class="switch ${s.cloudSync ? "on" : ""}" id="syncSwitch"></div>
        </div>
        <div class="note" style="margin-bottom:12px">
          <b>端到端加密 · 隐私保护</b><br>
          ① 默认【本地优先模式】：所有数据仅存于本设备，不会主动上传。<br>
          ② 开启【云端同步模式】：数据在本机用口令加密后上传，<b>服务器只能看到密文，看不到任何明文</b>；电脑网页端与手机端凭同一口令互通。关闭后新数据不再上传。
        </div>
        <div id="syncStatus" class="note" style="margin-bottom:12px;display:${App.sync.isOn() ? "block" : "none"}">
          已登录账号：<b>${App.sync.currentUser() || "-"}</b><span id="lastSync"></span>
        </div>
        <div class="row">
          <button class="btn ghost sm" id="syncNowBtn" style="display:${App.sync.isOn() ? "inline-block" : "none"}">立即同步</button>
          <button class="btn ghost sm" id="viewCloud">查看云端空间</button>
          <button class="btn danger sm" id="clearCloud">清除云端备份</button>
        </div>
        <div id="cloudInfo" style="margin-top:10px"></div>
      </div>

      <div class="card">
        <div class="card-title">模块预设参数</div>
        <div class="row">
          ${App.ui.field("饮水默认目标（杯）", `<input class="input" id="wg" type="number" min="1" value="${s.waterGoal}" style="max-width:140px">`)}
          ${App.ui.field("单杯容量（ml）", `<input class="input" id="wc" type="number" min="50" value="${s.waterCup}" style="max-width:140px">`)}
          ${App.ui.field("喝水提醒间隔（分钟）", `<input class="input" id="wi" type="number" min="5" value="${s.reminderInterval}" style="max-width:140px">`)}
        </div>
        ${App.ui.field("待办默认视图", `<select class="input" id="tv" style="max-width:200px">
          <option value="all"${s.todoDefaultView === "all" ? " selected" : ""}>全部任务</option>
          <option value="undone"${s.todoDefaultView === "undone" ? " selected" : ""}>未完成</option>
          <option value="done"${s.todoDefaultView === "done" ? " selected" : ""}>已完成</option>
          <option value="upcoming"${s.todoDefaultView === "upcoming" ? " selected" : ""}>即将到期</option></select>`)}
        <button class="btn" id="savePreset">保存预设</button>
      </div>`;
    view.appendChild(wrap);

    // 主题切换
    wrap.querySelectorAll(".swatch").forEach(el => el.onclick = () => {
      s.theme = el.dataset.th; App.commit(); App.applyTheme(); App.updateSyncBadge(); App.render("settings");
    });

    // 壁纸
    const wp = wrap.querySelector("#wp");
    wp._data = s.wallpaper || "";
    wp.onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { s.wallpaper = r.result; App.commit(); App.render("settings"); }; r.readAsDataURL(f); };
    wrap.querySelector("#wpClear").onclick = () => { s.wallpaper = ""; App.commit(); App.render("settings"); };

    // 昵称
    wrap.querySelector("#saveNick").onclick = () => { s.nickname = wrap.querySelector("#nick").value.trim(); App.commit(); App.toast("昵称已保存"); };

    // 同步开关：开启 -> 弹出 新建/登录 账号；关闭 -> 退出同步
    wrap.querySelector("#syncSwitch").onclick = async () => {
      const on = !s.cloudSync;
      if (on) {
        openSyncAccountModal();
      } else {
        if (await App.ui.confirm("关闭后新数据不再自动上传云端（已在云端的备份保留）。确定关闭？")) {
          App.sync.disable();
          App.updateSyncBadge(); App.render("settings");
          App.toast("已关闭云端同步");
        }
      }
    };

    // 立即同步
    const syncNowBtn = wrap.querySelector("#syncNowBtn");
    if (syncNowBtn) syncNowBtn.onclick = async () => {
      syncNowBtn.disabled = true; syncNowBtn.textContent = "同步中…";
      try {
        await App.sync.push();
        const v = await App.sync.viewCloud();
        wrap.querySelector("#lastSync").textContent = "　·　已用 " + App.util.fmtBytes(v.size);
        App.updateSyncBadge();
        App.toast("已同步到云端");
      } catch (e) { App.toast("同步失败：" + e.message); }
      finally { syncNowBtn.disabled = false; syncNowBtn.textContent = "立即同步"; }
    };

    // 查看云端空间
    wrap.querySelector("#viewCloud").onclick = async () => {
      const info = wrap.querySelector("#cloudInfo");
      if (!App.sync.isOn()) { info.innerHTML = `<div class="warn-box">当前未连接云端同步。开启后可查看云端存储。</div>`; return; }
      try {
        const v = await App.sync.viewCloud();
        info.innerHTML = `<div class="note">云端已用空间：<b>${App.util.fmtBytes(v.size)}</b>　·　最近更新：${v.updatedAt ? App.util.fmtTime(new Date(v.updatedAt)) : "无"}。数据以密文形式保存，服务器无法读取内容。</div>`;
      } catch (e) { info.innerHTML = `<div class="warn-box">查询失败：${e.message}</div>`; }
    };

    // 清除云端备份
    wrap.querySelector("#clearCloud").onclick = async () => {
      if (!App.sync.isOn()) { App.toast("未连接云端同步"); return; }
      if (await App.ui.confirm("将删除云端全部备份数据且无法恢复。确定清除？")) {
        try { await App.sync.clearCloud(); wrap.querySelector("#cloudInfo").innerHTML = `<div class="note">云端备份已清除。</div>`; App.toast("云端备份已清除"); }
        catch (e) { App.toast("清除失败：" + e.message); }
      }
    };

    // 预设
    wrap.querySelector("#savePreset").onclick = () => {
      s.waterGoal = Math.max(1, parseInt(wrap.querySelector("#wg").value, 10) || 8);
      s.waterCup = Math.max(50, parseInt(wrap.querySelector("#wc").value, 10) || 250);
      s.reminderInterval = Math.max(5, parseInt(wrap.querySelector("#wi").value, 10) || 60);
      s.todoDefaultView = wrap.querySelector("#tv").value;
      App.commit(); App.toast("预设已保存");
    };
  }

  /* 新建 / 登录 同步账号弹窗 */
  function openSyncAccountModal() {
    const box = App.ui.modal({
      title: "云端同步账号",
      html: `
        <div class="seg" id="seg">
          <div class="seg-item active" data-tab="new">新建账号</div>
          <div class="seg-item" data-tab="login">登录已有账号</div>
        </div>
        <p class="note" id="syncTip" style="margin:12px 0">首次开启：创建一个同步账号（用户名 + 口令）。<b>口令即解密密钥，请务必牢记</b>，遗忘将无法恢复云端数据。</p>
        <div class="field"><label class="fld">用户名（3-32 位字母/数字/下划线）</label>
          <input class="input" id="su" placeholder="例如 lazy_sheep" style="max-width:320px"></div>
        <div class="field"><label class="fld">同步口令（用于端到端加密，勿遗失）</label>
          <input class="input" id="sp" type="password" placeholder="设置强口令" style="max-width:320px"></div>
        <div class="field" id="spwWrap" style="display:none"><label class="fld">确认口令</label>
          <input class="input" id="spw" type="password" placeholder="再次输入口令" style="max-width:320px"></div>
        <div id="syncErr" class="warn-box" style="display:none;margin-top:10px"></div>`,
      actions: [
        { label: "取消", cls: "btn ghost", onClick: c => c() },
        { label: "确定", cls: "btn", onClick: c => submit(c) },
      ],
    });
    let tab = "new";
    box.box.querySelectorAll(".seg-item").forEach(el => el.onclick = () => {
      tab = el.dataset.tab;
      box.box.querySelectorAll(".seg-item").forEach(x => x.classList.toggle("active", x === el));
      box.box.querySelector("#spwWrap").style.display = tab === "new" ? "block" : "none";
      box.box.querySelector("#syncTip").innerHTML = tab === "new"
        ? "首次开启：创建一个同步账号（用户名 + 口令）。<b>口令即解密密钥，请务必牢记</b>，遗忘将无法恢复云端数据。"
        : "在新设备登录同一账号：输入用户名与口令，即可拉取云端加密数据到本机。";
    });
    async function submit(close) {
      const u = box.box.querySelector("#su").value.trim();
      const p = box.box.querySelector("#sp").value;
      const err = box.box.querySelector("#syncErr");
      err.style.display = "none";
      if (!/^[A-Za-z0-9_]{3,32}$/.test(u)) { err.textContent = "用户名需 3-32 位字母/数字/下划线"; err.style.display = "block"; return; }
      if (p.length < 6) { err.textContent = "口令至少 6 位"; err.style.display = "block"; return; }
      if (tab === "new" && p !== box.box.querySelector("#spw").value) { err.textContent = "两次口令不一致"; err.style.display = "block"; return; }
      try {
        if (tab === "new") await App.sync.register(u, p);
        else await App.sync.login(u, p);
        close();
        App.updateSyncBadge(); App.render("settings");
        App.toast(tab === "new" ? "账号已创建并同步" : "已登录并拉取云端数据");
      } catch (e) { err.textContent = e.message; err.style.display = "block"; }
    }
  }

  App.modules.settings = { render };
})();
