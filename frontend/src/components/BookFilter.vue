<template>
  <div class="book-filter">
    <div class="filter-row">
      <span class="filter-label">分类：</span>
      <el-radio-group v-model="model.category" size="default" @change="emitChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button v-for="c in CATEGORIES" :key="c" :label="c">
          {{ c }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="filter-row">
      <span class="filter-label">成色：</span>
      <el-radio-group v-model="model.condition" size="default" @change="emitChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button v-for="c in CONDITIONS" :key="c" :label="c">
          {{ c }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="filter-row">
      <span class="filter-label">排序：</span>
      <el-select v-model="model.sort" placeholder="排序方式" @change="emitChange" style="width: 160px">
        <el-option
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup>
import { CATEGORIES, CONDITIONS, SORT_OPTIONS } from '../constants'

const props = defineProps({
  model: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['change'])

function emitChange() {
  emit('change', { ...props.model })
}
</script>

<style scoped>
.book-filter {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 14px;
  color: #606266;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .book-filter {
    padding: 12px;
  }
}
</style>
