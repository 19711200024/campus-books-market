/**
 * 数据库种子数据脚本
 * 运行: npm run seed
 * 会清空现有数据并插入示例数据
 */
const bcrypt = require('bcryptjs');
const db = require('../config/database');

console.log('========== 开始插入种子数据 ==========\n');

// ========== 清空现有数据 ==========
console.log('[1/6] 清空现有数据...');
db.exec('DELETE FROM favorites');
db.exec('DELETE FROM messages');
db.exec('DELETE FROM orders');
db.exec('DELETE FROM books');
db.exec('DELETE FROM users');
// 重置自增ID
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'books', 'orders', 'messages', 'favorites')");
console.log('  完成\n');

// ========== 1. 用户数据 (5个用户) ==========
console.log('[2/6] 插入用户数据...');
const passwordHash = bcrypt.hashSync('123456', 10);

const users = [
  { username: 'alice', password: passwordHash, nickname: '爱丽丝', student_id: '2023001', college: '计算机学院', phone: '13800138001', avatar: '' },
  { username: 'bob', password: passwordHash, nickname: '鲍勃', student_id: '2023002', college: '计算机学院', phone: '13800138002', avatar: '' },
  { username: 'charlie', password: passwordHash, nickname: '查理', student_id: '2023003', college: '外国语学院', phone: '13800138003', avatar: '' },
  { username: 'david', password: passwordHash, nickname: '大卫', student_id: '2023004', college: '经济管理学院', phone: '13800138004', avatar: '' },
  { username: 'eve', password: passwordHash, nickname: '伊芙', student_id: '2023005', college: '物理学院', phone: '13800138005', avatar: '' }
];

const insertUser = db.prepare(
  'INSERT INTO users (username, password, nickname, student_id, college, phone, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

users.forEach(u => insertUser.run(u.username, u.password, u.nickname, u.student_id, u.college, u.phone, u.avatar));
console.log(`  插入了 ${users.length} 个用户\n`);

// ========== 2. 书籍数据 (15本，覆盖各分类和成色) ==========
console.log('[3/6] 插入书籍数据...');

const books = [
  // 教材类
  { seller_id: 1, title: '高等数学（第七版）上册', author: '同济大学数学系', isbn: '9787040396638', price: 18, original_price: 45, condition: '八成新', category: '教材', course: '高等数学', description: '考研数学必备教材，有少量笔记和划线，不影响使用。', images: ['https://picsum.photos/seed/gaoshu1/400/560'] },
  { seller_id: 2, title: '大学英语综合教程2', author: '李荫华', isbn: '9787544647825', price: 12, original_price: 38, condition: '九成新', category: '教材', course: '大学英语', description: '几乎全新，只写了名字。', images: ['https://picsum.photos/seed/english2/400/560'] },
  { seller_id: 1, title: '数据结构（C语言版）', author: '严蔚敏', isbn: '9787302147510', price: 20, original_price: 35, condition: '七成新', category: '教材', course: '数据结构', description: '经典教材，考研408必备，有重点标注。', images: ['https://picsum.photos/seed/datastruct/400/560'] },

  // 教辅类
  { seller_id: 3, title: '考研英语历年真题解析', author: '张剑', isbn: '9787519302233', price: 25, original_price: 59, condition: '八成新', category: '教辅', course: '考研英语', description: '黄皮书，2024版，做了2套阅读。', images: ['https://picsum.photos/seed/kaoyaneng/400/560'] },
  { seller_id: 4, title: '五年高考三年模拟 数学', author: '曲一线', isbn: '9787565146328', price: 15, original_price: 55, condition: '有破损', category: '教辅', course: '', description: '封面有磨损，内页完整，适合刷题用。', images: ['https://picsum.photos/seed/wutiaom/400/560'] },
  { seller_id: 2, title: '计算机操作系统 汤小丹版习题解析', author: '汤小丹', isbn: '9787121367606', price: 10, original_price: 28, condition: '九成新', category: '教辅', course: '操作系统', description: '408考研配套习题，基本全新。', images: ['https://picsum.photos/seed/operatingsys/400/560'] },

  // 文学类
  { seller_id: 3, title: '活着', author: '余华', isbn: '9787506365437', price: 8, original_price: 28, condition: '八成新', category: '文学', course: '', description: '余华经典代表作，品相良好。', images: ['https://picsum.photos/seed/huozhe/400/560'] },
  { seller_id: 5, title: '百年孤独', author: '加西亚·马尔克斯', isbn: '9787544253996', price: 15, original_price: 39.5, condition: '全新', category: '文学', course: '', description: '全新未拆封，南海出版公司。', images: ['https://picsum.photos/seed/hygd/400/560'] },
  { seller_id: 4, title: '三体全集（全三册）', author: '刘慈欣', isbn: '9787229069825', price: 45, original_price: 93, condition: '九成新', category: '文学', course: '', description: '三体三部曲，保存完好，无笔记。', images: ['https://picsum.photos/seed/santi/400/560'] },

  // 科技类
  { seller_id: 1, title: 'JavaScript高级程序设计（第4版）', author: 'Matt Frisbie', isbn: '9787115545381', price: 50, original_price: 99, condition: '八成新', category: '科技', course: 'Web前端开发', description: '前端红宝书，有少量书签标记。', images: ['https://picsum.photos/seed/jsbook/400/560'] },
  { seller_id: 5, title: '深入理解计算机系统（第3版）', author: 'Randal E. Bryant', isbn: '9787111544937', price: 40, original_price: 139, condition: '七成新', category: '科技', course: '计算机系统', description: 'CSAPP，计科必读，有笔记。', images: ['https://picsum.photos/seed/csapp/400/560'] },
  { seller_id: 2, title: '人工智能：一种现代的方法', author: 'Stuart Russell', isbn: '9787302565988', price: 55, original_price: 129, condition: '全新', category: '科技', course: '人工智能', description: '全新未使用，AI经典教材。', images: ['https://picsum.photos/seed/aimodern/400/560'] },

  // 考试类
  { seller_id: 3, title: '教师资格证考试综合素质（中学）', author: '中公教育', isbn: '9787519264271', price: 12, original_price: 45, condition: '八成新', category: '考试', course: '', description: '2024上半年版，用过一次。', images: ['https://picsum.photos/seed/jiaoshizg/400/560'] },
  { seller_id: 4, title: 'GRE核心词汇考法精析', author: '陈琦', isbn: '9787550451660', price: 20, original_price: 58, condition: '有破损', category: '考试', course: '', description: '再要你命3000，词汇书翻得多了些。', images: ['https://picsum.photos/seed/gre3000/400/560'] },

  // 其他类
  { seller_id: 5, title: '时间简史（插图本）', author: '史蒂芬·霍金', isbn: '9787535732309', price: 18, original_price: 45, condition: '九成新', category: '其他', course: '', description: '霍金科普经典，插图精美。', images: ['https://picsum.photos/seed/timebrief/400/560'] }
];

const insertBook = db.prepare(`
  INSERT INTO books (seller_id, title, author, isbn, price, original_price, condition, category, course, description, images, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const bookIds = [];
books.forEach(b => {
  const result = insertBook.run(
    b.seller_id, b.title, b.author, b.isbn, b.price, b.original_price,
    b.condition, b.category, b.course, b.description,
    JSON.stringify(b.images), 'on_sale'
  );
  bookIds.push(result.lastInsertRowid);
});
console.log(`  插入了 ${books.length} 本书籍\n`);

// ========== 3. 订单数据 (至少3个，不同状态) ==========
console.log('[4/6] 插入订单数据...');

// 订单1: alice(buyer) -> bob(seller) 买书1, pending待确认
// 订单2: charlie(buyer) -> alice(seller) 买书3, confirmed已确认
// 订单3: david(buyer) -> bob(seller) 买书6, completed已完成
// 订单4: eve(buyer) -> charlie(seller) 买书7, cancelled已取消

const orders = [
  { book_id: bookIds[0], buyer_id: 2, seller_id: 1, price: 18, status: 'pending', pickup_location: '图书馆门口' },
  { book_id: bookIds[2], buyer_id: 3, seller_id: 1, price: 20, status: 'confirmed', pickup_location: '计算机学院楼' },
  { book_id: bookIds[5], buyer_id: 4, seller_id: 2, price: 10, status: 'completed', pickup_location: '三食堂门口' },
  { book_id: bookIds[6], buyer_id: 5, seller_id: 3, price: 8, status: 'cancelled', pickup_location: '' }
];

const insertOrder = db.prepare(`
  INSERT INTO orders (book_id, buyer_id, seller_id, price, status, pickup_location)
  VALUES (?, ?, ?, ?, ?, ?)
`);

orders.forEach(o => {
  insertOrder.run(o.book_id, o.buyer_id, o.seller_id, o.price, o.status, o.pickup_location);
});

// 将已完成和已取消的书籍状态更新
db.prepare("UPDATE books SET status = 'sold' WHERE id = ?").run(bookIds[5]); // 第3本已售出
db.prepare("UPDATE books SET status = 'reserved' WHERE id = ?").run(bookIds[2]); // 第3本已预订

console.log(`  插入了 ${orders.length} 个订单\n`);

// ========== 4. 留言数据 (至少5条) ==========
console.log('[5/6] 插入留言数据...');

const messages = [
  { book_id: bookIds[0], sender_id: 2, receiver_id: 1, content: '你好，这本书还在吗？可以便宜点吗？', is_read: 0 },
  { book_id: bookIds[0], sender_id: 1, receiver_id: 2, content: '在的同学，已经是最低价了哦', is_read: 1 },
  { book_id: bookIds[2], sender_id: 3, receiver_id: 1, content: '请问这本书有课后答案吗？', is_read: 0 },
  { book_id: bookIds[6], sender_id: 5, receiver_id: 3, content: '你好，周末有空交易吗？', is_read: 1 },
  { book_id: bookIds[8], sender_id: 1, receiver_id: 4, content: '三体全套出吗？可以打包优惠吗？', is_read: 0 },
  { book_id: bookIds[9], sender_id: 3, receiver_id: 1, content: '这本书是最新版吗？', is_read: 1 }
];

const insertMessage = db.prepare(`
  INSERT INTO messages (book_id, sender_id, receiver_id, content, is_read)
  VALUES (?, ?, ?, ?, ?)
`);

messages.forEach(m => {
  insertMessage.run(m.book_id, m.sender_id, m.receiver_id, m.content, m.is_read);
});
console.log(`  插入了 ${messages.length} 条留言\n`);

// ========== 5. 收藏数据 (至少3条) ==========
console.log('[6/6] 插入收藏数据...');

const favorites = [
  { user_id: 2, book_id: bookIds[0] },  // bob 收藏 alice 的高数
  { user_id: 2, book_id: bookIds[8] },  // bob 收藏 david 的三体
  { user_id: 3, book_id: bookIds[1] },  // charlie 收藏 bob 的英语教材
  { user_id: 4, book_id: bookIds[10] }, // david 收藏 david 的CSAPP
  { user_id: 5, book_id: bookIds[7] }   // eve 收藏 charlie 的百年孤独
];

const insertFavorite = db.prepare(
  'INSERT INTO favorites (user_id, book_id) VALUES (?, ?)'
);

favorites.forEach(f => {
  insertFavorite.run(f.user_id, f.book_id);
});

// 更新书籍收藏数
favorites.forEach(f => {
  db.prepare('UPDATE books SET favorite_count = favorite_count + 1 WHERE id = ?').run(f.book_id);
});

console.log(`  插入了 ${favorites.length} 条收藏\n`);

// ========== 完成 ==========
console.log('========== 种子数据插入完成！==========');
console.log('\n用户账号信息：');
console.log('  用户名: alice / bob / charlie / david / eve');
console.log('  密码: 123456');
console.log(`\n统计: 用户 ${users.length} 个, 书籍 ${books.length} 本, 订单 ${orders.length} 个, 留言 ${messages.length} 条, 收藏 ${favorites.length} 条`);
