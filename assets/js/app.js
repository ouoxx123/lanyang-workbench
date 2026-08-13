/* =========================================================
   核心框架：导航 / 路由 / 主题 / 移动端抽屉
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const NAV = [
    { type: "item", id: "home", name: "首页", icon: "home", tip: "回到欢迎首页" },
    { type: "group", label: "工作板块" },
    { type: "item", id: "todo", name: "待办清单", icon: "todo", tip: "管理你的任务清单" },
    { type: "item", id: "inspiration", name: "每日灵感", icon: "inspiration", tip: "推广文案素材库" },
    { type: "item", id: "links", name: "快捷网站链接", icon: "links", tip: "常用网站书签" },
    { type: "group", label: "自律打卡板块" },
    { type: "item", id: "checkin", name: "自律打卡区", icon: "study", tip: "学习强国 & 健身打卡" },
    { type: "group", label: "生活板块" },
    { type: "item", id: "meal", name: "好好吃饭", icon: "meal", tip: "用餐与饮水记录" },
    { type: "item", id: "memo", name: "备忘录&短句收藏", icon: "memo", tip: "记事与灵感短句" },
    { type: "item", id: "countdown", name: "倒计时", icon: "countdown", tip: "重要日子提醒" },
    { type: "item", id: "finance", name: "简易记账", icon: "finance", tip: "收支记账" },
    { type: "group", label: "系统" },
    { type: "item", id: "settings", name: "工作台设置", icon: "settings", tip: "主题与同步设置" },
  ];

  function applyTheme() {
    document.body.setAttribute("data-theme", App.data.settings.theme || "cream");
  }

  function buildNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = "";
    NAV.forEach(item => {
      if (item.type === "group") {
        const g = document.createElement("div");
        g.className = "nav-group";
        g.textContent = item.label;
        nav.appendChild(g);
      } else {
        const a = document.createElement("a");
        a.className = "nav-item";
        a.href = "#/" + item.id;
        a.dataset.id = item.id;
        a.innerHTML =
          `<span class="ni-ico">${App.icons.nav[item.icon] || App.icons.plain}</span>` +
          `<span class="ni-label">${item.name}</span>` +
          `<span class="ni-tip">${item.tip}</span>`;
        nav.appendChild(a);
      }
    });
    document.getElementById("brandSheep").innerHTML = App.icons.brand;
  }

  function updateSyncBadge() {
    const on = App.sync && App.sync.isOn();
    const dot = document.getElementById("syncDot");
    const label = document.getElementById("syncLabel");
    if (on) {
      dot.style.background = "var(--primary)";
      label.textContent = "已同步 · " + (App.sync.currentUser() || "");
    } else if (App.data.settings.cloudSync) {
      dot.style.background = "var(--warn)";
      label.textContent = "同步待连接";
    } else {
      dot.style.background = "var(--good)";
      label.textContent = "本地优先";
    }
  }

  let viewTimer = null;
  function render(name) {
    if (!App.modules[name]) name = "home";
    const view = document.getElementById("view");
    view.innerHTML = "";
    if (viewTimer) { clearInterval(viewTimer); viewTimer = null; }
    if (App._viewTimer) { clearInterval(App._viewTimer); App._viewTimer = null; }

    // 高亮导航
    document.querySelectorAll(".nav-item").forEach(el => {
      el.classList.toggle("active", el.dataset.id === name);
    });
    const cur = NAV.find(n => n.id === name);
    document.getElementById("mobileTitle").textContent = (cur && cur.name) || "懒羊羊工作台";
    document.getElementById("content").scrollTop = 0;
    window.scrollTo(0, 0);

    // 关闭移动端抽屉
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("scrim").classList.remove("show");

    const m = App.modules[name];
    if (m && m.render) m.render(view);
  }

  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    render(hash || "home");
  }

  function bindShell() {
    document.getElementById("menuBtn").onclick = () => {
      document.getElementById("sidebar").classList.toggle("open");
      document.getElementById("scrim").classList.toggle("show");
    };
    document.getElementById("scrim").onclick = () => {
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("scrim").classList.remove("show");
    };
    window.addEventListener("hashchange", route);
  }

  // 把主题/同步状态变更暴露给模块
  App.applyTheme = applyTheme;
  App.updateSyncBadge = updateSyncBadge;
  App.render = render;
  App.NAV = NAV;

  // 全局：数据变更后统一保存并（若开启同步）触发上传
  App.commit = function () {
    App.save();
    if (App.sync) App.sync.onLocalChange();
  };

  function startWaterReminder() {
    if (App._waterTimer) return;
    function tick() {
      const iv = App.data.settings.reminderInterval;
      if (!iv || iv < 5) return;
      App.ui.modal({
        title: "喝水提醒",
        html: `<p style="font-size:14px;line-height:1.7">休息时间到啦，记得喝杯水补充水分～<br>今日已喝 <b>${App.data.meals.water[App.util.todayKey()] || 0}</b> 杯。</p>`,
        actions: [{ label: "知道啦", cls: "btn", onClick: c => c() }],
      });
    }
    App._waterTimer = setInterval(tick, Math.max(5, App.data.settings.reminderInterval || 60) * 60000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    buildNav();
    updateSyncBadge();
    bindShell();
    startWaterReminder();
    route();
    // 若有本机同步会话，恢复密钥并后台拉取最新数据
    if (App.sync && App.sync.hasSession() && App.data.settings.cloudSync) {
      App.sync.restore(true);
    }
  });
})();
