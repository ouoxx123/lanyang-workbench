/* =========================================================
   首页 · 极简欢迎首页
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  App.modules = App.modules || {};

  const QUOTES = [
    "慢慢来，比较快。今天也要好好照顾自己哦～",
    "能躺着绝不站着，但该做的事还是要做的啦。",
    "烦恼像青草，嚼一嚼就消化啦。",
    "你不需要很厉害才能开始，只要开始就会变厉害。",
    "今天的天空格外蓝，适合发一会儿呆。",
    "把开心的小事记下来，日子会变甜。",
    "偶尔摸鱼，是为了更好地游回岸边。",
    "你已经很努力了，休息一下也没关系的。",
    "阳光、青草、还有你，刚刚好。",
    "把今天过成自己喜欢的样子就好。",
  ];

  const WEATHER_SVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="9" r="4" fill="var(--primary)"/>
    <g stroke="var(--text-soft)" stroke-width="1.6" stroke-linecap="round"><line x1="9" y1="1.5" x2="9" y2="4"/><line x1="1.5" y1="9" x2="4" y2="9"/><line x1="3.5" y1="3.5" x2="5" y2="5"/><line x1="14.5" y1="3.5" x2="13" y2="5"/></g>
    <path d="M8 19h9a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6-1.2A4 4 0 0 0 8 19z" fill="var(--surface2)" stroke="var(--text-soft)" stroke-width="1.4"/></svg>`;

  function greeting(h) {
    if (h >= 5 && h < 11) return "早安";
    if (h >= 11 && h < 18) return "午安";
    return "晚安";
  }

  App.modules.home = {
    render(view) {
      const s = App.data.settings;
      const nick = s.nickname ? s.nickname : "朋友";
      const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      const wrap = document.createElement("div");
      wrap.className = "home";
      // 默认背景图（CSS 已设置）、用户自定壁纸覆盖默认
      if (s.wallpaper) {
        wrap.style.backgroundImage = `url('${s.wallpaper}')`;
        wrap.style.backgroundSize = "cover";
        wrap.style.backgroundColor = "transparent";
      }
      wrap.innerHTML = `
        <div class="h-greet" id="hGreet"></div>
        <div class="h-clock" id="hClock">00:00:00</div>
        <div class="h-date" id="hDate"></div>
        <div class="h-weather">${WEATHER_SVG}<span>26°C · 晴 · 微风（示例）</span></div>
        <div class="h-quote">「${App.util.escape(quote)}」</div>
        <div class="h-phone" id="phoneTip"></div>
      `;
      view.appendChild(wrap);

      // 显示「当前访问地址」：局域网部署显示内网 IP，云端部署显示公网域名，复制给手机即可
      const box = document.getElementById("phoneTip");
      const shareUrl = location.origin;
      box.innerHTML = `
        <div class="hp-label">手机 / 他人访问地址（复制此链接即可在手机打开，需服务器保持在线）</div>
        <div class="hp-row">
          <code class="hp-url">${shareUrl}</code>
          <button class="hp-copy" id="hpCopy">复制</button>
        </div>`;
      box.querySelector("#hpCopy").onclick = async () => {
        const ok = await App.ui.copyText(shareUrl);
        App.toast(ok ? "已复制访问地址" : "复制失败，请手动长按选择", ok ? "ok" : "err");
      };

      function tick() {
        const d = new Date();
        document.getElementById("hClock").textContent =
          App.util.pad(d.getHours()) + ":" + App.util.pad(d.getMinutes()) + ":" + App.util.pad(d.getSeconds());
        document.getElementById("hDate").textContent =
          App.util.fmtDate(d) + " " + App.util.weekday(d);
        document.getElementById("hGreet").textContent = greeting(d.getHours()) + "，" + nick + "～";
      }
      tick();
      App._viewTimer = setInterval(tick, 1000);
    },
  };
})();
