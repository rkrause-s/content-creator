import { useState } from "react";

export default function CampaignForm() {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("de");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, language }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Kampagne konnte nicht erstellt werden");
      }

      const { campaignId } = await res.json();
      window.location.href = `/campaigns/${campaignId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="prompt">Kampagnen-Prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Beschreibe deine Kampagne... z.B. 'Erstelle eine Content-Kampagne zum Thema KI-gestützte Zusammenarbeit für IT-Entscheider im Mittelstand'"
          rows={6}
          required
          disabled={submitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="language">Sprache</label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={submitting}
        >
          <option value="de">Deutsch</option>
          <option value="en">English</option>
        </select>
      </div>

      {error && (
        <div style={{ color: "#f56565", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Wird gespeichert..." : "Kampagne starten"}
      </button>
    </form>
  );
}
