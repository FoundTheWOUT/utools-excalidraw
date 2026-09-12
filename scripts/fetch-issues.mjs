#!/usr/bin/env node
/**
 * 抓取 GitHub Issues 到本地，方便开发时离线查阅 / 交给 AI 做上下文。
 *
 * 用法:
 *   node scripts/fetch-issues.mjs [输出目录]     # 默认输出到 issues/
 *
 * 说明:
 *   - 只读公开 API，无需登录。未认证时限额 60 次/小时。
 *   - 设置 GITHUB_TOKEN 或 GH_TOKEN 环境变量可提高到 5000 次/小时。
 *   - 输出目录默认被 .gitignore 忽略，属于本地快照，可随时重新生成。
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO = "FoundTheWOUT/utools-excalidraw";
const API = `https://api.github.com/repos/${REPO}`;
const OUT = process.argv[2] || "issues";

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "utools-excalidraw-issue-fetcher",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(
      `${res.status} ${res.statusText} for ${url}\n${await res.text()}`,
    );
  }
  return { data: await res.json(), link: res.headers.get("link") || "" };
}

/** 按 Link header 自动翻页，取回全部结果。 */
async function getAll(endpoint) {
  const items = [];
  for (let page = 1; ; page += 1) {
    const sep = endpoint.includes("?") ? "&" : "?";
    const { data, link } = await get(
      `${API}${endpoint}${sep}per_page=100&page=${page}`,
    );
    items.push(...data);
    if (!link.includes('rel="next"')) return items;
  }
}

/** 生成安全的文件名片段：去掉路径分隔符等非法字符。 */
function slug(title, limit = 40) {
  return (
    title
      .replace(/[\\/:*?"<>|\r\n\t]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/-{2,}/g, "-")
      .replace(/^[\s\-.]+|[\s\-.]+$/g, "")
      .slice(0, limit)
      .replace(/^[\s\-.]+|[\s\-.]+$/g, "") || "issue"
  );
}

function table(rows) {
  if (rows.length === 0) return ["*(无)*", ""];
  const lines = [
    "| # | 标题 | 标签 | 评论 | 创建时间 |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    lines.push(
      // 只转义会破坏 markdown 链接的字符，保留中文以便阅读
      `| [${r.number}](${r.file.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29")}) | ` +
        `${r.title.replace(/\|/g, "\\|")} | ` +
        `${r.labels.join(", ") || "-"} | ${r.comments} | ${r.created_at.slice(0, 10)} |`,
    );
  }
  lines.push("");
  return lines;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const issues = await getAll("/issues?state=all&sort=created&direction=desc");
  const rows = [];

  for (const it of issues) {
    const num = it.number;
    let comments = [];
    if (it.comments > 0) {
      comments = await getAll(`/issues/${num}/comments`);
      comments.sort((a, b) => a.created_at.localeCompare(b.created_at));
    }

    const file = `${String(num).padStart(3, "0")}-${slug(it.title)}.md`;
    const kind = it.pull_request ? "PR" : "Issue";
    const stateReason = it.state_reason ? ` (${it.state_reason})` : "";

    const parts = [
      `# #${num} ${it.title}`,
      "",
      `- 类型: ${kind}`,
      `- 状态: ${it.state}${stateReason}`,
      `- 作者: @${it.user.login}`,
      `- 创建时间: ${it.created_at}`,
      `- 更新时间: ${it.updated_at}`,
      `- 关闭时间: ${it.closed_at || "-"}`,
      `- 标签: ${it.labels.map((l) => l.name).join(", ") || "-"}`,
      `- 里程碑: ${it.milestone?.title || "-"}`,
      `- 评论数: ${it.comments}`,
      `- 链接: ${it.html_url}`,
      "",
      "## 正文",
      "",
      (it.body || "*(空)*").trim(),
      "",
    ];

    if (comments.length > 0) {
      parts.push("## 评论", "");
      for (const c of comments) {
        parts.push(
          `### @${c.user.login} · ${c.created_at}`,
          "",
          (c.body || "").trim() || "*(空)*",
          "",
        );
      }
    }

    await writeFile(
      path.join(OUT, file),
      parts.join("\n").replace(/\s+$/, "") + "\n",
      "utf8",
    );

    rows.push({
      number: num,
      title: it.title,
      state: it.state,
      is_pr: Boolean(it.pull_request),
      author: it.user.login,
      created_at: it.created_at,
      updated_at: it.updated_at,
      labels: it.labels.map((l) => l.name),
      comments: it.comments,
      html_url: it.html_url,
      file,
    });
    console.log(`  #${num} ${it.state.padEnd(6)} ${it.title.slice(0, 60)}`);
  }

  await writeFile(
    path.join(OUT, "issues.json"),
    JSON.stringify(rows, null, 2) + "\n",
    "utf8",
  );

  const open = rows.filter((r) => r.state === "open" && !r.is_pr);
  const closed = rows.filter((r) => r.state === "closed" && !r.is_pr);
  const prs = rows.filter((r) => r.is_pr);

  const md = [
    "# Issues 本地快照",
    "",
    `来源: [${REPO}](https://github.com/${REPO}/issues)`,
    "由 GitHub 公开 API 抓取，仅作开发参考，权威信息以线上为准。",
    "",
    `重新抓取: \`node scripts/fetch-issues.mjs\`（快照时间 ${new Date().toISOString()}）`,
    "",
    `## 未关闭 (${open.length})`,
    "",
    ...table(open),
    `## 已关闭 (${closed.length})`,
    "",
    ...table(closed),
  ];
  if (prs.length > 0)
    md.push(`## Pull Requests (${prs.length})`, "", ...table(prs));

  await writeFile(
    path.join(OUT, "README.md"),
    md.join("\n").replace(/\s+$/, "") + "\n",
    "utf8",
  );

  console.log(
    `\n总计 ${rows.length} 条 -> ${OUT}/  (open=${open.length}, closed=${closed.length}, pr=${prs.length})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
