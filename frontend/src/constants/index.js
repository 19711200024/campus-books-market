// 全局常量：分类、成色、状态映射

export const CATEGORIES = ['教材', '教辅', '文学', '科技', '考试', '其他']

export const CONDITIONS = ['全新', '九成新', '八成新', '七成新', '有破损']

// 成色 -> 标签样式 class
export const CONDITION_TAG_CLASS = {
  全新: 'condition-tag-new',
  九成新: 'condition-tag-9',
  八成新: 'condition-tag-8',
  七成新: 'condition-tag-7',
  有破损: 'condition-tag-damaged'
}

// 书籍状态中文映射
export const BOOK_STATUS_MAP = {
  on_sale: '在售',
  reserved: '已预订',
  sold: '已售出'
}

// 订单状态中文映射与颜色
export const ORDER_STATUS_MAP = {
  pending: { text: '待确认', type: 'warning' },
  confirmed: { text: '已确认', type: 'primary' },
  completed: { text: '已完成', type: 'success' },
  cancelled: { text: '已取消', type: 'info' }
}

// 排序选项
export const SORT_OPTIONS = [
  { value: 'newest', label: '最新发布' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
  { value: 'popular', label: '热度优先' }
]

// 分类图标（用 emoji 占位，避免额外图标依赖）
export const CATEGORY_ICONS = {
  教材: '📘',
  教辅: '📗',
  文学: '📕',
  科技: '📙',
  考试: '📝',
  其他: '📚'
}
