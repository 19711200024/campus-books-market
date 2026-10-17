# 部署指南

本文档涵盖校园二手书交易平台的本地开发环境搭建、Docker 容器化部署以及免费云平台部署方案。

---

## 一、环境要求

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.x（推荐 20 LTS） | 运行前后端 |
| npm | >= 9.x | 包管理 |
| Git | 任意 | 克隆代码 |
| Docker（可选） | >= 20.x | 容器化部署 |
| Docker Compose（可选） | >= 2.x | 多容器编排 |

---

## 二、本地开发环境搭建

### 2.1 克隆项目

```bash
git clone <仓库地址>
cd campus-books-market
```

### 2.2 后端启动

```bash
cd backend

# 安装依赖
npm install

# 初始化数据库（首次运行自动建表）
# 数据库文件位于 backend/data/campus_books.db

# （可选）导入种子数据
npm run seed

# 启动开发服务器
npm run dev
```

后端默认运行在 `http://localhost:3000`，API 前缀为 `/api`。

> **注意**：`better-sqlite3` 是原生模块，安装时会编译。如遇编译失败，请确保系统安装了 Python 3 和 C++ 编译工具。Windows 环境可安装 `windows-build-tools`，macOS 执行 `xcode-select --install`。

### 2.3 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端默认运行在 `http://localhost:5173`。

Vite 已配置开发代理：
- `/api` → `http://localhost:3000`
- `/uploads` → `http://localhost:3000`

因此前端开发时直接请求 `/api/xxx` 即可，无需关心跨域。

### 2.4 环境变量配置

后端在项目根目录创建 `.env` 文件：

```env
# 服务端口
PORT=3000

# JWT 密钥（生产环境务必修改为随机字符串）
JWT_SECRET=your-production-secret-key-change-me

# 前端允许的跨域来源
CORS_ORIGIN=http://localhost:5173
```

前端在 `frontend/.env.development` 和 `frontend/.env.production` 中配置：

```env
# API 基础路径
VITE_API_BASE=/api
```

---

## 三、生产环境构建

### 3.1 前端构建

```bash
cd frontend
npm run build
```

构建产物输出到 `frontend/dist/` 目录，为纯静态文件，可由 Nginx 或任意静态文件服务器托管。

### 3.2 后端启动

```bash
cd backend
NODE_ENV=production npm start
```

生产模式下 Express 直接监听 3000 端口，提供 API 服务和静态文件服务。

---

## 四、Docker 部署方案

### 4.1 项目根目录文件结构

```
campus-books-market/
├── backend/
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
└── docker-compose.yml
```

### 4.2 后端 Dockerfile

文件路径：`backend/Dockerfile`

```dockerfile
# 构建阶段
FROM node:20-alpine

WORKDIR /app

# 先复制 package 文件，利用 Docker 层缓存
COPY package*.json ./
RUN npm install --production

# 复制源码
COPY . .

# 创建数据和上传目录
RUN mkdir -p data uploads

EXPOSE 3000

# 启动时自动初始化数据库并启动服务
CMD ["node", "server.js"]
```

### 4.3 前端 Dockerfile

文件路径：`frontend/Dockerfile`

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产阶段：Nginx 托管静态文件
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4.4 Nginx 配置

文件路径：`frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        index index.html;
        # SPA 路由回退
        try_files $uri $uri/ /index.html;
    }

    # 反向代理 API 请求到后端
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 反向代理上传的图片
    location /uploads/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
    }
}
```

### 4.5 docker-compose.yml

文件路径：`docker-compose.yml`（项目根目录）

```yaml
version: '3.8'

services:
  # 后端服务
  backend:
    build: ./backend
    container_name: campus-books-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=your-production-secret-key-change-me
    volumes:
      # 持久化 SQLite 数据库文件
      - ./backend/data:/app/data
      # 持久化上传的图片
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  # 前端服务
  frontend:
    build: ./frontend
    container_name: campus-books-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 4.6 一键启动

```bash
# 在项目根目录执行
docker-compose up -d --build
```

启动后：
- 前端访问：`http://localhost`
- 后端 API：`http://localhost:3000/api`

### 4.7 常用 Docker 命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build

# 导入种子数据（在 backend 容器中执行）
docker-compose exec backend node database/seed.js
```

---

## 五、免费云平台部署指引

### 5.1 方案一：Render（推荐）

Render 免费套餐支持 Node.js 后端和静态站点托管，适合课程项目演示。

**后端部署步骤：**
1. 注册 [Render](https://render.com) 账号，连接 GitHub 仓库；
2. 选择 "New Web Service" → 连接仓库；
3. 配置：
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Environment Variables: 添加 `JWT_SECRET`、`NODE_ENV=production`
4. 点击 Deploy，等待部署完成。

> **注意**：Render 免费套餐的文件系统是临时的，重启后 SQLite 数据和上传图片会丢失。课程演示项目可接受，或挂载 Render Disk 持久化数据。

**前端部署步骤：**
1. 选择 "New Static Site" → 连接同一仓库；
2. 配置：
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
3. 在 Rewrite/Redirect 规则中添加：
   - Source: `/*` → Destination: `/index.html`（SPA 回退）
4. 前端环境变量 `VITE_API_BASE` 设置为后端 Render 服务的 API 地址。

### 5.2 方案二：Railway

1. 注册 [Railway](https://railway.app) 账号；
2. 从 GitHub 仓库新建 Project；
3. Railway 自动检测 Node.js 项目，需要在根目录配置启动命令：
   - 后端 root directory: `backend`
   - 启动命令: `node server.js`
4. 环境变量中添加 `JWT_SECRET`；
5. Railway 提供 Volume 挂载，可持久化 `data/` 和 `uploads/` 目录。

### 5.3 方案三：Vercel + 自有后端

- 前端部署到 Vercel（静态站点）；
- 后端部署到 Render / Railway 等 Node.js 平台；
- 前端 `VITE_API_BASE` 指向后端公网地址。

---

## 六、环境变量汇总

| 变量名 | 所属 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | 后端 | `3000` | 后端服务监听端口 |
| `JWT_SECRET` | 后端 | 开发用默认值 | JWT 签名密钥，生产环境必须修改 |
| `NODE_ENV` | 后端 | `development` | 运行环境（development/production） |
| `CORS_ORIGIN` | 后端 | `http://localhost:5173` | 允许跨域的前端来源 |
| `VITE_API_BASE` | 前端 | `/api` | API 请求基础路径 |

---

## 七、常见部署问题排查

### 问题 1：better-sqlite3 安装失败

**现象**：`npm install` 时报原生模块编译错误。

**解决方案**：
```bash
# 确保安装了编译工具链
# Ubuntu/Debian:
sudo apt-get install python3 make g++

# 重新安装
npm rebuild better-sqlite3
```

### 问题 2：前端构建后接口 404

**现象**：本地开发正常，部署后前端请求 API 全部 404。

**原因**：生产环境没有配置反向代理，前端请求 `/api/xxx` 被 Nginx 当作静态文件处理。

**解决方案**：确保 Nginx 配置中包含 `/api/` 的反向代理规则（见 4.4 节）。

### 问题 3：SQLite 数据库文件丢失

**现象**：容器重启后数据全部丢失。

**原因**：SQLite 数据库文件在容器内部，没有挂载 Volume 持久化。

**解决方案**：在 docker-compose.yml 中挂载 `./backend/data:/app/data` 和 `./backend/uploads:/app/uploads`（见 4.5 节）。

### 问题 4：上传图片不显示

**现象**：书籍图片上传成功，但前端无法加载。

**排查步骤**：
1. 确认 `uploads/` 目录存在且有写权限；
2. 确认 Express 静态文件中间件已配置：`app.use('/uploads', express.static('uploads'))`；
3. 确认 Nginx 反向代理了 `/uploads/` 路径；
4. 检查数据库中存储的图片路径是否以 `/uploads/` 开头。

### 问题 5：JWT Token 验证失败

**现象**：登录后请求需要认证的接口返回 401。

**排查步骤**：
1. 检查前端请求头是否携带 `Authorization: Bearer <token>`；
2. 检查后端 `JWT_SECRET` 是否与登录时签发 Token 时一致（重启服务后密钥不能变）；
3. 检查 Token 是否已过期（默认 7 天）；
4. 检查前端是否正确从响应中提取了 token 并存储。

### 问题 6：跨域 CORS 错误

**现象**：浏览器控制台报 CORS 相关错误。

**解决方案**：
- 开发环境：确保 Vite 代理配置正确（`vite.config.js` 中 proxy 规则）；
- 生产环境：确保后端启用了 `cors` 中间件，且 `origin` 配置为前端实际访问域名；
- Docker 部署：通过 Nginx 反向代理同源访问，彻底避免跨域。

---

## 八、部署检查清单

部署完成后，请逐项验证：

- [ ] 后端服务启动，`http://localhost:3000/api/stats/home` 可正常返回 JSON
- [ ] 前端页面可正常访问，首页正常加载
- [ ] 注册新用户，登录成功，Token 正确存储
- [ ] 发布一本新书，上传图片成功
- [ ] 使用另一个账号搜索到该书，下单成功
- [ ] 卖家确认订单，买家确认完成
- [ ] 站内消息可正常发送和接收
- [ ] 收藏功能正常
- [ ] 刷新页面后登录态保持
- [ ] SQLite 数据库文件和上传图片在重启后仍存在
