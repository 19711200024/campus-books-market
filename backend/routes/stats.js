/**
 * 统计/推荐路由
 * GET /api/stats/home - 首页统计数据
 */
const express = require('express');
const db = require('../config/database');

const router = express.Router();

// 首页统计数据
router.get('/home', (req, res) => {
  try {
    // 总书籍数（在售）
    const totalBooks = db.prepare("SELECT COUNT(*) as count FROM books WHERE status = 'on_sale'").get().count;

    // 总用户数
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    // 总订单数
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

    // 最新发布的书籍（最近6本）
    const recentBooks = db.prepare(`
      SELECT b.*, u.nickname as seller_name
      FROM books b
      LEFT JOIN users u ON b.seller_id = u.id
      WHERE b.status = 'on_sale'
      ORDER BY b.created_at DESC
      LIMIT 6
    `).all();

    // 解析 images JSON
    const parsedRecent = recentBooks.map(b => ({ ...b, images: JSON.parse(b.images || '[]') }));

    // 分类统计
    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM books
      WHERE status = 'on_sale'
      GROUP BY category
    `).all();

    res.json({
      code: 0,
      message: 'success',
      data: {
        total_books: totalBooks,
        total_users: totalUsers,
        total_orders: totalOrders,
        recent_books: parsedRecent,
        category_stats: categoryStats
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

module.exports = router;
