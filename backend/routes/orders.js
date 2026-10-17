/**
 * 订单/交易路由
 * GET   /api/orders              - 我的订单列表
 * POST  /api/orders              - 创建订单
 * PATCH /api/orders/:id/status   - 更新订单状态
 */
const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 我的订单列表（需认证）
router.get('/', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { role, status } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    const where = [];
    const params = [];

    // 按角色筛选：buyer-我买的, seller-我卖的
    if (role === 'buyer') {
      where.push('o.buyer_id = ?');
      params.push(userId);
    } else if (role === 'seller') {
      where.push('o.seller_id = ?');
      params.push(userId);
    } else {
      where.push('(o.buyer_id = ? OR o.seller_id = ?)');
      params.push(userId, userId);
    }

    if (status) {
      where.push('o.status = ?');
      params.push(status);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o ${whereClause}`).get(...params);

    const list = db.prepare(`
      SELECT o.*,
             b.title as book_title, b.images as book_images, b.condition as book_condition,
             bu.nickname as buyer_name, bu.phone as buyer_phone,
             su.nickname as seller_name, su.phone as seller_phone
      FROM orders o
      LEFT JOIN books b ON o.book_id = b.id
      LEFT JOIN users bu ON o.buyer_id = bu.id
      LEFT JOIN users su ON o.seller_id = su.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    // 解析 images JSON
    const parsedList = list.map(item => ({
      ...item,
      book_images: JSON.parse(item.book_images || '[]')
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

// 创建订单（买家发起，需认证）
router.post('/', authMiddleware, (req, res) => {
  try {
    const { book_id, pickup_location } = req.body;
    const buyerId = req.user.id;

    if (!book_id) {
      return res.status(400).json({ code: 400, message: 'book_id 不能为空', data: null });
    }

    // 检查书籍是否存在且在售
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
    if (!book) {
      return res.status(404).json({ code: 404, message: '书籍不存在', data: null });
    }
    if (book.status !== 'on_sale') {
      return res.status(400).json({ code: 400, message: '该书已不在售卖状态', data: null });
    }
    if (book.seller_id === buyerId) {
      return res.status(400).json({ code: 400, message: '不能购买自己发布的书籍', data: null });
    }

    // 创建订单
    const result = db.prepare(`
      INSERT INTO orders (book_id, buyer_id, seller_id, price, pickup_location)
      VALUES (?, ?, ?, ?, ?)
    `).run(book_id, buyerId, book.seller_id, book.price, pickup_location || '');

    // 将书籍状态改为已预订
    db.prepare("UPDATE books SET status = 'reserved' WHERE id = ?").run(book_id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);

    res.json({ code: 0, message: '订单创建成功', data: { order } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// 更新订单状态（需认证，买卖家均可操作对应状态）
router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的状态值', data: null });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在', data: null });
    }

    // 验证权限：买卖家都可以操作
    if (order.buyer_id !== userId && order.seller_id !== userId) {
      return res.status(403).json({ code: 403, message: '无权操作此订单', data: null });
    }

    // 状态流转规则：
    // seller 可操作: pending -> confirmed
    // buyer 可操作: pending -> cancelled
    // seller 可操作: confirmed -> completed
    if (status === 'confirmed' && order.seller_id !== userId) {
      return res.status(403).json({ code: 403, message: '只有卖家可以确认订单', data: null });
    }
    if (status === 'completed' && order.seller_id !== userId) {
      return res.status(403).json({ code: 403, message: '只有卖家可以完成订单', data: null });
    }
    if (status === 'cancelled' && order.buyer_id !== userId && order.seller_id !== userId) {
      return res.status(403).json({ code: 403, message: '无权取消订单', data: null });
    }

    // 更新订单状态
    if (status === 'completed') {
      db.prepare("UPDATE orders SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, orderId);
      // 书籍标记为已售出
      db.prepare("UPDATE books SET status = 'sold' WHERE id = ?").run(order.book_id);
    } else if (status === 'cancelled') {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
      // 书籍恢复在售
      db.prepare("UPDATE books SET status = 'on_sale' WHERE id = ?").run(order.book_id);
    } else {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
    }

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({ code: 0, message: '订单状态更新成功', data: { order: updated } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

module.exports = router;
