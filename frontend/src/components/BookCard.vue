<template>
  <div class="book-card" @click="goDetail">
    <div class="book-cover">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="book.title"
        loading="lazy"
        @error="onImgError"
      />
      <div v-else class="book-cover-placeholder">
        <span>{{ shortTitle }}</span>
      </div>
      <span class="condition-badge" :class="conditionClass">{{ book.condition }}</span>
    </div>
    <div class="book-info">
      <h3 class="book-title" :title="book.title">{{ book.title }}</h3>
      <p class="book-author" v-if="book.author">{{ book.author }}</p>
      <div class="book-meta">
        <span class="book-price">¥{{ formatPrice(book.price) }}</span>
        <span class="book-time">{{ formatTime(book.created_at) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CONDITION_TAG_CLASS } from '../constants'
import { resolveImageUrl } from '../api/request'

const props = defineProps({
  book: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const imgError = ref(false)

const coverUrl = computed(() => {
  if (imgError.value) return ''
  const imgs = parseImages(props.book.images)
  return imgs.length ? resolveImageUrl(imgs[0]) : ''
})

const shortTitle = computed(() => {
  const t = props.book.title || '二手书'
  return t.length > 8 ? t.slice(0, 8) + '…' : t
})

const conditionClass = computed(() => CONDITION_TAG_CLASS[props.book.condition] || '')

function parseImages(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const arr = JSON.parse(images)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function formatPrice(p) {
  const n = Number(p)
  return isNaN(n) ? p : n.toFixed(2)
}

function formatTime(t) {
  if (!t) return ''
  const date = new Date(t)
  const now = new Date()
  const diff = (now - date) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + '天前'
  return date.toLocaleDateString('zh-CN')
}

function goDetail() {
  router.push(`/books/${props.book.id}`)
}

function onImgError() {
  imgError.value = true
}
</script>

<style scoped>
.book-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 18px rgba(103, 194, 58, 0.18);
}

.book-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #f5f7fa;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.condition-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.book-info {
  padding: 10px 12px 12px;
}

.book-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-author {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-meta {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.book-price {
  color: #f56c6c;
  font-size: 16px;
  font-weight: 700;
}

.book-time {
  font-size: 11px;
  color: #b0b6bf;
}
</style>
