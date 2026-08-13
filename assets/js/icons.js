/* =========================================================
   懒羊羊图标库
   导航图标按需求替换为职业羊羊 PNG（按"状态"匹配）
   健身暂保留 SVG（无对应职业），
   其余辅助图标（空状态、纯羊、品牌）维持原 SVG
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  const IMG = "assets/images/sheep";

  // 羊毛（圆润云朵身体，置于脑后）
  const WOOL = `
    <g fill="var(--sheep-body)" stroke="var(--border)" stroke-width="1.5">
      <circle cx="60" cy="36" r="18"/>
      <circle cx="36" cy="52" r="17"/>
      <circle cx="84" cy="52" r="17"/>
      <circle cx="42" cy="80" r="17"/>
      <circle cx="78" cy="80" r="17"/>
      <circle cx="60" cy="74" r="20"/>
    </g>`;

  // 脸 + 耳朵 + 表情
  const HEAD = `
    <g>
      <ellipse cx="60" cy="62" rx="29" ry="27" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5"/>
      <ellipse cx="33" cy="56" rx="8" ry="12" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5" transform="rotate(-18 33 56)"/>
      <ellipse cx="87" cy="56" rx="8" ry="12" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5" transform="rotate(18 87 56)"/>
      <circle cx="50" cy="60" r="4.3" fill="#5b4a3a"/>
      <circle cx="70" cy="60" r="4.3" fill="#5b4a3a"/>
      <circle cx="51.4" cy="58.6" r="1.4" fill="#fff"/>
      <circle cx="71.4" cy="58.6" r="1.4" fill="#fff"/>
      <circle cx="43" cy="69" r="4.6" fill="#ffd2d2" opacity="0.85"/>
      <circle cx="77" cy="69" r="4.6" fill="#ffd2d2" opacity="0.85"/>
      <path d="M54 69 q6 6 12 0" fill="none" stroke="#b98b6e" stroke-width="2" stroke-linecap="round"/>
      <path d="M52 40 q8 -9 16 0" fill="var(--sheep-body)" stroke="var(--border)" stroke-width="1.5"/>
    </g>`;

  function sheepWith(prop) {
    return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${WOOL}${HEAD}${prop || ""}</svg>`;
  }

  // 把"身份身份.png"包成 <img>，统一跨主题使用
  function img(src, alt) {
    return `<img class="sheep-img" src="${src}" alt="${alt || ''}" draggable="false">`;
  }

  // 各导航道具（手绘 SVG，非 Emoji）—— 仅 fitness 没有合适职业卡，仍用 SVG
  const PROPS = {
    fitness: `<g stroke="#b98b6e" stroke-width="2.2" stroke-linecap="round"><line x1="46" y1="100" x2="74" y2="100"/><line x1="46" y1="94" x2="46" y2="106"/><line x1="74" y1="94" x2="74" y2="106"/></g><circle cx="52" cy="100" r="3" fill="var(--primary)"/><circle cx="68" cy="100" r="3" fill="var(--primary)"/>`,
  };

  // 空状态插画（保留 SVG，作为模块占位使用）
  const EMPTY = {
    todo: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="102" rx="46" ry="7" fill="var(--primary-soft)"/>
      <g fill="var(--sheep-body)" stroke="var(--border)" stroke-width="1.5">
        <ellipse cx="60" cy="80" rx="40" ry="20"/>
        <circle cx="30" cy="76" r="14"/><circle cx="92" cy="80" r="13"/>
      </g>
      <ellipse cx="86" cy="72" rx="20" ry="19" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5"/>
      <ellipse cx="74" cy="68" rx="6" ry="9" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5" transform="rotate(-20 74 68)"/>
      <path d="M80 70 q4 4 8 0" fill="none" stroke="#5b4a3a" stroke-width="2" stroke-linecap="round"/>
      <path d="M90 70 q4 4 8 0" fill="none" stroke="#5b4a3a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="83" cy="78" r="4" fill="#ffd2d2" opacity=".85"/><circle cx="95" cy="78" r="4" fill="#ffd2d2" opacity=".85"/>
      <path d="M86 78 q3 3 6 0" fill="none" stroke="#b98b6e" stroke-width="2" stroke-linecap="round"/>
      <text x="96" y="46" font-size="14" font-weight="800" fill="var(--primary-deep)">Z</text>
      <text x="103" y="36" font-size="10" font-weight="800" fill="var(--primary-deep)">z</text>
    </svg>`,
    study: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <g fill="var(--sheep-body)" stroke="var(--border)" stroke-width="1.5">
        <circle cx="60" cy="50" r="16"/><circle cx="40" cy="64" r="15"/><circle cx="80" cy="64" r="15"/>
        <circle cx="48" cy="86" r="15"/><circle cx="72" cy="86" r="15"/><circle cx="60" cy="80" r="17"/>
      </g>
      <ellipse cx="60" cy="70" rx="26" ry="24" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5"/>
      <circle cx="51" cy="68" r="3.4" fill="#5b4a3a"/><circle cx="69" cy="68" r="3.4" fill="#5b4a3a"/>
      <circle cx="44" cy="76" r="4" fill="#ffd2d2" opacity=".8"/><circle cx="76" cy="76" r="4" fill="#ffd2d2" opacity=".8"/>
      <path d="M55 78 q5 3 10 0" fill="none" stroke="#b98b6e" stroke-width="2" stroke-linecap="round"/>
      <g><path d="M40 96 l20 -6 l20 6 v8 l-20 -6 l-20 6 z" fill="#fff" stroke="#b98b6e" stroke-width="1.5"/><line x1="60" y1="90" x2="60" y2="104" stroke="#b98b6e" stroke-width="1.5"/></g>
      <text x="86" y="50" font-size="13" fill="var(--text-soft)">…</text>
    </svg>`,
    meal: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <g fill="var(--sheep-body)" stroke="var(--border)" stroke-width="1.5">
        <circle cx="60" cy="42" r="17"/><circle cx="38" cy="58" r="16"/><circle cx="82" cy="58" r="16"/>
        <circle cx="46" cy="84" r="16"/><circle cx="74" cy="84" r="16"/><circle cx="60" cy="76" r="19"/>
      </g>
      <ellipse cx="60" cy="66" rx="27" ry="25" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5"/>
      <ellipse cx="33" cy="60" rx="7" ry="11" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5" transform="rotate(-18 33 60)"/>
      <ellipse cx="87" cy="60" rx="7" ry="11" fill="var(--sheep-face)" stroke="var(--border)" stroke-width="1.5" transform="rotate(18 87 60)"/>
      <circle cx="51" cy="64" r="4" fill="#5b4a3a"/><circle cx="69" cy="64" r="4" fill="#5b4a3a"/>
      <circle cx="51.4" cy="62.6" r="1.3" fill="#fff"/><circle cx="69.4" cy="62.6" r="1.3" fill="#fff"/>
      <circle cx="44" cy="73" r="4.4" fill="#ffd2d2" opacity=".85"/><circle cx="76" cy="73" r="4.4" fill="#ffd2d2" opacity=".85"/>
      <path d="M54 73 q6 6 12 0" fill="none" stroke="#b98b6e" stroke-width="2" stroke-linecap="round"/>
      <g><path d="M48 96 h20 l-3 14 h-14 z" fill="var(--primary)" stroke="#b98b6e" stroke-width="1.5"/>
        <path d="M68 99 q8 0 8 6 q0 6 -8 6" fill="none" stroke="#b98b6e" stroke-width="1.5"/>
        <path d="M56 90 q3 -4 0 -8 M62 90 q3 -4 0 -8" fill="none" stroke="var(--text-soft)" stroke-width="1.5"/></g>
      <path d="M30 102 l6 -8 l6 8 z" fill="var(--good)" stroke="#b98b6e" stroke-width="1"/>
    </svg>`,
  };

  // 导航图标按需求映射：key -> {src, alt}（健身保留 SVG）
  const NAV_IMG = {
    home:        { src: "unemployed.png", alt: "首页" },          // 无业游民·发呆（摆烂风）
    todo:        { src: "student.png",    alt: "待办清单" },      // 学生·读书（任务清单感）
    inspiration: { src: "painter.png",    alt: "每日灵感" },      // 画家·创作
    links:       { src: "delivery.png",   alt: "快捷网站" },      // 快递员·打包（"打包链接"感）
    study:       { src: "teacher.png",    alt: "学习打卡" },      // 教师·教书
    fitness:     { src: null,             alt: "健身打卡" },      // 无对应，保留 SVG
    meal:        { src: "baker.png",      alt: "好好吃饭" },      // 烘焙师·蛋糕
    memo:        { src: "farmer.png",     alt: "备忘录" },          // 农民·稻穗（笑脸治愈）
    countdown:   { src: "police.png",     alt: "倒计时" },          // 交警·指挥
    finance:     { src: "accountant.png", alt: "简易记账" },      // 会计·算盘
    settings:    { src: "computer.png",   alt: "工作台设置" },    // 计算机·调试
  };

  function buildNav() {
    const out = {};
    Object.keys(NAV_IMG).forEach(k => {
      const cfg = NAV_IMG[k];
      if (!cfg.src) { out[k] = sheepWith(PROPS.fitness); return; }
      out[k] = img(`${IMG}/${cfg.src}`, cfg.alt);
    });
    return out;
  }

  App.icons = {
    nav: buildNav(),
    empty: EMPTY,
    // 普通常规小羊（用作头像/品牌）
    plain: sheepWith(""),
    brand: sheepWith(PROPS.fitness),
    sheepWith,
    img,
  };
})();
