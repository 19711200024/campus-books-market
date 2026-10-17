/**
 * 书籍管理路由
 * GET    /api/books           - 书籍列表（含搜索/筛选/排序）
 * GET    /api/books/recommend - 推荐书籍
 * GET    /api/books/:id       - 书籍详情
 * POST   /api/books           - 发布书籍
 * PUT    /api/books/:id       - 编辑书籍
 * DELETE /api/books/:id       - 删除书籍
 * PATCH  /api/books/:id/status - 更新书籍状态
 * GET    /api/books/user/:userId - 用户书籍列表
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ========== 图片上传配置 ==========
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'book-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允许上传图片文件'));
  }
});

// 图片上传接口（单张）
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '未上传文件', data: null });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ code: 0, message: '上传成功', data: { url: imageUrl } });
});

// ========== 推荐书籍（需放在 /:id 之前，避免路由冲突）==========
router.get('/recommend', authMiddleware, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const userId = req.user.id;

    // 获取当前用户学院
    const user = db.prepare('SELECT college FROM users WHERE id = ?').get(userId);

    let books;
    if (user && user.college) {
      // 按学院匹配推荐，优先推荐同学院的书
      books = db.prepare(`
        SELECT b.*, u.nickname as seller_name, u.college as seller_college
        FROM books b
        LEFT JOIN users u ON b.seller_id = u.id
        WHERE b.status = 'on_sale' AND b.seller_id != ?
        ORDER BY CASE WHEN u.college = ? THEN 0 ELSE 1 END,
                 b.favorite_count DESC, b.created_at DESC
        LIMIT ?
      `).all(userId, user.college, limit);
    } else {
      // 无学院信息时按热度推荐
      books = db.prepare(`
        SELECT b.*, u.nickname as seller_name, u.college as seller_college
        FROM books b
        LEFT JOIN users u ON b.seller_id = u.id
        WHERE b.status = 'on_sale' AND b.seller_id != ?
        ORDER BY b.favorite_count DESC, b.created_at DESC
        LIMIT ?
      `).all(userId, limit);
    }

    // 解析 images JSON 字符串
    books = books.map(b => ({ ...b, images: JSON.parse(b.images || '[]') }));

    res.json({ code: 0, message: 'success', data: { list: books } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// ========== 书籍列表（含搜索/筛选/排序）==========
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { keyword, category, condition, sort } = req.query;
    const status = req.query.status || 'on_sale';

    // 构建 WHERE 条件
    const where = [];
    const params = [];

    if (status) {
      where.push('b.status = ?');
      params.push(status);
    }
    if (keyword) {
      where.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (category) {
      where.push('b.category = ?');
      params.push(category);
    }
    if (condition) {
      where.push('b.condition = ?');
      params.push(condition);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    // 排序
    let orderBy = 'b.created_at DESC';
    if (sort === 'price_asc') orderBy = 'b.price ASC';
    else if (sort === 'price_desc') orderBy = 'b.price DESC';
    else if (sort === 'newest') orderBy = 'b.created_at DESC';
    else if (sort === 'popular') orderBy = 'b.view_count DESC, b.favorite_count DESC';

    // 查询总数
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM books b ${whereClause}`).get(...params);
    const total = countRow.total;

    // 查询分页数据
    const offset = (page - 1) * pageSize;
    const list = db.prepare(`
      SELECT b.*, u.nickname as seller_name, u.college as seller_college
      FROM books b
      LEFT JOIN users u ON b.seller_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    // 解析 images JSON
    const parsedList = list.map(b => ({ ...b, images: JSON.parse(b.images || '[]') }));

    res.json({
      code: 0,
      message: 'success',
      data: { list: parsedList, total, page, pageSize }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// ========== 用户书籍列表 ==========
router.get('/user/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const status = req.query.status;

    const where = ['b.seller_id = ?'];
    const params = [userId];

    if (status) {
      where.push('b.status = ?');
      params.push(status);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM books b ${whereClause}`).get(...params);
    const total = countRow.total;

    const offset = (page - 1) * pageSize;
    const list = db.prepare(`
      SELECT b.*, u.nickname as seller_name
      FROM books b
      LEFT JOIN users u ON b.seller_id = u.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const parsedList = list.map(b => ({ ...b, images: JSON.parse(b.images || '[]') }));

    res.json({
      code: 0,
      message: 'success',
      data: { list: parsedList, total, page, pageSize }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// ========== 书籍详情 ==========
router.get('/:id', (req, res) => {
  try {
    const book = db.prepare(`
      SELECT b.*, u.nickname as seller_name, u.college as seller_college,
             u.avatar as seller_avatar, u.credit_score as seller_credit
      FROM books b
      LEFT JOIN users u ON b.seller_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!book) {
      return res.status(404).json({ code: 404, message: '书籍不存在', data: null });
    }

    // 增加浏览量
    db.prepare('UPDATE books SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
    book.view_count += 1;

    // 解析 images JSON
    book.images = JSON.parse(book.images || '[]');

    // 分离卖家信息
    const { seller_name, seller_college, seller_avatar, seller_credit, ...bookInfo } = book;
    const seller = { nickname: seller_name, college: seller_college, avatar: seller_avatar, credit_score: seller_credit };

    res.json({ code: 0, message: 'success', data: { book: bookInfo, seller } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// ========== 发布书籍（需认证）==========
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, author, isbn, price, original_price, condition, category, course, description, images } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ code: 400, message: '书名和售价不能为空', data: null });
    }

    const imagesStr = JSON.stringify(images || []);

    const result = db.prepare(`
      INSERT INTO books (seller_id, title, author, isbn, price, original_price, condition, category, course, description, images)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, title, author || '', isbn || '', price, original_price || 0,
      condition || '八成新', category || '其他', course || '', description || '', imagesStr
    );

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
    book.images = JSON.parse(book.images || '[]');

    res.json({ code: 0, message: '发布成功', data: { book } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// ========== 编辑书籍（需认证，仅卖家）==========
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const bookId = req.params.id;
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);

    if (!book) {
      return res.status(404).json({ code: 404, message: '书籍不存在', data: null });
    }
    if (book.seller_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权编辑他人书籍', data: null });
    }

    const { title, author, isbn, price, original_price, condition, category, course, description, images } = req.body;

    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (author !== undefined) { fields.push('author = ?'); values.push(author); }
    if (isbn !== undefined) { fields.push('isbn = ?'); values.push(isbn); }
    if (price !== undefined) { fields.push('price = ?'); values.push(price); }
    if (original_price !== undefined) { fields.push('original_price = ?'); values.push(original_price); }
    if (condition !== undefined) { fields.push('condition = ?'); values.push(condition); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    if (course !== undefined) { fields.push('course = ?'); values.push(course); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (images !== undefined) { fields.push('images = ?'); values.push(JSON.stringify(images)); }

    if (fields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有需要更新的字段', data: null });
    }

    values.push(bookId);
    db.prepare(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    updated.images = JSON.parse(updated.images || '[]');

    res.json({ code: 0, message: '更新成功', data: { book: updated } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// ========== 删除书籍（需认证，仅卖家）==========
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const bookId = req.params.id;
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);

    if (!book) {
      return res.status(404).json({ code: 404, message: '书籍不存在', data: null });
    }
    if (book.seller_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权删除他人书籍', data: null });
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(bookId);
    // 同时删除相关收藏和留言
    db.prepare('DELETE FROM favorites WHERE book_id = ?').run(bookId);

    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

// ========== 更新书籍状态（需认证，仅卖家）==========
router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    const bookId = req.params.id;
    const { status } = req.body;

    if (!['on_sale', 'reserved', 'sold'].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的状态值', data: null });
    }

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) {
      return res.status(404).json({ code: 404, message: '书籍不存在', data: null });
    }
    if (book.seller_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权操作他人书籍', data: null });
    }

    db.prepare('UPDATE books SET status = ? WHERE id = ?').run(status, bookId);

    const updated = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    updated.images = JSON.parse(updated.images || '[]');

    res.json({ code: 0, message: '状态更新成功', data: { book: updated } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误: ' + err.message, data: null });
  }
});

module.exports = router;
