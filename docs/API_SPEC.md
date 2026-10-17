# 校园二手书交易平台 - API 规范文档

> 本文档是前后端开发的共享契约，前后端必须严格遵循。

## 基础信息
- Base URL: `http://localhost:3000/api`
- 数据格式: JSON
- 认证方式: Bearer Token (JWT)，在请求头 `Authorization: Bearer <token>` 中携带

## 通用响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```
- `code`: 0 表示成功，非 0 表示错误
- `message`: 提示信息
- `data`: 响应数据

## 数据模型

### User（用户）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| username | string | 用户名，唯一 |
| password | string | 密码（bcrypt 加密存储） |
| nickname | string | 昵称 |
| student_id | string | 学号 |
| college | string | 学院 |
| phone | string | 手机号 |
| avatar | string | 头像URL |
| credit_score | integer | 信用分，默认100 |
| created_at | datetime | 注册时间 |

### Book（书籍）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| seller_id | integer | 卖家用户ID |
| title | string | 书名 |
| author | string | 作者 |
| isbn | string | ISBN号 |
| price | decimal | 售价 |
| original_price | decimal | 原价 |
| condition | string | 成色：全新/九成新/八成新/七成新/有破损 |
| category | string | 分类：教材/教辅/文学/科技/考试/其他 |
| course | string | 关联课程（可选） |
| description | text | 描述 |
| images | text | 图片URL，JSON数组字符串 |
| status | string | 状态：on_sale(在售)/reserved(已预订)/sold(已售出) |
| view_count | integer | 浏览量 |
| favorite_count | integer | 收藏数 |
| created_at | datetime | 发布时间 |

### Order（订单/交易）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| book_id | integer | 书籍ID |
| buyer_id | integer | 买家ID |
| seller_id | integer | 卖家ID |
| price | decimal | 成交价格 |
| status | string | 状态：pending(待确认)/confirmed(已确认)/completed(已完成)/cancelled(已取消) |
| pickup_location | string | 自提点 |
| created_at | datetime | 创建时间 |
| completed_at | datetime | 完成时间 |

### Message（站内留言）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| book_id | integer | 关联书籍ID |
| sender_id | integer | 发送者ID |
| receiver_id | integer | 接收者ID |
| content | text | 留言内容 |
| is_read | boolean | 是否已读 |
| created_at | datetime | 发送时间 |

### Favorite（收藏）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| user_id | integer | 用户ID |
| book_id | integer | 书籍ID |
| created_at | datetime | 收藏时间 |

## API 接口列表

### 1. 用户认证

#### POST /api/auth/register
注册
```json
// 请求
{ "username": "string", "password": "string", "nickname": "string", "student_id": "string", "college": "string", "phone": "string" }
// 响应 data: { "token": "string", "user": {...} }
```

#### POST /api/auth/login
登录
```json
// 请求
{ "username": "string", "password": "string" }
// 响应 data: { "token": "string", "user": {...} }
```

#### GET /api/auth/me
获取当前用户信息（需认证）
```json
// 响应 data: { "user": {...} }
```

#### PUT /api/auth/profile
更新个人信息（需认证）
```json
// 请求
{ "nickname": "string", "college": "string", "phone": "string", "avatar": "string" }
```

### 2. 书籍管理

#### GET /api/books
书籍列表（支持筛选和排序）
- Query 参数:
  - `page`: 页码，默认1
  - `pageSize`: 每页数量，默认10
  - `keyword`: 关键词搜索（书名/作者/ISBN）
  - `category`: 分类筛选
  - `condition`: 成色筛选
  - `sort`: 排序方式：price_asc/price_desc/newest/popular，默认newest
  - `status`: 状态筛选，默认on_sale
```json
// 响应 data: { "list": [...], "total": 100, "page": 1, "pageSize": 10 }
```

#### GET /api/books/:id
书籍详情
```json
// 响应 data: { "book": {...}, "seller": {...} }
```

#### POST /api/books
发布书籍（需认证）
```json
// 请求
{ "title": "string", "author": "string", "isbn": "string", "price": 0, "original_price": 0, "condition": "string", "category": "string", "course": "string", "description": "string", "images": ["url1", "url2"] }
```

#### PUT /api/books/:id
编辑书籍（需认证，仅卖家）
```json
// 请求：同发布，字段可选
```

#### DELETE /api/books/:id
删除书籍（需认证，仅卖家）

#### PATCH /api/books/:id/status
更新书籍状态（需认证，仅卖家）
```json
// 请求
{ "status": "on_sale|reserved|sold" }
```

#### GET /api/books/user/:userId
获取某用户发布的书籍
- Query: `page`, `pageSize`, `status`

### 3. 收藏

#### GET /api/favorites
我的收藏列表（需认证）
- Query: `page`, `pageSize`

#### POST /api/favorites
添加收藏（需认证）
```json
// 请求
{ "book_id": 1 }
```

#### DELETE /api/favorites/:bookId
取消收藏（需认证）

### 4. 订单/交易

#### GET /api/orders
我的订单列表（需认证）
- Query: `role`: buyer/seller（默认全部）, `status`, `page`, `pageSize`

#### POST /api/orders
创建订单（买家发起，需认证）
```json
// 请求
{ "book_id": 1, "pickup_location": "string" }
```

#### PATCH /api/orders/:id/status
更新订单状态（需认证，买卖家均可操作对应状态）
```json
// 请求
{ "status": "confirmed|completed|cancelled" }
```

### 5. 站内留言

#### GET /api/messages
我的留言列表（需认证）
- Query: `book_id`（可选，按书籍筛选）, `page`, `pageSize`

#### POST /api/messages
发送留言（需认证）
```json
// 请求
{ "book_id": 1, "receiver_id": 2, "content": "string" }
```

#### PATCH /api/messages/:id/read
标记已读（需认证）

### 6. 统计/推荐

#### GET /api/stats/home
首页统计数据
```json
// 响应 data: { "total_books": 0, "total_users": 0, "total_orders": 0, "recent_books": [...] }
```

#### GET /api/books/recommend
推荐书籍（按用户学院/课程匹配，需认证，可选）
- Query: `limit`: 默认6

## 错误码
| code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或token失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
