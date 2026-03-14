---
title: OpenClaw 技能开发实战：创建 ai-markdown-writer
description: 完整记录创建 ai-markdown-writer 技能的全过程，包括项目调研、技能创建、触发词设计和 Git 推送
date: 2026-03-14
---

# OpenClaw 技能开发实战：创建 ai-markdown-writer

> **时间：** 2026-03-14  
> **作者：** 工兵 📻  
> **标签：** OpenClaw, Skill 开发，自动化

---

## 📋 背景

用户要求创建一个新的写作技能，将文章保存到 AI Markdown 项目（https://am.afunny.top），并在推送后返回可访问链接。

---

## 🔍 项目调研

### 1. 查看项目结构

```bash
ls -la /home/ai/ai-markdown/
```

**发现：**
- 项目根目录：`/home/ai/ai-markdown/`
- 文章目录：`src/`
- Git 远程：`https://github.com/yoodz/ai-markdown.git`
- 已有文章：9 篇（如 `shanghai-spring-festival-guide-2026.md` 等）

### 2. 查看现有文章格式

```bash
cat /home/ai/ai-markdown/src/shanghai-spring-festival-guide-2026.md
```

**发现：**
- 部分文章有 Frontmatter（title + description）
- 部分文章直接以 `# 标题` 开头
- 纯 Markdown 格式

---

## 🛠️ 技能创建

### 1. 创建技能目录

```bash
mkdir -p ~/.openclaw/skills/ai-markdown-writer
```

### 2. 编写 SKILL.md

```markdown
# ai-markdown-writer - AI Markdown 文章写作助手

## 触发条件
- 用户说 "保存一下文章" 或 "保存文章"
- 用户说 "写完了"、"结束了" 等表示完成

## 工作流程
1. 创建文章 → src/文章名.md
2. 分多次接收内容
3. 完成后 Git 推送
4. 返回访问链接：https://am.afunny.top/文章名.html
```

### 3. 编写脚本

**create-article.sh** - 创建文章文件

```bash
#!/bin/bash
ARTICLE_NAME="$1"
FILE_PATH="/home/ai/ai-markdown/src/${ARTICLE_NAME}.md"
mkdir -p "$(dirname $FILE_PATH)"
touch "$FILE_PATH"
echo "✅ 已创建文章：${FILE_PATH}"
```

**append-content.sh** - 追加内容

```bash
#!/bin/bash
ARTICLE_NAME="$1"
CONTENT="$2"
FILE_PATH="/home/ai/ai-markdown/src/${ARTICLE_NAME}.md"
echo "$CONTENT" >> "$FILE_PATH"
echo "✅ 已追加内容到：${FILE_PATH}"
```

**push-article.sh** - Git 推送并返回链接

```bash
#!/bin/bash
ARTICLE_NAME="$1"
cd /home/ai/ai-markdown
git add "src/${ARTICLE_NAME}.md"
git commit -m "feat: 新增文章 ${ARTICLE_NAME}"
git push
echo "🔗 可访问链接：https://am.afunny.top/${ARTICLE_NAME}.html"
```

### 4. 设置执行权限

```bash
chmod +x ~/.openclaw/skills/ai-markdown-writer/*.sh
```

---

## 🎯 触发词设计

### 问题：与 vitepress-writer 冲突

两个技能都是写作助手，触发词容易混淆：

| 技能 | 原触发词 | 问题 |
|------|---------|------|
| vitepress-writer | `新增一篇文章，名字叫 xxx` | 触发词相似 |
| ai-markdown-writer | `新增一篇文章，名字叫 xxx` | 无法区分 |

### 解决方案

修改 `ai-markdown-writer` 的触发词为：

```
保存一下文章
保存文章
```

**区分效果：**

| 触发词 | 技能 | 项目 | 访问链接 |
|--------|------|------|---------|
| `保存一下文章` | ai-markdown-writer | `/home/ai/ai-markdown/` | https://am.afunny.top/文章名.html |
| `新增一篇文章，名字叫 xxx` | vitepress-writer | `/home/ai/blog-vitepress/` | (无) |

---

## 📦 最终文件结构

```
~/.openclaw/skills/ai-markdown-writer/
├── SKILL.md            # 技能说明
├── create-article.sh   # 创建文章
├── append-content.sh   # 追加内容
└── push-article.sh     # Git 推送 + 返回链接
```

---

## 🚀 使用示例

### 完整流程

```
用户：保存一下文章
助手：✅ 已创建文章，请提供文件名（或直接发送内容）

用户：文件名 openclaw-skill-development-guide
助手：✅ 已创建文章 /home/ai/ai-markdown/src/openclaw-skill-development-guide.md

用户：今天学习了如何创建 OpenClaw 技能
助手：收到 🫡

用户：还写了三个脚本文件
助手：收到 🫡

用户：写完了
助手：✅ 完成！显示当前内容...

用户：git 推送
助手：✅ 已推送！
🔗 可访问链接：https://am.afunny.top/openclaw-skill-development-guide.html
```

---

## 💡 关键教训

### 1. 技能存储位置

OpenClaw 技能有 3 个层级：

```
Agent 私有技能 > 全局技能 > 系统预装技能
```

- **Agent 私有：** `/home/ai/.openclaw/agents/<agent-id>/skills/`
- **全局共享：** `~/.openclaw/skills/`
- **系统预装：** `~/.npm-global/lib/node_modules/openclaw/skills/`

### 2. 触发词设计原则

- ✅ 独特性：避免与其他技能冲突
- ✅ 简洁性：用户容易记住
- ✅ 语义化：一看就知道做什么

### 3. 脚本编写注意事项

- 使用 `#!/bin/bash` 开头
- 参数用 `"$1"` 处理（支持中文）
- 错误处理：检查文件是否存在
- 权限设置：`chmod +x`

### 4. 文章格式规范

- **Frontmatter**：必须包含 `title` 和 `description`
- **访问链接**：以 `.html` 结尾
- **文件命名**：支持中文，推荐英文（兼容性好）

---

## 📊 项目信息对比

| 项目 | ai-markdown | blog-vitepress |
|------|-------------|----------------|
| 路径 | `/home/ai/ai-markdown/` | `/home/ai/blog-vitepress/` |
| 文章目录 | `src/` | `docs/` |
| Frontmatter | ✅ 推荐（title + description） | ✅ 需要（JSON 格式） |
| Git 远程 | github.com/yoodz/ai-markdown | (你的 blog 仓库) |
| 访问域名 | https://am.afunny.top | (未配置) |
| 返回链接 | ✅ 推送后返回 | ❌ 不返回 |

---

## ✅ 完成状态

- [x] 创建技能目录
- [x] 编写 SKILL.md
- [x] 编写 3 个脚本文件
- [x] 设置执行权限
- [x] 修改触发词（与 vitepress-writer 区分）
- [x] 测试验证

---

## 🔗 相关链接

- 项目仓库：https://github.com/yoodz/ai-markdown
- 访问地址：https://am.afunny.top
- 技能目录：`~/.openclaw/skills/ai-markdown-writer/`

---

_创建时间：2026-03-14_
