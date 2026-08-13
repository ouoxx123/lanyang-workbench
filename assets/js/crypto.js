/* =========================================================
   端到端加密层（浏览器内，密钥永不出本机）
   方案：
     口令 + 用户名盐 --PBKDF2(25万次,SHA-256)--> 主密钥
     主密钥 --HKDF--> encKey(AES-GCM 256) ｜ authToken(HMAC 派生密钥，服务端鉴权用)
   - 服务端仅见：salt / authToken / 密文，绝不见明文与口令
   - 派生密钥仅存于内存（登录会话），可序列化 JWK 到本机用于免密续连
   ========================================================= */
(function () {
  const App = (window.App = window.App || {});
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function bufToHex(buf) {
    const b = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
    return s;
  }
  function hexToBuf(hex) {
    const h = String(hex).toLowerCase();
    const out = new Uint8Array(h.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  }

  async function deriveSession(username, passphrase, saltBytes) {
    const baseKey = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveBits"]);
    const masterBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations: 250000, hash: "SHA-256" }, baseKey, 256);
    const masterKey = await crypto.subtle.importKey("raw", masterBits, { name: "HKDF" }, false, ["deriveKey", "deriveBits"]);
    const encKey = await crypto.subtle.deriveKey(
      { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode("lazy-enc") },
      masterKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const authBits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode("lazy-auth") },
      masterKey, 256);
    return { encKey, authToken: bufToHex(authBits) };
  }

  async function encrypt(encKey, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = enc.encode(JSON.stringify(obj));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, encKey, data);
    return { iv: bufToHex(iv), ciphertext: bufToHex(new Uint8Array(ct)) };
  }
  async function decrypt(encKey, ivHex, ctHex) {
    const iv = hexToBuf(ivHex);
    const ct = hexToBuf(ctHex);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, encKey, ct);
    return JSON.parse(dec.decode(pt));
  }
  async function exportKey(encKey) { return crypto.subtle.exportKey("jwk", encKey); }
  async function importKey(jwk) { return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]); }
  function randomSalt() { return crypto.getRandomValues(new Uint8Array(16)); }

  App.crypto = { deriveSession, encrypt, decrypt, exportKey, importKey, randomSalt, bufToHex, hexToBuf };
})();
