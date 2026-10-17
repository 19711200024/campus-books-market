/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token，将用户信息挂载到 req.user
 */
const jwt = require('jsonwebtoken');

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'campus-books-market-secret-key-2024';
const JWT_EXPIRES = '7d'; // 7天有效期

/**
 * 生成 JWT Token
 * @param {object} payload - 用户信息 { id, username }
 * @returns {string} token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * 认证中间件 - 验证 Token
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未提供认证令牌',
      data: null
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({
      code: 401,
      message: '令牌无效或已过期',
      data: null
    });
  }
}

module.exports = {
  authMiddleware,
  generateToken,
  JWT_SECRET
};
