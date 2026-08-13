---
title: 懒羊羊工作台
emoji: 🐑
colorFrom: yellow
colorTo: pink
sdk: docker
app_port: 7860
---

# 懒羊羊主题个人综合工作台

软萌治愈风的本地优先 + 端到端加密云端同步工作台。

- 纯静态前端 + 轻量 Node 后端（仅用 Node 内置模块，无第三方依赖）
- 端到端加密：服务端只存 盐 / 认证令牌 / 密文，绝不见明文
- 运行：`node server.js`（容器内默认监听 7860，由环境变量 PORT 控制）

详见 `index.html`。
