import { useState, useEffect } from "react";

interface Props {
  campaignId: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  parsing: "Brief wird analysiert...",
  planning: "Content wird geplant...",
  generating: "Assets werden generiert...",
  reviewing: "Review läuft...",
  images: "Bilder werden erstellt...",
  complete: "Fertig",
  failed: "Fehlgeschlagen",
};

export default function StatusPoller({ campaignId }: Props) {
  const [status, setStatus] = useState("...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns?id=${campaignId}`);
        if (!res.ok) return;
        const data = await res.json();
        const s = data.Status?.toLowerCase() ?? "draft";
        setStatus(s);

        if (s === "complete" || s === "failed") {
          setDone(true);
          clearInterval(interval);
          // Reload to show final state via SSR
          window.location.reload();
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [campaignId]);

  if (done) return null;

  return (
    <div
      style={{
        background: "#ebf8ff",
        border: "1px solid #bee3f8",
        borderRadius: "8px",
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#3182ce",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <span style={{ fontSize: "0.9rem", color: "#2b6cb0" }}>
        {STATUS_LABELS[status] ?? status}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
