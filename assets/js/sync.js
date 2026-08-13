/* =========================================================
   同步层：客户端 ↔ 后端（端到端加密）
   - 登录会话（username/salt/authToken/encKey JWK）存本机，用于刷新后免密续连
   - 口令与密钥永不离开本机；仅密文上传
   - 冲突处理：时间戳 last-write-wins（remote.updatedAt > local 则拉取覆盖）
   - 数据变更后防抖自动上传（App.commit -> onLocalChange）
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  const SKEY = "lazyworkbench_session";

  let session = loadSession();   // {username, salt, authToken, encKeyJwk, encKey?}
  let pushTimer = null;

  function loadSession() {
    try { const s = JSON.parse(localStorage.getItem(SKEY)); return s && s.username ? s : null; }
    catch (e) { return null; }
  }
  function saveSession(s) {
    if (s) localStorage.setItem(SKEY, JSON.stringify({ username: s.username, salt: s.salt, authToken: s.authToken, encKeyJwk: s.encKeyJwk }));
    else localStorage.removeItem(SKEY);
  }

  async function api(path, opts) {
    const init = { method: (opts && opts.method) || "GET", headers: { "Content-Type": "application/json" } };
    if (opts && opts.body) init.body = JSON.stringify(opts.body);
    const r = await fetch(path + (opts && opts.q ? opts.q : ""), init);
    let data = null; try { data = await r.json(); } catch (e) {}
    if (!r.ok || (data && data.ok === false)) {
      throw new Error((data && data.error) || ("HTTP " + r.status));
    }
    return data;
  }

  async function ensureKeys() {
    if (session && !session.encKey && session.encKeyJwk) session.encKey = await App.crypto.importKey(session.encKeyJwk);
    return session;
  }

  async function register(username, passphrase) {
    const salt = App.crypto.randomSalt();
    const { encKey, authToken } = await App.crypto.deriveSession(username, passphrase, salt);
    const encKeyJwk = await App.crypto.exportKey(encKey);
    const snap = App.store.exportSnapshot();
    const { iv, ciphertext } = await App.crypto.encrypt(encKey, snap);
    const updatedAt = Date.now();
    await api("/api/register", { method: "POST", body: { username, salt: App.crypto.bufToHex(salt), authToken, updatedAt, iv, ciphertext } });
    session = { username, salt: App.crypto.bufToHex(salt), authToken, encKeyJwk, encKey };
    saveSession(session);
    App.data.settings.cloudSync = true;
    App.store.touchSync(updatedAt);
    App.save();
    return true;
  }

  async function login(username, passphrase) {
    const meta = await api("/api/meta?u=" + encodeURIComponent(username));
    if (!meta.exists) throw new Error("账号不存在，请先创建同步账号");
    const salt = App.crypto.hexToBuf(meta.salt);
    const { encKey, authToken } = await App.crypto.deriveSession(username, passphrase, salt);
    await api("/api/login", { method: "POST", body: { username, authToken } });   // 校验口令
    const encKeyJwk = await App.crypto.exportKey(encKey);
    session = { username, salt: meta.salt, authToken, encKeyJwk, encKey };
    saveSession(session);
    App.data.settings.cloudSync = true;
    App.save();
    await pull();   // 登录后拉取远端数据
    return true;
  }

  async function push() {
    if (!session) return;
    await ensureKeys();
    const snap = App.store.exportSnapshot();
    const { iv, ciphertext } = await App.crypto.encrypt(session.encKey, snap);
    const updatedAt = Date.now();
    await api("/api/data", { method: "PUT", body: { username: session.username, authToken: session.authToken, updatedAt, iv, ciphertext } });
    App.store.touchSync(updatedAt);
    App.saveQuiet();
    return true;
  }

  async function pull() {
    if (!session) return { ok: false };
    await ensureKeys();
    const r = await api("/api/data?u=" + encodeURIComponent(session.username) + "&t=" + encodeURIComponent(session.authToken));
    if (!r.updatedAt) return { ok: true, skipped: true, reason: "云端暂无备份" };
    if (r.updatedAt <= (App.data.__sync.updatedAt || 0)) return { ok: true, skipped: true, reason: "本地已是最新" };
    const obj = await App.crypto.decrypt(session.encKey, r.iv, r.ciphertext);
    App.store.importSnapshot(obj);
    App.store.touchSync(r.updatedAt);
    App.save();
    return { ok: true, pulled: true };
  }

  // 变更后防抖自动上传
  function onLocalChange() {
    if (!session || !App.data.settings.cloudSync) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      push().then(() => App.updateSyncBadge && App.updateSyncBadge()).catch(e => App.toast("同步失败：" + e.message));
    }, 800);
  }
  function schedulePush() { onLocalChange(); }

  function isOn() { return !!(session && App.data.settings.cloudSync); }
  function currentUser() { return session ? session.username : null; }
  function hasSession() { return !!session; }

  async function viewCloud() {
    if (!session) return { size: 0, ok: false };
    await ensureKeys();
    const r = await api("/api/data?u=" + encodeURIComponent(session.username) + "&t=" + encodeURIComponent(session.authToken));
    const size = r.ciphertext ? (r.ciphertext.length / 2) : 0;   // 字节数
    return { size, updatedAt: r.updatedAt || 0, ok: true };
  }

  async function clearCloud() {
    await api("/api/data", { method: "DELETE", body: { username: session.username, authToken: session.authToken } });
    App.store.touchSync(0);
    App.save();
    return true;
  }

  function disable() {
    session = null;
    saveSession(null);
    App.data.settings.cloudSync = false;
    App.save();
  }

  // 启动：若有本机会话且开启同步，恢复密钥并后台拉取最新
  async function restore(forceRender) {
    if (!session) return { ok: false, reason: "无会话" };
    try {
      await ensureKeys();
      const res = await pull();
      App.updateSyncBadge && App.updateSyncBadge();
      if (res.pulled && forceRender) {
        const name = (location.hash.replace(/^#\/?/, "") || "home");
        App.render && App.render(name);
        App.toast("已从云端同步最新数据");
      }
      return res;
    } catch (e) {
      App.toast("云端同步异常：" + e.message);
      return { ok: false, reason: e.message };
    }
  }

  App.sync = { register, login, push, pull, onLocalChange, schedulePush, isOn, hasSession, currentUser, viewCloud, clearCloud, disable, restore, getSession: () => session };
})();
