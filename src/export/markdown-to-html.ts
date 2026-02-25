/**
 * Simple Markdown-to-HTML converter covering the structures we generate.
 * No external dependency needed — handles headers, bold/italic, lists, tables,
 * blockquotes, code blocks, inline code, horizontal rules, and checkboxes.
 */
export function markdownToHtml(md: string): string {
  let html = md
    // Code blocks (before other processing)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd()}</code></pre>`)
    // Tables
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_m, header, body) => {
      const headers = header.split("|").map((h: string) => h.trim()).filter(Boolean);
      const rows = body.trim().split("\n").map((row: string) =>
        row.split("|").map((c: string) => c.trim()).filter(Boolean)
      );
      let table = "<table><thead><tr>";
      headers.forEach((h: string) => { table += `<th>${h}</th>`; });
      table += "</tr></thead><tbody>";
      rows.forEach((row: string[]) => {
        table += "<tr>";
        row.forEach((c: string) => { table += `<td>${c}</td>`; });
        table += "</tr>";
      });
      return table + "</tbody></table>";
    })
    // Headers (h3 → h1 to avoid conflicts)
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Horizontal rules
    .replace(/^---+$/gm, "<hr>")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Checkboxes
    .replace(/^☐ (.+)$/gm, "<li>☐ $1</li>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Wrap remaining lines as paragraphs (skip already-wrapped content)
  html = html.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    if (/^<(h[1-3]|ul|ol|li|table|thead|tbody|tr|th|td|pre|code|blockquote|hr|div|img)/.test(trimmed)) return line;
    return `<p>${trimmed}</p>`;
  }).join("\n");

  // Merge adjacent blockquotes
  html = html.replace(/<\/blockquote>\n*<blockquote>/g, "<br>");

  return html;
}
