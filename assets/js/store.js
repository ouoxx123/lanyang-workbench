/* =========================================================
   数据层：localStorage 持久化 + 默认数据 + 云同步占位
   策略：默认本地优先；全部数据存为一个 JSON 根对象，便于后续整包同步
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  const KEY = "lazyworkbench_v1";
  const CLOUD_KEY = "lazyworkbench_cloud_mock";

  const DEFAULT_BLOGGERS = [
    {
      id: "mizi", name: "MIZI", pos: "韩系塑形派｜瘦腿提臀",
      tags: ["韩系线条", "低冲击", "腿臀塑形"],
      style: "动作温和、局部目标清晰，站立燃脂、瘦腿、翘臀课程多。",
      suit: "新手、梨形身材、想练腿臀线条、不喜欢剧烈跳操的人。",
      ace: "7天瘦腿、7天翘臀、14天腹部塑形、30天减脂计划。",
      warn: "局部训练要配合全身运动和饮食，效果更稳。",
      line: "想瘦腿提臀、练轻盈线条，选她很顺手。",
      builtin: true,
    },
    {
      id: "ouyang", name: "欧阳春晓", pos: "体态普拉提派｜核心与肩背",
      tags: ["普拉提", "体态改善", "核心激活"],
      style: "偏普拉提、体态矫正、弹力带塑形，重视发力位置和动作控制。",
      suit: "久坐、圆肩驼背、骨盆前倾、核心弱的人。",
      ace: "直角肩少女背、腰臀比雕刻、核心激活、肩颈背放松。",
      warn: "燃脂感不如HIIT，想掉秤建议搭配有氧。",
      line: "想改善体态、练核心和气质感，选她。",
      builtin: true,
    },
    {
      id: "zhouliuye", name: "周六野 Coffee", pos: "新手友好派｜短时入门",
      tags: ["中文讲解", "低门槛", "习惯养成"],
      style: "短时训练多，腰腹、瘦腿、全身塑形、体态改善和饮食分享都有。",
      suit: "零基础、怕累、没时间、宿舍或小空间训练的人。",
      ace: "5分钟腰腹、7天塑形、瘦腿、马甲线、办公室肩颈腰背改善。",
      warn: "单节时间短，想明显变化要提高频率和组合训练。",
      line: "完全新手、先求坚持，选她最稳。",
      builtin: true,
    },
    {
      id: "hanxiaosi", name: "韩小四 April", pos: "消肿塑形派｜无痛精雕四肢",
      tags: ["无跳跃", "消水肿", "四肢塑形"],
      style: "大多无跳跃训练，侧重改善身体水肿，优化手臂、小腿、假胯宽线条，低冲击护膝。",
      suit: "容易水肿、膝盖敏感不适、新手、想要细化四肢线条人群。",
      ace: "8分钟瘦小腿、消除假胯宽、瘦手臂、晨起消水肿训练。",
      warn: "坚持配合拉伸，线条紧致效果更佳。",
      line: "消除水肿、雕刻四肢柔和线条选她。",
      builtin: true,
    },
    {
      id: "pamela", name: "帕梅拉 Pamela", pos: "精致燃脂派｜短时高效",
      tags: ["短时高效", "音乐卡点", "腹臀塑形"],
      style: "节奏快、音乐感强，腹部、臀腿、燃脂和舞蹈有氧都很有代表性。",
      ace: "10分钟腹部、20分钟全身燃脂、臀腿塑形、舞蹈有氧。",
      suit: "有一点基础、想短时间高效训练、喜欢跟音乐练的人。",
      warn: "口令讲解相对少，休息少，动作不熟时先降速。",
      line: "想练紧致线条、喜欢音乐节奏，选她。",
      builtin: true,
    },
  ];

  function defaults() {
    return {
      settings: {
        theme: "cream", nickname: "", wallpaper: "",
        waterGoal: 8, waterCup: 250, reminderInterval: 60,
        todoDefaultView: "all", cloudSync: false,
      },
      todos: [],
      inspirations: [],
      links: [],
      study: { records: {} }, // { 'YYYY-MM-DD': 积分 }
      fitness: { bloggers: DEFAULT_BLOGGERS.map(b => ({ ...b })), trainings: [], records: [], weeklyPlan: {}, period: null },
      meals: { records: [], water: {} }, // water: { 'YYYY-MM-DD': 杯数 }
      memo: { notes: [], quotes: [] },
      countdowns: [],
      finance: [],
      __sync: { updatedAt: 0 },   // 同步时间戳（LWW 冲突判定用）
    };
  }

  function load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
    if (!data || typeof data !== "object") data = defaults();
    // 补齐缺失字段
    const d = defaults();
    for (const k in d) if (!(k in data)) data[k] = d[k];
    for (const k in d.settings) if (!(k in data.settings)) data.settings[k] = d.settings[k];
    if (!data.fitness.bloggers || !data.fitness.bloggers.length) data.fitness.bloggers = d.fitness.bloggers;
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(App.data)); } catch (e) { App.toast("保存失败：" + e.message); }
  }

  App.data = load();
  App.save = save;

  /* 静默保存：写入 localStorage 但不触发同步上传（供上传前后更新时间戳用） */
  App.saveQuiet = function () {
    try { localStorage.setItem(KEY, JSON.stringify(App.data)); } catch (e) {}
  };
  function saveQuietInternal() { App.saveQuiet(); }

  /* ---------- 快照（端到端加密同步用） ---------- */
  App.store = {
    exportSnapshot() { return App.data; },
    importSnapshot(obj) {
      if (!obj || typeof obj !== "object") return;
      const d = defaults();
      const merged = d;
      for (const k in obj) {
        if (k === "__sync") { merged.__sync = obj.__sync || merged.__sync; continue; }
        merged[k] = obj[k];
      }
      // 补齐缺失的 settings 默认值
      for (const k in d.settings) if (!(k in (obj.settings || {}))) merged.settings[k] = d.settings[k];
      if (!merged.fitness.bloggers || !merged.fitness.bloggers.length) merged.fitness.bloggers = d.fitness.bloggers;
      App.data = merged;
    },
    touchSync(ts) { App.data.__sync.updatedAt = ts || Date.now(); saveQuietInternal(); },
  };

  /* ---------- 通用工具 ---------- */
  App.util = {
    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    pad(n) { return n < 10 ? "0" + n : "" + n; },
    todayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + this.pad(d.getMonth() + 1) + "-" + this.pad(d.getDate()); },
    fmtDate(d) { d = d || new Date(); return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日"; },
    fmtTime(d) { d = d || new Date(); return this.pad(d.getHours()) + ":" + this.pad(d.getMinutes()); },
    weekday(d) { const w = ["日", "一", "二", "三", "四", "五", "六"]; return "星期" + w[(d || new Date()).getDay()]; },
    // 某月日历矩阵（6 行 7 列）
    monthMatrix(year, month) {
      const first = new Date(year, month, 1);
      const startDow = first.getDay();
      const grid = [];
      const cur = new Date(year, month, 1 - startDow);
      for (let i = 0; i < 42; i++) {
        grid.push(new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + i));
      }
      return grid;
    },
    daysBetween(a, b) { // a,b: Date
      return Math.round((b - a) / 86400000);
    },
    escape(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },
    fmtBytes(b) {
      if (b < 1024) return b + " B";
      if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
      return (b / 1024 / 1024).toFixed(2) + " MB";
    },
  };
})();
