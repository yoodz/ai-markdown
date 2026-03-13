# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Markdown is a VitePress-based static documentation site for collecting and displaying AI-generated markdown articles. The site uses an auto-navigation plugin to automatically generate sidebar navigation from markdown files.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Directory Structure

```
ai-markdown/
├── .vitepress/
│   ├── config.mts      # Main VitePress configuration
│   ├── cache/          # VitePress build cache
│   └── dist/           # Build output
├── src/                # Source markdown files
│   └── index.md        # Home page (custom Vue component)
├── _backup/            # Backup files
└── package.json
```

### VitePress Configuration ([.vitepress/config.mts](.vitepress/config.mts))

- `srcDir: './src'` - Source files location
- Uses `@movk-repo/vitepress-plugin-auto-nav-sidebar` for automatic sidebar generation
- Titles extracted from h1 headings or frontmatter `title` field
- Excludes `.claude` and `node_modules` from navigation

### Home Page ([src/index.md](src/index.md))

The home page is a custom Vue 3 + TypeScript component that:
- Dynamically imports all markdown files using `import.meta.glob()`
- Extracts title from first h1 heading, description from frontmatter
- Provides client-side fuzzy search across titles, descriptions, and content
- Displays results in a styled table

### Adding New Documents

Place new markdown files in `src/` directory. The plugin will automatically:
1. Extract the title from h1 heading or frontmatter `title`
2. Add the document to the sidebar navigation
3. Include it in the home page listing

### Content Conventions

- Use h1 (`# Title`) for the main document title
- Optional frontmatter `description` field for document description
- Content is primarily in Chinese (zh-CN locale used for sorting)
