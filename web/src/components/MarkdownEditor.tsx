import { useState, useCallback } from "react";

interface Props {
  assetId: string;
  initialContent: string;
}

export default function MarkdownEditor({ assetId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Content: content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Speichern fehlgeschlagen");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }, [assetId, content]);

  // Simple markdown preview (rendered client-side)
  const previewHtml = simpleMarkdownToHtml(content);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? "Speichert..." : "Speichern"}
        </button>
        {saved && (
          <span style={{ color: "#48bb78", fontSize: "0.875rem", alignSelf: "center" }}>
            Gespeichert!
          </span>
        )}
        {error && (
          <span style={{ color: "#f56565", fontSize: "0.875rem", alignSelf: "center" }}>
            {error}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", minHeight: "500px" }}>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#718096", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase" }}>
            Markdown
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              height: "calc(100% - 1.5rem)",
              minHeight: "500px",
              padding: "0.75rem",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
              fontSize: "0.85rem",
              lineHeight: "1.6",
              resize: "vertical",
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#718096", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase" }}>
            Vorschau
          </div>
          <div
            className="card content-preview"
            style={{ height: "calc(100% - 1.5rem)", overflow: "auto" }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
    </div>
  );
}

function simpleMarkdownToHtml(md: string): string {
  if (!md) return "<p><em>Kein Inhalt</em></p>";

  const escaped = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  let html = escaped
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>");

  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<[hulo]/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}
