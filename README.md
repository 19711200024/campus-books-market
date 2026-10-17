# 校园二手书交易平台

> 专注于校园场景的二手教材/教辅交易 Web 应用 — 前端 Vue 3 + 后端 Express + SQLite，课程期末项目。

[![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.x-409EFF)](https://element-plus.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20 LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-0F80CC?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

## 项目简介

大学教材价格昂贵，毕业季大量书籍被当废品处理，而低年级学生又需要高价购买同款教材。**校园二手书交易平台**致力于解决这一痛点：让校园内的闲置教材在线上精准匹配供需，买卖双方通过站内消息沟通、校内自提点当面交易，实现书籍循环利用。

## 功能特性

- **用户系统**：注册/登录、JWT 认证、个人资料管理、信用分体系
- **书籍发布**：多字段发布表单、ISBN 识别填单、多图上传、成色标注
- **浏览搜索**：关键词搜索（书名/作者/ISBN）、分类筛选、成色筛选、多维度排序
- **交易系统**：在线下单、订单状态流转（待确认→已确认→已完成）、校内自提点
- **站内消息**：买卖双方留言沟通、未读提醒、按书籍维度组织
- **收藏管理**：收藏/取消收藏、收藏列表
- **智能推荐**：根据学院/课程关联推荐相关教材

## 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| Vue 3 | 前端框架，组合式 API |
| Vite | 构建工具，快速冷启动与 HMR |
| Element Plus | UI 组件库 |
| Pinia | 状态管理 |
| Vue Router 4 | 路由管理 |
| Axios | HTTP 请求库 |

### 后端
| 技术 | 说明 |
|------|------|
| Node.js | 运行时环境 |
| Express 4 | Web 框架 |
| SQLite + better-sqlite3 | 嵌入式数据库 |
| JWT (jsonwebtoken) | 无状态认证 |
| bcryptjs | 密码哈希加密 |
| Multer | 文件上传处理 |
| CORS | 跨域资源共享 |

---

## 目录结构

```
campus-books-market/
├── backend/                 # 后端服务
│   ├── config/
│   │   └── database.js       # SQLite 数据库连接与初始化
│   ├── database/
│   │   ├── schema.sql        # 建表 SQL
│   │   └── seed.js           # 种子数据脚本
│   ├── middleware/
│   │   └── auth.js           # JWT 认证中间件
│   ├── routes/               # 路由模块
│   ├── controllers/           # 业务逻辑控制器
│   ├── uploads/              # 上传图片存储目录
│   ├── data/                # SQLite 数据库文件（运行时生成）
│   ├── server.js            # 后端入口文件
│   └── package.json
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── views/           # 页面组件
│   │   ├── components/      # 公共组件
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── router/          # 路由配置
│   │   ├── api/             # API 请求封装
│   │   ├── App.vue
│   │   └── main.js
│   ├── vite.config.js        # Vite 配置（含开发代理）
│   └── package.json
├── docs/                    # 项目文档
│   ├── PROJECT_INTRO.md      # 项目介绍
│   ├── API_SPEC.md           # API 接口规范
│   ├── AI_CONVERSATION.md   # AI 辅助开发对话记录
│   ├── TEAM_CONTRIBUTION.md # 团队分工与贡献度
│   ├── DEPLOYMENT.md        # 部署指南
│   └── VIDEO_SCRIPT.md      # 演示视频脚本
└── README.md                # 本文件
```

---

## 本地启动

### 前置要求

- Node.js >= 18.x（推荐 20 LTS）
- npm >= 9.x

### 1. 启动后端

```bash
cd backend
npm install
npm run dev
```

后端运行在 `http://localhost:3000`，首次启动自动创建数据库表结构。

（可选）导入种子数据：
```bash
npm run seed
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，Vite 已配置代理，API 请求自动转发到后端。

### 3. 访问

打开浏览器访问 `http://localhost:5173` 即可。

---

## API 文档

前后端接口规范详见 [docs/API_SPEC.md](./docs/API_SPEC.md)。

Base URL: `http://localhost:3000/api`

核心接口分组：

| 模块 | 路由前缀 | 说明 |
|------|---------|------|
| 用户认证 | `/api/auth` | 注册、登录、个人信息 |
| 书籍管理 | `/api/books` | 书籍 CRUD、搜索、筛选、推荐 |
| 收藏 | `/api/favorites` | 收藏列表、添加/取消收藏 |
| 订单交易 | `/api/orders` | 下单、订单列表、状态变更 |
| 站内消息 | `/api/messages` | 留言收发、已读标记 |
| 统计 | `/api/stats` | 首页统计数据 |

---

## 更多文档

| 文档 | 说明 |
|------|------|
| [项目介绍](./docs/PROJECT_INTRO.md) | 项目背景、功能说明、技术架构 |
| [API 规范](./docs/API_SPEC.md) | 完整接口定义与数据模型 |
| [AI 辅助开发对话记录](./docs/AI_CONVERSATION.md) | 开发过程中的 AI 对话摘要 |
| [团队分工与贡献度](./docs/TEAM_CONTRIBUTION.md) | 小组成员职责与贡献占比 |
| [部署指南](./docs/DEPLOYMENT.md) | 本地/Docker/云平台部署步骤 |
| [演示视频脚本](./docs/VIDEO_SCRIPT.md) | 期末答辩演示视频分镜脚本 |

---

## 团队成员

| 成员 | 贡献度 | 主要职责 |
|------|--------|---------|
| 张明 | 35% | 后端架构、API 设计、数据库设计、部署运维 |
| 李华 | 30% | 前端架构、核心页面开发、公共组件封装 |
| 王芳 | 20% | 书籍/交易/消息模块前端、UI 优化 |
| 刘伟 | 15% | 文档编写、测试、种子数据、视频制作 |

详见 [docs/TEAM_CONTRIBUTION.md](./docs/TEAM_CONTRIBUTION.md)。

---

## 许可证

本项目为大学课程期末作业，仅供学习交流使用，不提供商业用途。
