#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const postsDir = path.join(root, "src", "content", "posts");
const imagesDir = path.join(root, "public", "images");

const [titleArg, slugArg, tagsArg] = process.argv.slice(2);

const title = titleArg?.trim() || "未命名笔记";
const today = new Date().toISOString().slice(0, 10);
const slug = (slugArg?.trim() || `note-${today}`)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}-]+/gu, "-")
  .replace(/^-+|-+$/g, "");

const tags = (tagsArg ?? "未分类")
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);

if (!slug) {
  console.error("Slug 不能为空。");
  process.exit(1);
}

const postPath = path.join(postsDir, `${slug}.md`);
if (fs.existsSync(postPath)) {
  console.error(`文件已存在：${path.relative(root, postPath)}`);
  process.exit(1);
}

const yamlTitle = title.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
const yamlTags = tags.map((tag) => `"${tag.replaceAll('"', '\\"')}"`).join(", ");

const content = `---
title: "${yamlTitle}"
description: "在这里写一句话摘要，会出现在首页卡片和 SEO 描述里。"
date: ${today}
tags: [${yamlTags}]
featured: false
draft: true
lang: "zh-CN"
---

> 一句话说明这篇笔记在讲什么。写完后把 \`draft\` 改成 \`false\`，它就会出现在站点里。

## 1. 问题设定

在这里写定义、符号和问题背景。

## 2. 推导

$$
% 在这里写公式
$$

## 3. 例子

在这里放一个具体例子。

## 4. 小结

- 关键结论一
- 关键结论二
`;

fs.mkdirSync(postsDir, { recursive: true });
fs.mkdirSync(path.join(imagesDir, slug), { recursive: true });
fs.writeFileSync(path.join(imagesDir, slug, ".gitkeep"), "");
fs.writeFileSync(postPath, content, "utf8");

console.log(`\n已创建：${path.relative(root, postPath)}`);
console.log(`图片目录：${path.relative(root, path.join(imagesDir, slug))}/`);
console.log(`\n本地预览：npm run dev`);
console.log(`写完把 frontmatter 里的 draft: true 改成 false。\n`);
