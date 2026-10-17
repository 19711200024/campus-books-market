/**
 * 校园二手书交易平台 - 后端服务入口
 * Node.js + Express + SQLite
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// 初始化数据库（会自动建表）
require('./config/database');

// 引入路由
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const favoriteRoutes = require('./routes/favorites');
const orderRoutes = require('./routes/orders');
const messageRoutes = require('./routes/messages');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 中间件 ==========

// CORS 跨域允许
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// 解析 JSON 请求体
app.use(express.json());

// 日志中间件
app.use(morgan('dev'));

// 静态文件服务 - 上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== 路由挂载 ==========
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: '服务运行正常', data: { status: 'ok', time: new Date().toISOString() } });
});

// ========== 托管前端构建产物（单端口启动） ==========
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA 路由兜底：非 /api 请求都返回 index.html，交给前端路由处理
app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ========== 全局错误处理中间件 ==========
app.use((err, req, res, next) => {
  console.error('[错误]', err.message);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    data: null
  });
});

// API 404 处理
app.use('/api', (req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null });
});

// ========== 启动服务 ==========
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`  校园二手书交易平台后端服务`);
  console.log(`  端口: ${PORT}`);
  console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================`);
});

module.exports = app;
