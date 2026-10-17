/**
 * 收藏路由
 * GET    /api/favorites          - 我的收藏列表
 * POST   /api/favorites          - 添加收藏
 * DELETE /api/favorites/:bookId  - 取消收藏
 */
const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 我的收藏列表（需认证）
router.get('/', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const countRow = db.prepare(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?'
    ).get(req.user.id);

    const list = db.prepare(`
      SELECT f.id, f.created_at as favorited_at, b.*
      FROM favorites f
      LEFT JOIN books b ON f.book_id = b.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, pageSize, offset);

    // 解析 images JSON
    const parsedList = list.map(item => ({
      ...item,
      images: JSON.parse(item.images || '[]')
    }));

    res.json({
      code: 0,
      message: 'success',
      data: { list: parsedList, total: countRow.total, page, pageSize }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 添加收藏（需认证）
router.post('/', authMiddleware, (req, res) => {
  try {
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ code: 400, message: 'book_id 不能为空', data: null });
    }

    // 检查书籍是否存在
    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(book_id);
    if (!book) {
      return res.status(404).json({ code: 404, message: '书籍不存在', data: null });
    }

    // 检查是否已收藏
    const existing = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND book_id = ?'
    ).get(req.user.id, book_id);

    if (existing) {
      return res.status(400).json({ code: 400, message: '已收藏过该书', data: null });
    }

    // 添加收藏
    db.prepare('INSERT INTO favorites (user_id, book_id) VALUES (?, ?)').run(req.user.id, book_id);

    // 更新书籍收藏数
    db.prepare('UPDATE books SET favorite_count = favorite_count + 1 WHERE id = ?').run(book_id);

    res.json({ code: 0, message: '收藏成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 取消收藏（需认证）
router.delete('/:bookId', authMiddleware, (req, res) => {
  try {
    const bookId = req.params.bookId;

    const existing = db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND book_id = ?'
    ).get(req.user.id, bookId);

    if (!existing) {
      return res.status(404).json({ code: 404, message: '未收藏该书', data: null });
    }

    db.prepare('DELETE FROM favorites WHERE id = ?').run(existing.id);

    // 更新书籍收藏数
    db.prepare('UPDATE books SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?').run(bookId);

    res.json({ code: 0, message: '取消收藏成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

module.exports = router;
