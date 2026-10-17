# AI 辅助开发对话记录摘要

> 本文档记录了项目开发过程中，团队与 AI 助手（豆包/ChatGPT）的关键对话摘要，涵盖从需求分析到 Bug 修复的完整开发流程，体现 AI 在课程项目开发中的实际辅助作用。

---

## 第 1 轮：需求分析 — 确定平台核心功能

**学生：**
我们要做一个"校园二手书交易平台"，课程期末项目，4 人小组，前后端分离。现在需要帮我们梳理一下核心功能模块，列一个 MVP 范围。平台主要面向大学生买卖二手教材。

**AI：**
好的，针对校园二手书交易场景，建议 MVP 包含以下 7 个模块：

1. **用户系统**：注册、登录、个人资料、信用分
2. **书籍管理**：发布、编辑、删除、上下架
3. **浏览搜索**：列表、分类筛选、关键词搜索、详情页
4. **交易系统**：下单、订单状态流转（待确认→已确认→已完成）
5. **站内消息**：买卖双方沟通留言
6. **收藏**：收藏/取消收藏
7. **自提点**：校园内固定取货点

建议 MVP 先不做在线支付（校园场景线下自提当面交易即可），不做实时 WebSocket 聊天（站内留言够用），把精力放在核心流程闭环上。

---

## 第 2 轮：技术选型讨论 — 前后端技术栈确认

**学生：**
前端我们打算用 Vue 3，后端用 Node.js。数据库选 MySQL 还是 SQLite？我们课上学的是 MySQL，但项目不想搞太复杂。

**AI：**
这个项目强烈推荐 **SQLite + better-sqlite3**，理由：

1. **零配置**：一个 `.db` 文件就是整个数据库，不需要安装 MySQL 服务，答辩时直接拷文件就能跑；
2. **性能足够**：better-sqlite3 是同步 API，比 sqlite3 异步驱动快很多，课程项目数据量小完全够用；
3. **部署简单**：不需要单独的数据库容器，Docker 镜像一个就够；
4. **教学价值**：SQL 语法和 MySQL 基本一致，学到的知识不浪费。

前端推荐组合：**Vue 3 + Vite + Element Plus + Pinia + Vue Router**。Element Plus 的表格、表单、Dialog 组件非常适合这类管理型应用，能省大量 UI 时间。Pinia 比 Vuex 简洁，Vue 3 官方推荐。

---

## 第 3 轮：数据库设计 — 表结构讨论

**学生：**
帮我们设计一下数据库表结构。主要实体有用户、书籍、订单、消息、收藏。

**AI：**
根据需求，建议设计 5 张表：

- **users**：id, username(唯一), password(bcrypt加密), nickname, student_id, college, phone, avatar, credit_score(默认100), created_at
- **books**：id, seller_id(外键→users), title, author, isbn, price, original_price, condition, category, course, description, images(JSON数组), status(on_sale/reserved/sold), view_count, favorite_count, created_at
- **orders**：id, book_id, buyer_id, seller_id, price, status(pending/confirmed/completed/cancelled), pickup_location, created_at, completed_at
- **messages**：id, book_id, sender_id, receiver_id, content, is_read, created_at
- **favorites**：id, user_id, book_id, created_at，加 UNIQUE(user_id, book_id) 防止重复收藏

注意给高频查询字段加索引：`books(seller_id)`、`books(status)`、`orders(buyer_id)`、`orders(seller_id)` 等。

---

## 第 4 轮：JWT 认证方案 — 后端中间件设计

**学生：**
登录认证怎么做？我们用 JWT，前端存 token，每次请求带上。后端中间件怎么写？

**AI：**
JWT 认证分两步：

1. **登录/注册时签发 Token**：用 `jsonwebtoken` 包，`jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' })`，把 token 返回给前端；
2. **请求拦截中间件**：从 `Authorization: Bearer <token>` 头提取 token，`jwt.verify()` 验证，成功则把 `{ id, username }` 挂到 `req.user` 上，失败返回 401。

关键点：
- JWT_SECRET 一定要从环境变量读，不要硬编码；
- 前端把 token 存在 localStorage，Axios 请求拦截器自动带上；
- 响应拦截器如果收到 401，自动跳转登录页。

---

## 第 5 轮：API 设计 — RESTful 接口规范

**学生：**
API 接口怎么设计比较规范？我们用 RESTful 风格。

**AI：**
建议统一约定：

- Base URL：`/api`，所有接口前缀统一；
- 统一响应格式：`{ code: 0, message: "success", data: {} }`，code=0 表示成功；
- 资源用名词复数：`/api/books`、`/api/orders`、`/api/messages`；
- 操作用 HTTP 方法区分：GET 查询、POST 创建、PUT 全量更新、PATCH 部分更新、DELETE 删除；
- 需要认证的接口在路由挂载 `authMiddleware`；
- 分页用 `page` + `pageSize` query 参数，返回 `{ list, total, page, pageSize }`。

具体接口分组：auth（注册登录）、books（书籍CRUD）、favorites（收藏）、orders（订单）、messages（留言）、stats（首页统计）。

---

## 第 6 轮：前端路由守卫 — 登录拦截实现

**学生：**
前端怎么实现未登录不能访问发布、订单这些页面？Vue Router 的守卫怎么写？

**AI：**
用 Vue Router 的全局前置守卫 `beforeEach`：

```js
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')  // 未登录跳转登录页
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/')       // 已登录访问登录页则跳首页
  } else {
    next()
  }
})
```

在路由定义中给需要登录的页面加 `meta: { requiresAuth: true }`，比如发布页、订单页、收藏页、个人中心。首页和书籍详情页设为公开。

---

## 第 7 轮：书籍搜索 API — SQL 模糊查询优化

**学生：**
书籍列表的关键词搜索怎么写？要支持书名、作者、ISBN 模糊搜索，还要支持分类和成色筛选。

**AI：**
后端用 SQLite 的 `LIKE` 做模糊搜索，动态拼接 WHERE 条件：

```js
let sql = 'SELECT * FROM books WHERE status = ?'
const params = ['on_sale']

if (keyword) {
  sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)'
  const kw = `%${keyword}%`
  params.push(kw, kw, kw)
}
if (category) {
  sql += ' AND category = ?'
  params.push(category)
}
if (condition) {
  sql += ' AND condition = ?'
  params.push(condition)
}

// 排序
const sortMap = {
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  newest: 'created_at DESC',
  popular: 'favorite_count DESC'
}
sql += ` ORDER BY ${sortMap[sort] || sortMap.newest}`

// 分页
sql += ' LIMIT ? OFFSET ?'
params.push(pageSize, (page - 1) * pageSize)
```

注意用**参数化查询**（`?` 占位符）防止 SQL 注入，不要字符串拼接用户输入。

---

## 第 8 轮：图片上传 — Multer 配置

**学生：**
书籍发布需要上传多张图片，后端怎么处理？Multer 怎么配置？

**AI：**
用 Multer 做文件上传：

```js
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')  // 上传目录
  },
  filename: (req, file, cb) => {
    // 用时间戳+随机数重命名，避免冲突
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 单张5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('只允许上传图片'))
  }
})

// 路由：upload.array('images', 5) 最多5张
router.post('/upload', authMiddleware, upload.array('images', 5), (req, res) => {
  const urls = req.files.map(f => `/uploads/${f.filename}`)
  res.json({ code: 0, data: { urls } })
})
```

前端 Element Plus 用 `el-upload` 组件，配合 `http-request` 自定义上传逻辑，把返回的 URL 存到表单的 `images` 数组里。

---

## 第 9 轮：订单状态流转 — 业务逻辑设计

**学生：**
订单的状态流转怎么设计？买家下单后，卖家确认，然后完成。状态变更要做什么校验？

**AI：**
状态流转设计：

```
pending（待确认）
  ├── 卖家确认 → confirmed（已确认）
  ├── 买家取消 → cancelled（已取消）
  └── 卖家拒绝 → cancelled（已取消）

confirmed（已确认）
  ├── 双方确认完成 → completed（已完成），同时书籍状态改为 sold
  └── 任一方取消 → cancelled（已取消），同时书籍状态恢复为 on_sale

completed（已完成）— 终态，不可变更
cancelled（已取消）— 终态，不可变更
```

关键校验逻辑：
1. **防重复下单**：买家创建订单前，检查该书是否已有 `pending` 或 `confirmed` 状态的订单；
2. **权限校验**：只有卖家能把 `pending` 改成 `confirmed`，只有买家或卖家能把 `confirmed` 改成 `completed`；
3. **联动书籍状态**：订单创建成功时书籍状态改为 `reserved`（已预订），取消时恢复 `on_sale`，完成时改为 `sold`；
4. **原子操作**：订单状态更新和书籍状态更新放在同一个数据库事务中执行，防止不一致。

---

## 第 10 轮：Pinia 状态管理 — 用户状态设计

**学生：**
Pinia 里怎么管理用户登录状态？token 存 localStorage，刷新页面怎么恢复登录态？

**AI：**
创建 `useUserStore`：

```js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
  }),
  actions: {
    setLogin(token, user) {
      this.token = token
      this.userInfo = user
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
```

刷新页面时，Pinia state 会从 localStorage 初始化，登录态自动恢复。Axios 请求拦截器从 store 或 localStorage 读 token 自动带上。

---

## 第 11 轮：Bug 修复 — 跨域问题

**学生：**
前端 Vite 跑在 5173 端口，后端 Express 在 3000 端口，前端请求 API 报 CORS 错误，怎么解决？

**AI：**
两个层面解决：

**后端**：安装并启用 cors 中间件：
```js
const cors = require('cors')
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

**前端**（推荐）：在 `vite.config.js` 配置开发代理，避免跨域：
```js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

这样前端请求 `/api/xxx` 时 Vite 会自动转发到后端，浏览器层面看不到跨域。生产环境由 Nginx 反向代理，不存在跨域问题。

---

## 第 12 轮：Bug 修复 — SQLite 外键约束未生效

**学生：**
我们删除一个用户后，他发布的书籍还在数据库里，应该级联删除或者设为 NULL 才对。SQLite 的外键好像没生效。

**AI：**
SQLite 默认**不开启外键约束**，每个数据库连接都需要手动开启：

```js
// 在 database.js 初始化时加上
db.pragma('foreign_keys = ON')
```

另外，建表时外键需要指定 `ON DELETE` 行为。比如 books 表的 seller_id：

```sql
seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
```

不过对于这个业务场景，**不建议真的级联删除**用户数据。更合理的做法是：
- 删除用户前先检查他是否有在售书籍或未完成订单；
- 如果有，提示无法删除，让他先处理完；
- 如果确实要删，把他的书籍状态标记为"已下架"而不是物理删除，保留订单历史数据。

---

## 第 13 轮：前端组件封装 — 书籍卡片组件复用

**学生：**
书籍列表页和首页推荐区都用到了书籍卡片，怎么封装成可复用组件？

**AI：**
封装 `BookCard.vue` 组件，通过 props 接收书籍数据，emit 点击事件：

```vue
<template>
  <el-card class="book-card" @click="$emit('click')">
    <img :src="book.images[0] || defaultCover" class="cover" />
    <div class="info">
      <div class="title">{{ book.title }}</div>
      <div class="price">¥{{ book.price }} <del>¥{{ book.original_price }}</del></div>
      <el-tag :type="conditionTagType">{{ book.condition }}</el-tag>
    </div>
  </el-card>
</template>

<script setup>
defineProps({ book: { type: Object, required: true } })
defineEmits(['click'])
const defaultCover = '/images/default-book.png'
const conditionTagType = (c) => ({
  '全新': 'success', '九成新': '', '八成新': 'info',
  '七成新': 'warning', '有破损': 'danger'
}[c] || 'info')
</script>
```

使用时：
```vue
<BookCard v-for="b in books" :key="b.id" :book="b" @click="goDetail(b.id)" />
```

列表页、首页推荐、收藏页都复用这个组件，保持视觉统一。

---

## 第 14 轮：性能优化 — 书籍列表分页与懒加载

**学生：**
书籍列表数据多了之后页面有点卡，图片也多，怎么优化？

**AI：**
几个优化点：

1. **后端分页**：已经做了 `LIMIT/OFFSET`，确保每页只返回 10~20 条；
2. **图片懒加载**：用 Element Plus 的 `v-lazy` 指令，或原生 `loading="lazy"` 属性，图片进入视口才加载；
3. **图片压缩**：上传时后端或前端压缩图片，不要直接传 10MB 的原图；
4. **前端虚拟滚动**：如果一页 100 条以上，考虑用 `vue-virtual-scroller`，但课程项目一页 20 条够了；
5. **浏览量计数异步化**：书籍详情页的 `view_count++` 不需要实时，可以批量更新。

对于课程项目，前三点就足够了。

---

## 第 15 轮：部署问题 — Docker 容器化

**学生：**
答辩的时候要演示，我们想把项目打包成 Docker，老师一键就能跑。Dockerfile 怎么写？

**AI：**
后端 Dockerfile：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

前端 Dockerfile（多阶段构建）：

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

然后用 `docker-compose.yml` 把前后端编排在一起：

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend/data:/app/data
      - ./backend/uploads:/app/uploads
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

这样老师只要 `docker-compose up -d` 就能一键启动。

---

## 第 16 轮：演示视频准备 — 如何在 3 分钟内展示核心功能

**学生：**
我们要录一个 3-5 分钟的演示视频，重点展示什么？怎么安排节奏？

**AI：**
建议按这个节奏：

1. **开场 30 秒**：一句话说清项目是什么，痛点是什么；
2. **核心演示 2 分钟**：
   - 注册/登录（15s）
   - 浏览首页 + 搜索筛选（20s）
   - 发布一本书（20s）
   - 买家视角下单 + 卖家确认订单（25s）
   - 站内消息沟通（10s）
   - 收藏功能（10s）
3. **技术讲解 1 分钟**：快速展示项目结构、JWT 认证中间件代码、路由守卫代码；
4. **总结 30 秒**：说了什么技术栈、做了什么创新点、小组分工。

关键是**录屏时操作流畅**，提前准备好种子数据，不要现场输入等加载。用 OBS 录屏，麦克风收音清晰。

---

## AI 辅助开发总结

在整个开发过程中，AI 工具主要在以下方面提供了实质性帮助：

| 阶段 | AI 辅助内容 |
|------|------------|
| 需求分析 | 梳理 MVP 范围，划定功能边界，避免过度设计 |
| 技术选型 | 对比 SQLite vs MySQL，推荐合适的技术组合 |
| 数据库设计 | 设计表结构、外键关系、索引优化 |
| API 设计 | 制定 RESTful 规范、统一响应格式、错误码 |
| 代码生成 | JWT 中间件、Multer 配置、Pinia store、Vue Router 守卫 |
| Bug 修复 | CORS 跨域、SQLite 外键未开启等常见问题排查 |
| 部署指导 | Dockerfile、docker-compose 编写 |
| 演示准备 | 视频节奏规划、核心代码讲解要点 |

AI 并非替代开发，而是作为"随时在线的技术顾问"，在决策犹豫时提供建议、在遇到 Bug 时快速定位、在重复性工作中加速编码。团队成员在此基础上进行了大量的自主调试、功能实现和 UI 打磨。
