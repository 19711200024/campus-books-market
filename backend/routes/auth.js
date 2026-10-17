/**
 * 用户认证路由
 * POST /api/auth/register  - 注册
 * POST /api/auth/login     - 登录
 * GET  /api/auth/me        - 获取当前用户
 * PUT  /api/auth/profile   - 更新个人信息
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', (req, res) => {
  try {
    const { username, password, nickname, student_id, college, phone } = req.body;

    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空', data: null });
    }

    // 检查用户名是否已存在
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.json({ code: 400, message: '用户名已存在', data: null });
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 插入用户
    const result = db.prepare(
      'INSERT INTO users (username, password, nickname, student_id, college, phone) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username, hashedPassword, nickname || username, student_id || '', college || '', phone || '');

    // 生成 token
    const token = generateToken({ id: result.lastInsertRowid, username });

    // 查询用户信息（不返回密码）
    const user = db.prepare(
      'SELECT id, username, nickname, student_id, college, phone, avatar, credit_score, created_at FROM users WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.json({ code: 0, message: '注册成功', data: { token, user } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ code: 400, message: '用户名和密码不能为空', data: null });
    }

    // 查询用户
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.json({ code: 401, message: '用户名或密码错误', data: null });
    }

    // 验证密码
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.json({ code: 401, message: '用户名或密码错误', data: null });
    }

    // 生成 token
    const token = generateToken({ id: user.id, username: user.username });

    // 返回用户信息（不返回密码）
    const { password: _, ...userInfo } = user;

    res.json({ code: 0, message: '登录成功', data: { token, user: userInfo } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 获取当前用户信息（需认证）
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, nickname, student_id, college, phone, avatar, credit_score, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    res.json({ code: 0, message: 'success', data: { user } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 更新个人信息（需认证）
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const { nickname, college, phone, avatar } = req.body;
    const userId = req.user.id;

    // 动态构建更新语句
    const fields = [];
    const values = [];
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (college !== undefined) { fields.push('college = ?'); values.push(college); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }

    if (fields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有需要更新的字段', data: null });
    }

    values.push(userId);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare(
      'SELECT id, username, nickname, student_id, college, phone, avatar, credit_score, created_at FROM users WHERE id = ?'
    ).get(userId);

    res.json({ code: 0, message: '更新成功', data: { user } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

module.exports = router;
