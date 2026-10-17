/**
 * 数据库连接与初始化
 * 使用 Node.js 内置 node:sqlite（DatabaseSync），零编译，零依赖
 * 兼容 better-sqlite3 的常用 API（prepare/run/get/all/exec）
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

// 确保 data 目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const dbPath = path.join(dataDir, 'campus_books.db');

// 创建数据库连接
const rawDb = new DatabaseSync(dbPath);

// 开启外键约束（node:sqlite 没有 pragma 方法，用 exec）
rawDb.exec('PRAGMA foreign_keys = ON');

/**
 * 兼容层：包装 prepare，让 run() 返回的 lastInsertRowid 是 Number 而非 BigInt
 * 同时保持 .get()/.all()/.run() 与 better-sqlite3 一致
 */
const db = {
  prepare(sql) {
    const stmt = rawDb.prepare(sql);
    return {
      run(...params) {
        const r = stmt.run(...params);
        // node:sqlite 返回 lastInsertRowid 为 bigint，转成 Number 兼容旧代码
        return {
          changes: r.changes,
          lastInsertRowid: Number(r.lastInsertRowid),
        };
      },
      get(...params) {
        return stmt.get(...params);
      },
      all(...params) {
        return stmt.all(...params);
      },
    };
  },
  exec(sql) {
    return rawDb.exec(sql);
  },
};

/**
 * 初始化数据库表结构
 * 读取 schema.sql 并执行
 */
function initDatabase() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('[数据库] 表结构初始化完成');
}

// 启动时自动建表
initDatabase();

module.exports = db;
