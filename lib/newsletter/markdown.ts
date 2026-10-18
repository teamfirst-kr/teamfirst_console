// 뉴스레터 본문 마크다운 → HTML (웹·메일 공용). 외부 라이브러리 없이 필요한 문법만 지원한다.
// 지원: # ## ### 제목, 문단, - / 1. 목록, > 인용(콜아웃), --- 구분선, | 표 |, 이미지 ![alt](url),
//       링크 [text](url), **굵게**, `코드`. 모든 입력은 먼저 HTML 이스케이프되어 XSS를 막는다.
// mode "email"은 메일 클라이언트용 인라인 스타일을, "web"은 클래스만 붙인다 (CSS는 페이지에서).

export type MarkdownMode = "web" | "email";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "hr" }
  | { type: "image"; alt: string; src: string }
  | { type: "table"; header: string[]; rows: string[][] };

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safeUrl(url: string): string | null {
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u) || u.startsWith("/")) return escapeHtml(u);
  return null;
}

const NAVY = "#111E38";
const BLUE = "#004AAD";

const EMAIL_STYLE = {
  h1: `margin:28px 0 12px;font-size:24px;line-height:1.35;font-weight:800;letter-spacing:-0.01em;color:${NAVY};`,
  h2: `margin:34px 0 12px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:19px;line-height:1.4;font-weight:800;letter-spacing:-0.01em;color:${NAVY};`,
  h3: `margin:22px 0 8px;font-size:16px;line-height:1.5;font-weight:700;color:${NAVY};`,
  p: "margin:0 0 14px;font-size:15px;line-height:1.8;color:#1f2937;",
  ul: "margin:0 0 16px;padding-left:20px;",
  li: "margin:0 0 6px;font-size:15px;line-height:1.75;color:#1f2937;",
  quote: `margin:0 0 18px;padding:14px 18px;background:#f8fafc;border-left:3px solid ${NAVY};font-size:14px;line-height:1.75;color:#334155;`,
  hr: "border:0;border-top:1px solid #e5e7eb;margin:28px 0;",
  img: "display:block;width:100%;max-width:568px;height:auto;border-radius:4px;margin:0 0 18px;",
  table: "width:100%;border-collapse:collapse;margin:0 0 18px;font-size:13px;",
  th: `padding:9px 10px;background:#f1f5f9;color:${NAVY};text-align:left;font-weight:700;border-top:1px solid ${NAVY};border-bottom:1px solid #e5e7eb;`,
  td: "padding:9px 10px;border-bottom:1px solid #e5e7eb;color:#1f2937;line-height:1.6;vertical-align:top;",
  a: `color:${BLUE};text-decoration:underline;`,
  code: "font-family:ui-monospace,Menlo,monospace;font-size:13px;background:#f1f5f9;padding:1px 5px;border-radius:3px;",
  strong: `font-weight:700;color:${NAVY};`,
};

function attr(mode: MarkdownMode, key: keyof typeof EMAIL_STYLE): string {
  return mode === "email" ? ` style="${EMAIL_STYLE[key]}"` : ` class="nl-${key}"`;
}

// 인라인: 이미 이스케이프된 텍스트에 링크·굵게·코드 적용
function imgTag(src: string, alt: string, mode: MarkdownMode): string {
  // 메일(Outlook)은 max-width를 무시하므로 width 속성을 함께 준다
  const size = mode === "email" ? ` width="568"` : "";
  return `<img src="${src}" alt="${alt}"${size}${attr(mode, "img")}/>`;
}

export function renderInline(escaped: string, mode: MarkdownMode): string {
  let out = escaped.replace(/`([^`]+)`/g, (_m, c: string) => `<code${attr(mode, "code")}>${c}</code>`);
  // 문장 안의 이미지 ![alt](url) — 링크보다 먼저 처리
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const u = safeUrl(url.replace(/&amp;/g, "&"));
    return u ? imgTag(u, alt, mode) : "";
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    // 이스케이프 전 URL의 &는 &amp; 로 들어오므로 복원 후 검사
    const u = safeUrl(url.replace(/&amp;/g, "&"));
    return u ? `<a href="${u}"${attr(mode, "a")} target="_blank" rel="noopener noreferrer">${text}</a>` : text;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, t: string) => `<strong${attr(mode, "strong")}>${t}</strong>`);
  return out;
}

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const splitRow = (l: string) =>
    l
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      blocks.push({ type: "heading", level: h[1].length as 1 | 2 | 3, text: h[2].trim() });
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line);
    if (img) {
      blocks.push({ type: "image", alt: img[1], src: img[2] });
      i++;
      continue;
    }
    if (isTableRow(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }
    if (/^>\s?/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        q.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", lines: q });
      continue;
    }
    const ul = /^[-*]\s+(.+)$/.exec(line);
    const ol = /^\d+[.)]\s+(.+)$/.exec(line);
    if (ul || ol) {
      const ordered = !!ol;
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = ordered ? /^\d+[.)]\s+(.+)$/.exec(t) : /^[-*]\s+(.+)$/.exec(t);
        if (!m) break;
        items.push(m[1].trim());
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    // 문단: 빈 줄 전까지 이어붙임 (줄바꿈은 <br>)
    const p: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|[-*]\s|\d+[.)]\s|>|\||!\[)/.test(lines[i].trim()) && !/^(-{3,}|\*{3,})$/.test(lines[i].trim())) {
      p.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: p.join("\n") });
  }
  return blocks;
}

export function renderMarkdown(md: string, mode: MarkdownMode = "web"): string {
  const inline = (t: string) => renderInline(escapeHtml(t), mode);
  return parseMarkdown(md)
    .map((b) => {
      switch (b.type) {
        case "heading": {
          const tag = `h${b.level}` as "h1" | "h2" | "h3";
          return `<${tag}${attr(mode, tag)}>${inline(b.text)}</${tag}>`;
        }
        case "paragraph":
          return `<p${attr(mode, "p")}>${inline(b.text).replace(/\n/g, "<br/>")}</p>`;
        case "list": {
          const tag = b.ordered ? "ol" : "ul";
          return `<${tag}${attr(mode, "ul")}>${b.items.map((it) => `<li${attr(mode, "li")}>${inline(it)}</li>`).join("")}</${tag}>`;
        }
        case "quote":
          return `<blockquote${attr(mode, "quote")}>${b.lines.map(inline).join("<br/>")}</blockquote>`;
        case "hr":
          return `<hr${attr(mode, "hr")}/>`;
        case "image": {
          const src = safeUrl(b.src);
          return src ? imgTag(src, escapeHtml(b.alt), mode) : "";
        }
        case "table":
          return `<table${attr(mode, "table")}><thead><tr>${b.header.map((h) => `<th${attr(mode, "th")}>${inline(h)}</th>`).join("")}</tr></thead><tbody>${b.rows
            .map((r) => `<tr>${b.header.map((_h, ci) => `<td${attr(mode, "td")}>${inline(r[ci] ?? "")}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`;
      }
    })
    .join("\n");
}

// 목록·메일 프리헤더용 평문 요약 (마크다운 제거)
export function markdownToText(md: string, max = 160): string {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*`|_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
