import { defineConfig } from 'vitepress'
import VitePressPluginAutoNavSidebar from '@movk-repo/vitepress-plugin-auto-nav-sidebar'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // 源文件目录
  srcDir: './src',
  title: "AI Markdown",
  description: "Ai生成的markdown文档",

  // 配置 Vite 插件
  vite: {
    plugins: [
      VitePressPluginAutoNavSidebar({
        // 从文件内容中的 h1 标签获取标题
        useTitleFromFileHeading: true,
        // 从 frontmatter 的 title 字段获取标题
        useTitleFromFrontmatter: true,
        // 排除的文件夹
        excludeFolders: ['.claude', 'node_modules'],
        // 不打印调试日志
        debugLog: false
      })
    ]
  },

  themeConfig: {
    // 手动配置导航栏，覆盖插件自动生成的
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    // 侧边栏由插件自动生成，这里留空
    sidebar: [],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
