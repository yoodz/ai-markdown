---
title: 代码结构更新日志
description: 记录 ai-markdown 项目从 src/ 迁移到 docs/ 的完整重构过程
date: 2026-03-14
---

# 代码结构更新日志（2026-03-14）

> **更新时间：** 2026-03-14  
> **影响范围：** 项目目录结构、VitePress 配置、访问路径

---

## 📋 更新概述

将项目从 `src/` 目录结构迁移到标准的 VitePress `docs/` 目录结构，以符合 VitePress 最佳实践。

---

## 🔄 主要变更

### 1. 目录结构调整

| 之前 | 现在 | 说明 |
|------|------|------|
| `src/` | `docs/` | 文章目录迁移 |
| `src/index.md` | `index.md` + `docs/index.md` | 首页分离 |
| `.vitepress/config.mts` | `.vitepress/config.mjs` | 配置文件格式变更 |

### 2. 文件迁移清单

**所有文章从 `src/` 迁移到 `docs/`：**

```
src/2026-03-13-religion-philosophy-dialogue.md  →  docs/2026-03-13-religion-philosophy-dialogue.md
src/blog-news-fastify-api.md                    →  docs/blog-news-fastify-api.md
src/buy-house.md                                →  docs/buy-house.md
src/daily-tech-news-2026-02-09.md               →  docs/daily-tech-news-2026-02-09.md
src/juejin-latest-articles-2026-02-09.md        →  docs/juejin-latest-articles-2026-02-09.md
src/openclaw-skill-development-guide.md         →  docs/openclaw-skill-development-guide.md
src/proxy-setup-guide.md                        →  docs/proxy-setup-guide.md
src/pve-uuid.md                                 →  docs/pve-uuid.md
src/shanghai-spring-festival-guide-2026.md      →  docs/shanghai-spring-festival-guide-2026.md
src/README.md                                   →  docs/README.md
src/index.md                                    →  docs/index.md（文章列表页）
```

**新增文件：**
```
index.md              # 网站首页（入口）
.vitepress/config.mjs # VitePress 配置（ESM 格式）
```

**删除文件：**
```
.vitepress/config.mts # 旧的 TypeScript 格式配置
```

---

## ⚙️ 配置变更

### VitePress 配置（.vitepress/config.mjs）

**关键配置项：**

```javascript
export default defineConfig({
  title: "AI Markdown",
  description: "Ai 生成的 markdown 文档集合",

  // 文档源目录
  srcDir: './docs',

  // 清理 URL（移除 .html 后缀）
  cleanUrls: 'without-subfolders',

  themeConfig: {
    // 自动生成侧边栏
    sidebar: generateSidebar({
      documentRootPath: 'docs',
      scanStartPath: '.',
      useTitleFromFileHeading: true,
      useTitleFromFrontmatter: true,
      excludePattern: ['.claude/**', 'node_modules/**', '.git/**', '.github/**', '_backup/**', '.vitepress/**', 'README.md', 'CLAUDE.md', 'index.md'],
      sortMenusByFrontmatterDate: true,
      sortMenusOrderByDescending: true
    })
  }
})
```

**核心变化：**
1. ✅ 添加 `srcDir: './docs'` 指定文档源目录
2. ✅ 使用 `vitepress-sidebar` 自动生成侧边栏
3. ✅ 按 Frontmatter 日期倒序排序（最新在前）
4. ✅ 排除不需要显示的文件（.claude、.git、README 等）

---

## 🌐 访问路径变更

| 文章 | 旧路径 | 新路径 |
|------|--------|--------|
| 首页 | `/` | `/` |
| 文章列表 | `/src/` | `/docs/`（通常不直接访问） |
| OpenClaw 技能开发 | `/src/openclaw-skill-development-guide` | `/openclaw-skill-development-guide` |
| 代理配置指南 | `/src/proxy-setup-guide` | `/proxy-setup-guide` |
| 购房指南 | `/src/buy-house` | `/buy-house` |

**注意：** 由于配置了 `cleanUrls: 'without-subfolders'`，访问路径不包含 `.html` 后缀和 `docs/` 前缀。

---

## 📦 项目结构（新）

```
ai-markdown/
├── .vitepress/
│   └── config.mjs          # VitePress 配置
├── docs/                   # 文档目录
│   ├── index.md            # 文章列表页（带搜索功能）
│   ├── README.md           # 项目说明
│   ├── 2026-03-13-religion-philosophy-dialogue.md
│   ├── blog-news-fastify-api.md
│   ├── buy-house.md
│   ├── daily-tech-news-2026-02-09.md
│   ├── juejin-latest-articles-2026-02-09.md
│   ├── openclaw-skill-development-guide.md
│   ├── proxy-setup-guide.md
│   ├── pve-uuid.md
│   └── shanghai-spring-festival-guide-2026.md
├── index.md                # 网站首页（入口）
├── package.json
├── package-lock.json
├── .gitignore
├── .dockerignore
├── CLAUDE.md
└── .claude/
```

---

## 🛠️ 受影响的外部工具

### ai-markdown-writer 技能

**更新内容：**
- ✅ 文章目录：`src/` → `docs/`
- ✅ 创建脚本：`create-article.sh` 路径更新
- ✅ 推送脚本：`push-article.sh` 路径更新

**技能位置：** `~/.openclaw/skills/ai-markdown-writer/`

---

## ✅ 验证清单

- [x] 所有文章迁移到 `docs/`
- [x] VitePress 配置更新为 `.mjs` 格式
- [x] 侧边栏自动生成（按日期排序）
- [x] 首页入口 `index.md` 创建
- [x] 文章列表页 `docs/index.md` 保留
- [x] Git 提交并推送
- [x] 外部技能配置更新

---

## 📝 Git 提交记录

```bash
commit 42dd068
Author: yoodz
Date:   Sat Mar 14 2026

    refactor: 项目结构迁移 src → docs
```

**变更统计：**
- 17 files changed
- 382 insertions(+)
- 576 deletions(-)

---

## 🎯 迁移原因

1. **符合 VitePress 标准** - 官方推荐使用 `docs/` 目录
2. **自动侧边栏** - 使用 `vitepress-sidebar` 插件自动生成导航
3. **更好的 SEO** - 清理后的 URL 更友好
4. **易于维护** - 配置更简洁，结构更清晰

---

## 🔗 相关链接

- 项目仓库：https://github.com/yoodz/ai-markdown
- 访问地址：https://am.afunny.top
- VitePress 文档：https://vitepress.dev/
- vitepress-sidebar 插件：https://github.com/kevinmarrec/vitepress-sidebar

---

_更新时间：2026-03-14_
