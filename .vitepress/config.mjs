import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'

// 生成侧边栏配置
const sidebarOptions = {
  documentRootPath: 'docs',
  scanStartPath: '.',
  useTitleFromFileHeading: true,
  useTitleFromFrontmatter: true,
  excludePattern: ['.claude/**', 'node_modules/**', '.git/**', '.github/**', '_backup/**', '.vitepress/**', 'README.md', 'CLAUDE.md', 'index.md'],
  sortMenusByFrontmatterDate: true,
  sortMenusOrderByDescending: true
}

// 生成侧边栏并处理链接格式（确保使用绝对路径）
const rawSidebar = generateSidebar(sidebarOptions)
const finalSidebar = rawSidebar.map(item => ({
  ...item,
  link: item.link.startsWith('/') ? item.link : `/${item.link}`
}))

// 调试：打印处理后的侧边栏
console.log('=== Processed Sidebar ===')
console.log(JSON.stringify(finalSidebar, null, 2))

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "AI Markdown",
  description: "Ai生成的markdown文档",

  // 文档源目录
  srcDir: './docs',

  // 清理 URL（移除 .html 后缀）
  cleanUrls: 'without-subfolders',

  themeConfig: {
    // 使用处理后的侧边栏（确保链接是绝对路径）
    sidebar: finalSidebar,

    // 文档底部导航配置
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yoodz/ai-markdown' }
    ]
  }
})
