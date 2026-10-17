/**
 * 站内留言路由
 * GET   /api/messages         - 我的留言列表
 * POST  /api/messages         - 发送留言
 * PATCH /api/messages/:id/read - 标记已读
 */
const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 我的留言列表（需认证）
router.get('/', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const { book_id } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    const where = ['(m.sender_id = ? OR m.receiver_id = ?)'];
    const params = [userId, userId];

    if (book_id) {
      where.push('m.book_id = ?');
      params.push(book_id);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM messages m ${whereClause}`).get(...params);

    const list = db.prepare(`
      SELECT m.*,
             s.nickname as sender_name,
             r.nickname as receiver_name,
             b.title as book_title, b.images as book_images
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      LEFT JOIN books b ON m.book_id = b.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    // 解析 images JSON
    const parsedList = list.map(item => ({
      ...item,
      book_images: JSON.parse(item.book_images || '[]')
    }));

    // 未读消息数
    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0'
    ).get(userId).count;

    res.json({
      code: 0,
      message: 'success',
      data: { list: parsedList, total: countRow.total, page, pageSize, unread_count: unreadCount }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 发送留言（需认证）
router.post('/', authMiddleware, (req, res) => {
  try {
    const { book_id, receiver_id, content } = req.body;

    if (!book_id || !receiver_id || !content) {
      return res.status(400).json({ code: 400, message: 'book_id, receiver_id, content 不能为空', data: null });
    }

    // 检查书籍是否存在
    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(book_id);
    if (!book) {
      return res.status(404).json({ code: 404, message: '书籍不存在', data: null });
    }

    // 检查接收者是否存在
    const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_id);
    if (!receiver) {
      return res.status(404).json({ code: 404, message: '接收者不存在', data: null });
    }

    const result = db.prepare(`
      INSERT INTO messages (book_id, sender_id, receiver_id, content)
      VALUES (?, ?, ?, ?)
    `).run(book_id, req.user.id, receiver_id, content);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    res.json({ code: 0, message: '发送成功', data: { message } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 标记已读（需认证）
router.patch('/:id/read', authMiddleware, (req, res) => {
  try {
    const messageId = req.params.id;

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    if (!message) {
      return res.status(404).json({ code: 404, message: '留言不存在', data: null });
    }

    // 只有接收者可以标记已读
    if (message.receiver_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权操作', data: null });
    }

    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(messageId);

    res.json({ code: 0, message: '已标记为已读', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

module.exports = router;
