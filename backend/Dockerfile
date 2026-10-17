# 校园二手书交易平台后端镜像
# 使用 Node 24（node:sqlite 模块无需实验标志，与本地开发一致）
FROM node:24-alpine

WORKDIR /app

# 先装依赖（利用层缓存）
COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

# 复制源码
COPY . .

# 确保数据目录和上传目录存在
RUN mkdir -p data uploads

# 容器监听端口
EXPOSE 3000

# 启动：先初始化种子数据（重建演示数据），再启动服务
CMD ["sh", "-c", "npm run seed && npm start"]
