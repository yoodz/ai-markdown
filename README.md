# AI Markdown

基于 VitePress 构建的 AI 生成 Markdown 文档站点，用于收集和展示各类技术文章与指南。

## 特性

- **VitePress 驱动** - 快速的静态站点生成
- **自动导航** - 使用插件自动生成侧边栏导航
- **全文搜索** - 首页支持标题、描述和内容的模糊搜索
- **响应式设计** - 适配桌面和移动端
- **Docker 支持** - 可容器化部署

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
ai-markdown/
├── .vitepress/          # VitePress 配置
│   └── config.mts       # 站点配置文件
├── src/                 # 源文件目录
│   ├── index.md         # 首页（含搜索功能）
│   └── *.md            # Markdown 文档
├── .gitignore
├── .dockerignore
├── package.json
└── README.md
```

## 配置说明

站点配置位于 `.vitepress/config.mts`，主要配置项：

- `srcDir: './src'` - 源文件目录
- `title: "AI Markdown"` - 站点标题
- 使用 `@movk-repo/vitepress-plugin-auto-nav-sidebar` 插件自动生成导航
- 排除 `.claude` 和 `node_modules` 目录

## 文档添加

将新的 Markdown 文件放入 `src/` 目录即可，插件会自动：
- 从文件内容的 h1 标签或 frontmatter 的 `title` 字段获取标题
- 将文档添加到侧边栏导航
- 在首页显示文档列表

## 许可

MIT
