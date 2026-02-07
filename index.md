---
layout: page
---

<div class="doc-container">

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const allDocs = ref<Array<{ title: string, link: string, description?: string, content?: string }>>([])
const searchQuery = ref('')

onMounted(async () => {
  const modules = import.meta.glob('/*.md', { query: '?raw', import: 'default' })
  const fileList: Array<{ title: string, link: string, description?: string, content?: string }> = []

  for (const path in modules) {
    if (path.includes('index')) continue

    const cleanPath = path.replace(/^\//, '').replace(/\.md$/, '')
    try {
      const content = await modules[path]()
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1].trim() : cleanPath
      const descMatch = content.match(/^description:\s*(.+)$/m)
      const description = descMatch ? descMatch[1].trim() : '-'

      // 移除 frontmatter，保留正文内容用于搜索
      const cleanContent = content
        .replace(/^---[\s\S]*?---\s*/, '')  // 移除 frontmatter
        .replace(/^#+\s+.+$/gm, '')          // 移除标题
        .replace(/```[\s\S]*?```/g, '')      // 移除代码块
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除 markdown 链接语法
        .replace(/[*_`#]/g, '')              // 移除 markdown 符号
        .replace(/\s+/g, ' ')                // 合并空白
        .trim()

      fileList.push({
        title,
        link: `/${cleanPath}`,
        description,
        content: cleanContent
      })
    } catch {
      fileList.push({ title: cleanPath, link: `/${cleanPath}`, description: '-' })
    }
  }

  fileList.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  allDocs.value = fileList
})

// 高亮搜索词
const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// 模糊搜索过滤
const filteredDocs = computed(() => {
  if (!searchQuery.value.trim()) {
    return allDocs.value
  }
  const query = searchQuery.value.toLowerCase()
  return allDocs.value.filter(doc =>
    doc.title.toLowerCase().includes(query) ||
    doc.description?.toLowerCase().includes(query) ||
    doc.content?.toLowerCase().includes(query)
  )
})
</script>

<div class="search-box">
  <input
    v-model="searchQuery"
    type="text"
    placeholder="🔍 搜索文档标题、描述或内容..."
    class="search-input"
  />
  <span v-if="searchQuery" class="search-count">
    找到 {{ filteredDocs.length }} 个结果
  </span>
</div>

<table class="doc-table">
  <thead>
    <tr>
      <th>标题</th>
      <th>描述</th>
      <th>链接</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="doc in filteredDocs" :key="doc.link">
      <td><strong v-html="highlightText(doc.title, searchQuery)"></strong></td>
      <td v-html="highlightText(doc.description || '-', searchQuery)"></td>
      <td><a :href="doc.link">查看</a></td>
    </tr>
  </tbody>
</table>

<div v-if="filteredDocs.length === 0 && searchQuery" class="no-results">
  没有找到匹配的文档
</div>

</div>

<style>
.doc-container {
  padding: 2rem 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

.search-box {
  margin: 1.5rem 0;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.search-input:focus {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-count {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.doc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.doc-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.doc-table th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.doc-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.doc-table tbody tr {
  transition: all 0.2s ease;
}

.doc-table tbody tr:hover {
  background: #f9fafb;
  transform: scale(1.01);
}

.doc-table tbody tr:last-child td {
  border-bottom: none;
}

.doc-table a {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--vp-c-brand);
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.doc-table a:hover {
  background: #5b21b6;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(91, 33, 182, 0.3);
}

.doc-table :deep(.highlight) {
  background: #fef08a;
  padding: 0.1em 0.2em;
  border-radius: 3px;
  color: #854d0e;
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .doc-container {
    padding: 1rem;
  }

  .doc-table th,
  .doc-table td {
    padding: 0.75rem;
  }

  .search-count {
    position: static;
    display: block;
    transform: none;
    margin-top: 0.5rem;
    text-align: right;
  }
}
</style>
