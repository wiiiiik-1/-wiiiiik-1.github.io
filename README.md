# Wiiiiik's Notes · 手稿笔记

一个安静、纸感、适合数学公式和手写讲义的静态博客。  
使用 **Astro + Markdown + KaTeX** 构建，部署在 **GitHub Pages**。

- 站点地址：<https://wiiiiik-1.github.io/>
- 主题：Ink & Paper（米白纸张、墨色正文、朱砂强调色）
- 内容：Markdown + YAML frontmatter
- 公式：KaTeX 构建时渲染
- 部署：GitHub Actions → GitHub Pages

---

## 本地开发

需要 Node.js 20+ 和 npm。

```bash
npm install
npm run dev
```

打开终端提示的本地地址（通常是 `http://localhost:4321`）。

构建和预览：

```bash
npm run build
npm run preview
```

---

## 添加一篇新笔记

### 0. 用脚本快速新建（推荐）

```bash
npm run new -- "线性回归：从最小二乘到正规方程" linear-regression "线性回归,最小二乘,线性代数"
```

参数依次是：标题、slug、标签（逗号分隔）。  
脚本会创建：

```text
src/content/posts/linear-regression.md
public/images/linear-regression/
```

新笔记默认 `draft: true`，写完把 frontmatter 里的 `draft` 改成 `false` 就会发布。

### 1. 手动新建 Markdown

在 `src/content/posts/` 新建文件，例如：

```text
src/content/posts/2026-11-01-linear-regression.md
```

文件名会成为 URL：`/posts/2026-11-01-linear-regression/`。

### 2. 写 frontmatter

```yaml
---
title: "线性回归：从最小二乘到正规方程"
description: "一页纸梳理线性回归的模型、损失函数和闭式解。"
date: 2026-11-01
tags: ["线性回归", "最小二乘", "线性代数"]
featured: false
draft: false
lang: "zh-CN"
# pdf: "/manuscripts/linear-regression.pdf"
---
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 文章标题 |
| `description` | 是 | 首页卡片和 SEO 描述 |
| `date` | 是 | 发布日期，`YYYY-MM-DD` |
| `tags` | 否 | 标签数组，会自动生成标签页 |
| `featured` | 否 | 是否在首页作为大卡片展示 |
| `draft` | 否 | `true` 时不会出现在站点里 |
| `pdf` | 否 | 原始手稿 PDF 路径，文章底部会显示链接 |
| `lang` | 否 | 默认 `zh-CN` |

### 3. 放图片

图片放在：

```text
public/images/<slug>/
```

在 Markdown 里引用：

```markdown
![图片说明](/images/<slug>/page-01.png)
```

### 4. 本地检查

```bash
npm run dev
```

确认公式、图片、目录都正常，再提交。

---

## 部署到 GitHub Pages

### 推荐：使用用户主页仓库

创建一个公开仓库，名字必须是：

```text
wiiiiik-1.github.io
```

这样站点地址就是：

```text
https://wiiiiik-1.github.io/
```

推送后，在仓库的 **Settings → Pages → Build and deployment** 里把 Source 设为 **GitHub Actions**。  
之后每次 push 到 `main`，`.github/workflows/deploy.yml` 会自动构建并部署。

### 如果使用普通项目仓库

如果仓库名是 `lecture-notes`，站点会变成：

```text
https://wiiiiik-1.github.io/lecture-notes/
```

这时需要把 `astro.config.mjs` 的 `base` 改成 `/lecture-notes`，并把图片路径改成带 base 的形式。当前项目默认按用户主页仓库配置（`base: "/"`）。

---

## 项目结构

```text
.
├─ src/
│  ├─ components/          # Header、Footer、PostCard、Toc
│  ├─ content/posts/       # 所有 Markdown 笔记
│  ├─ layouts/             # BaseLayout、PostLayout
│  ├─ pages/               # 首页、文章、标签、归档、关于、RSS
│  ├─ styles/global.css    # Ink & Paper 主题
│  ├─ config.ts            # 站点名、导航、GitHub 地址
│  ├─ content.config.ts    # frontmatter schema
│  └─ utils.ts             # 日期、阅读时间、标签、归档
├─ public/
│  ├─ images/              # 文章图片
│  └─ favicon.svg
├─ .github/workflows/deploy.yml
├─ astro.config.mjs
└─ package.json
```

---

## 设计说明

- **纸张感**：米白底色、极淡横线、轻微纸纹渐变。
- **排版**：正文用衬线字体，UI 用无衬线字体，代码用等宽字体。
- **强调色**：朱砂红用于链接、标签、章节符号和阅读进度。
- **公式**：KaTeX 服务端渲染，不依赖客户端 MathJax。
- **暗色模式**：CSS 变量切换，首次访问跟随系统。
- **阅读体验**：右侧 sticky 目录、顶部阅读进度、上一篇/下一篇、打印样式。

---

## License

笔记内容归作者所有。主题代码可自由修改自用。
