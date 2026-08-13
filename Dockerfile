# 懒羊羊工作台 · 云端部署镜像（仅用 Node 内置模块，无需 npm install）
FROM node:18-alpine

WORKDIR /app

# 复制运行所需文件（server.js 是唯一的后端，前端为静态资源）
COPY package.json ./
COPY server.js ./
COPY index.html ./
COPY assets ./assets

# 数据持久化目录：部署时请把卷挂到 /app/server-data
RUN mkdir -p /app/server-data

# 端口由环境变量 PORT 控制（HF Spaces 默认 7860），绑定 0.0.0.0 供外部访问
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
