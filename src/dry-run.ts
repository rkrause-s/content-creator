#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import type { PipelineState, CampaignBrief, ContentPlan, GeneratedAsset, ReviewResult } from "./pipeline/types.js";
import { exportCampaign } from "./pipeline/stages/export.js";
import { generatePdfs } from "./pipeline/stages/generate-pdfs.js";
import { generateImages } from "./pipeline/stages/generate-images.js";

// --- Simulated Stage 1: Parse Brief ---

const brief: CampaignBrief = {
  topic: "AI Automation von Geschäftsprozessen",
  targetAudience: "IT-Entscheider in mittelständischen und großen Unternehmen (CTO, CIO, IT-Leiter)",
  goals: [
    "Thought Leadership im Bereich AI Automation etablieren",
    "Qualified Leads für Sales-Pipeline generieren",
    "Awareness für die neuen AI-Automation-Lösungen schaffen",
    "Vertrauen bei IT-Entscheidern durch fundierte Inhalte aufbauen",
  ],
  tone: "Professionell, kompetent und visionär – aber greifbar und praxisnah. Keine leeren Buzzwords.",
  keyMessages: [
    "AI Automation ist kein Zukunftsthema mehr – es ist jetzt umsetzbar",
    "Unsere Lösungen integrieren sich nahtlos in bestehende IT-Landschaften",
    "ROI ist messbar: Prozesskosten senken, Durchlaufzeiten verkürzen",
    "Sicherheit und Compliance sind von Anfang an mitgedacht",
    "Vom Proof of Concept zum produktiven Einsatz in Wochen, nicht Monaten",
  ],
  language: "de",
  requestedAssets: [
    { type: "blog-article", count: 3, notes: "Blog-Reihe über 3 Wochen" },
    { type: "linkedin-post", count: 5, notes: "Begleitende Social-Media-Posts" },
    { type: "twitter-post", count: 3, notes: "Kurze Teaser" },
    { type: "email-newsletter", count: 2, notes: "Nurture-Emails" },
    { type: "instagram-caption", count: 2, notes: "Visuelle Posts" },
    { type: "whitepaper", count: 2, notes: "Readiness Assessment + Business Case" },
  ],
  constraints: [
    "Alle Inhalte auf Deutsch",
    "DSGVO-konform",
    "Kampagne läuft über 3 Wochen",
  ],
};

// --- Simulated Stage 2: Content Plan ---

const plan: ContentPlan = {
  campaignName: "AI Automation: Jetzt. Nicht irgendwann.",
  summary:
    "Eine dreiwöchige Kampagne, die IT-Entscheider systematisch von Awareness über Consideration zu Decision führt. Blog-Artikel bilden das inhaltliche Rückgrat, Social Media sorgt für Reichweite, Emails für Nurturing. Zwei Whitepaper liefern Tiefgang für Lead-Generierung.",
  pillars: [
    {
      name: "Urgency & Opportunity",
      description: "Warum AI Automation jetzt strategisch entscheidend ist",
      keyMessages: ["Wer jetzt nicht automatisiert, verliert den Anschluss", "AI Automation ist reif für den produktiven Einsatz"],
    },
    {
      name: "Technology & Integration",
      description: "Wie unsere Lösungen konkret funktionieren",
      keyMessages: ["Nahtlose Integration in bestehende IT-Landschaft", "Enterprise-grade Sicherheit und Compliance"],
    },
    {
      name: "Results & ROI",
      description: "Messbare Ergebnisse",
      keyMessages: ["Messbare Kostensenkung ab dem ersten Quartal", "Von PoC zu Produktion in Wochen"],
    },
  ],
  assets: [
    { id: "blog-article-01", type: "blog-article", title: "Warum 2026 das Jahr der AI Automation wird", angle: "Makro-Perspektive: Markttrends und Wettbewerbsdruck", pillar: "Urgency & Opportunity", keyPoints: ["Marktzahlen DACH", "3 Signale für Readiness", "Kosten des Abwartens"], cta: "Whitepaper herunterladen" },
    { id: "blog-article-02", type: "blog-article", title: "AI Automation in der Praxis: Nahtlose Integration", angle: "Technische Tiefe mit Business-Relevanz", pillar: "Technology & Integration", keyPoints: ["Referenzarchitektur", "Enterprise-Tool-Integration", "Sicherheitskonzept"], cta: "Architektur-Review buchen" },
    { id: "blog-article-03", type: "blog-article", title: "ROI von AI Automation: Zahlen für den CFO", angle: "Business-Case-Perspektive", pillar: "Results & ROI", keyPoints: ["ROI-Framework", "Beispielrechnungen", "Hidden Benefits"], cta: "Whitepaper herunterladen" },
    { id: "linkedin-post-01", type: "linkedin-post", title: "Kampagnen-Opener: AI Automation jetzt", angle: "Statistik-Hook", pillar: "Urgency & Opportunity", keyPoints: ["73% planen, 12% machen", "Lücke = Chance"], cta: "Blog-Artikel lesen" },
    { id: "linkedin-post-02", type: "linkedin-post", title: "3 Fragen für jeden CTO", angle: "Interaktiv", pillar: "Urgency & Opportunity", keyPoints: ["Engagement-Fragen"], cta: "In Kommentaren teilen" },
    { id: "linkedin-post-03", type: "linkedin-post", title: "Mythos: Komplett neue Infrastruktur nötig", angle: "Myth-Busting", pillar: "Technology & Integration", keyPoints: ["API-first", "Kein Rip-and-Replace"], cta: "Blog-Artikel lesen" },
    { id: "linkedin-post-04", type: "linkedin-post", title: "Die ROI-Rechnung", angle: "Konkrete Zahlen", pillar: "Results & ROI", keyPoints: ["Beispiel-ROI"], cta: "Whitepaper herunterladen" },
    { id: "linkedin-post-05", type: "linkedin-post", title: "Kampagnen-Closer", angle: "Zusammenfassung + CTA", pillar: "Results & ROI", keyPoints: ["3 Wochen Rückblick"], cta: "Beratung buchen" },
    { id: "twitter-post-01", type: "twitter-post", title: "Woche 1 Teaser", angle: "Statistik-Hook", pillar: "Urgency & Opportunity", keyPoints: ["Zahl + Link"], cta: "Blog lesen" },
    { id: "twitter-post-02", type: "twitter-post", title: "Woche 2 Teaser", angle: "Myth-Busting", pillar: "Technology & Integration", keyPoints: ["Kein neues System nötig"], cta: "Deep Dive lesen" },
    { id: "twitter-post-03", type: "twitter-post", title: "Woche 3 Teaser", angle: "ROI-Zahl", pillar: "Results & ROI", keyPoints: ["ROI-Hook"], cta: "Whitepaper herunterladen" },
    { id: "email-newsletter-01", type: "email-newsletter", title: "Kampagnen-Kick-off", angle: "Persönlicher Einstieg", pillar: "Urgency & Opportunity", keyPoints: ["Vorstellung der Reihe", "Exklusive Einblicke"], cta: "Ersten Artikel lesen" },
    { id: "email-newsletter-02", type: "email-newsletter", title: "Ihr AI Automation Toolkit", angle: "Abschluss mit gebündeltem Mehrwert", pillar: "Results & ROI", keyPoints: ["Alle Links", "Beratungsangebot"], cta: "Beratung buchen" },
    { id: "instagram-caption-01", type: "instagram-caption", title: "Behind the Scenes: AI-Team", angle: "Employer Branding", pillar: "Technology & Integration", keyPoints: ["Team-Vorstellung"], cta: "Link in Bio" },
    { id: "instagram-caption-02", type: "instagram-caption", title: "AI Automation in 60 Sekunden", angle: "Infografik-Begleittext", pillar: "Urgency & Opportunity", keyPoints: ["Was, Warum, Für wen"], cta: "Speichern + Link in Bio" },
    { id: "whitepaper-01", type: "whitepaper", title: "AI Automation Readiness Assessment: Methodik und Bewertungsmatrix für IT-Entscheider", angle: "Praxisorientiertes Assessment-Framework: Wo steht Ihr Unternehmen und was sind die nächsten Schritte?", pillar: "Urgency & Opportunity", keyPoints: ["Readiness-Dimensionen und Bewertungskriterien", "Self-Assessment-Checkliste", "Branchenspezifische Benchmarks", "Priorisierungs-Framework für AI-Initiativen", "Roadmap-Template für die ersten 90 Tage"], cta: "Kostenlose AI-Readiness-Beratung vereinbaren" },
    { id: "whitepaper-02", type: "whitepaper", title: "Der Business Case für AI Automation: ROI-Framework, Kennzahlen und Methodik", angle: "CFO-gerechte Aufbereitung: So rechnen Sie AI Automation für Ihr Unternehmen durch", pillar: "Results & ROI", keyPoints: ["ROI-Berechnungsmethodik für AI-Projekte", "Kostenkategorien und Einsparungspotentiale", "Benchmark-Daten aus über 50 Kundenprojekten", "Business-Case-Template zum Ausfüllen", "Typische Amortisationszeiten nach Prozesstyp"], cta: "ROI-Workshop mit unseren Experten buchen" },
  ],
  brandVoiceGuidelines:
    "Professionell und kompetent, aber nicht steif. Auf Augenhöhe mit IT-Entscheidern. Daten und konkrete Beispiele statt Buzzwords.",
};

// --- Simulated Stage 3: Generated Assets ---

const assets: GeneratedAsset[] = [
  // Blog Articles (shortened for dry run)
  {
    id: "blog-article-01", type: "blog-article",
    title: "Warum 2026 das Jahr der AI Automation wird – und was IT-Leiter jetzt tun sollten",
    content: `# Warum 2026 das Jahr der AI Automation wird – und was IT-Leiter jetzt tun sollten

*Die Technologie ist reif. Die Tools sind da. Fehlt nur noch Ihre Entscheidung.*

## Die Zahlen sprechen eine klare Sprache

73% der Unternehmen im DACH-Raum haben AI-Projekte auf der Roadmap. Aber nur 12% sind tatsächlich in Produktion. Diese Lücke ist die größte Chance für Unternehmen, die jetzt handeln.

## 3 Signale, dass Ihre Branche bereit ist

### 1. Ihre Wettbewerber investieren
68% der mittelständischen IT-Abteilungen planen höhere Budgets für Prozessautomatisierung.

### 2. Die Standardprozesse sind identifiziert
Rechnungseingang, Vertragsmanagement, IT-Service-Requests – die Prozesse sind branchenübergreifend bekannt.

### 3. Die Technologie ist Enterprise-ready
Out-of-the-box Integrationen für SAP, ServiceNow, Jira. SOC 2 und ISO 27001 sind Standard.

## Ihre Readiness-Checkliste

1. ☐ Top-5-Prozesse nach Automatisierungspotential priorisiert?
2. ☐ Dediziertes Budget für AI/Automation in 2026?
3. ☐ Kernsysteme API-fähig?
4. ☐ C-Level Sponsor vorhanden?
5. ☐ Datenstrategie für AI-Nutzung?

👉 **[Whitepaper herunterladen: AI Automation Readiness Assessment]**`,
    metadata: { platform: "Blog/Website", format: "article", week: "1" },
  },
  {
    id: "blog-article-02", type: "blog-article",
    title: "AI Automation in der Praxis: Nahtlose Integration in Ihre IT-Landschaft",
    content: `# AI Automation in der Praxis: So integrieren Sie KI nahtlos in Ihre bestehende IT-Landschaft

*Kein Rip-and-Replace. Keine neue Infrastruktur. Einfach smarter arbeiten.*

## Referenzarchitektur

Die AI-Automation-Plattform sitzt zwischen Ihren Systemen und orchestriert Workflows intelligent – ohne in die Kernlogik einzugreifen.

## Integration mit Enterprise-Tools

- **SAP**: Automatische Rechnungserkennung und Kontierung via RFC/BAPI
- **ServiceNow**: Intelligente Ticket-Klassifizierung und L1-Lösung
- **Jira & Confluence**: Automatische Issue-Erstellung, Statusberichte

## Sicherheitskonzept

| Aspekt | Umsetzung |
|--------|-----------|
| Datenhaltung | EU-Rechenzentren (Frankfurt, Amsterdam) |
| Verschlüsselung | AES-256 at rest, TLS 1.3 in transit |
| Compliance | DSGVO, SOC 2 Type II, ISO 27001 |

## Timeline: 8 Wochen bis zum Go-Live

- **Woche 1-2**: Discovery & API-Assessment
- **Woche 3-4**: Anbindung der Datenquellen
- **Woche 5-6**: Konfiguration der Workflows
- **Woche 7-8**: Testing, UAT und Go-Live

👉 **[Kostenlose Architektur-Review-Session buchen]**`,
    metadata: { platform: "Blog/Website", format: "article", week: "2" },
  },
  {
    id: "blog-article-03", type: "blog-article",
    title: "ROI von AI Automation: Zahlen, die Ihren CFO überzeugen",
    content: `# ROI von AI Automation: Zahlen, die Ihren CFO überzeugen

*Weniger Bauchgefühl, mehr Business Case.*

## Beispielrechnung: Rechnungsverarbeitung

**Vorher:** 5.000 Rechnungen × 12 Min. × 45€/h = **45.000€/Monat**
**Nachher:** 80% automatisch → **3.750€/Monat**
**Ersparnis: 41.250€/Monat → 495.000€/Jahr**

## Einsparungspotentiale nach Prozesstyp

| Prozesstyp | Einsparung |
|------------|-----------|
| Rechnungsverarbeitung | 50-70% |
| IT-Ticket-Routing | 40-60% |
| Vertragsmanagement | 30-50% |
| Reporting | 60-80% |

## Time-to-Value

- Proof of Concept: 2-3 Wochen
- Erster Prozess in Produktion: 6-8 Wochen
- Break-Even: 3-6 Monate

👉 **[Whitepaper herunterladen: Der Business Case für AI Automation]**`,
    metadata: { platform: "Blog/Website", format: "article", week: "3" },
  },
  // LinkedIn Posts
  { id: "linkedin-post-01", type: "linkedin-post", title: "Kampagnen-Opener", content: `73% der DACH-Unternehmen planen AI-Projekte.\nNur 12% sind in Produktion.\n\nDiese Lücke ist die größte Chance für alle, die jetzt handeln. 🚀\n\nWährend die Mehrheit noch evaluiert, schaffen frühe Adopter bereits Fakten:\n→ Automatisierte Genehmigungsprozesse\n→ KI-gestützte Dokumentenerkennung\n→ Intelligente Workflow-Orchestrierung\n\n👉 Link zum Artikel im ersten Kommentar\n\n#AIAutomation #Digitalisierung #ITEntscheider`, metadata: { platform: "LinkedIn", format: "post" } },
  { id: "linkedin-post-02", type: "linkedin-post", title: "3 Fragen für jeden CTO", content: `3 Fragen, die jeder CTO 2026 beantworten sollte:\n\n1️⃣ Welche Prozesse kosten die meisten manuellen Stunden?\n2️⃣ Wo entstehen die meisten Fehler durch Copy-Paste?\n3️⃣ Welche Abteilung wartet am längsten auf IT-Support?\n\nTeilt Eure Antworten! 👇\n\n#CTO #AIAutomation #Prozessoptimierung`, metadata: { platform: "LinkedIn", format: "post" } },
  { id: "linkedin-post-03", type: "linkedin-post", title: "Mythos: Neue Infrastruktur nötig", content: `"Für AI Automation müssen wir alles umbauen."\n\nNein. ❌\n\nModerne Plattformen arbeiten API-first:\n→ Bestehende Systeme bleiben\n→ SAP, ServiceNow, Jira – alles angebunden\n→ 8 Wochen bis zum Go-Live\n\nKein Rip-and-Replace. Deep Dive im Blog 👇\n\n#AIAutomation #Enterprise #APIFirst`, metadata: { platform: "LinkedIn", format: "post" } },
  { id: "linkedin-post-04", type: "linkedin-post", title: "Die ROI-Rechnung", content: `📄 5.000 Rechnungen/Monat\n⏱️ 12 Min. pro Rechnung (manuell)\n💰 45.000€ monatlich\n\nNach AI Automation:\n💰 3.750€ monatlich\n\nErsparnis: >400.000€/Jahr. Für EINEN Prozess.\n\nWhitepaper mit ROI-Framework 👇\n\n#ROI #AIAutomation #BusinessCase`, metadata: { platform: "LinkedIn", format: "post" } },
  { id: "linkedin-post-05", type: "linkedin-post", title: "Kampagnen-Closer", content: `3 Wochen. 3 Artikel. 2 Whitepaper. 1 Erkenntnis:\n\nAI Automation ist keine Frage des "Ob" – sondern des "Wie schnell".\n\n📌 Woche 1: Warum jetzt?\n📌 Woche 2: Wie funktioniert's?\n📌 Woche 3: Was bringt's?\n\nKostenlose AI-Readiness-Beratung – Link im Kommentar 👇\n\n#AIAutomation #DigitaleTransformation`, metadata: { platform: "LinkedIn", format: "post" } },
  // Twitter
  { id: "twitter-post-01", type: "twitter-post", title: "Woche 1 Teaser", content: `[1/1] 73% der DACH-Unternehmen planen AI-Projekte. Nur 12% sind in Produktion. Die Lücke = Ihre Chance. 🚀 #AIAutomation`, metadata: { platform: "Twitter/X", format: "tweet" } },
  { id: "twitter-post-02", type: "twitter-post", title: "Woche 2 Teaser", content: `[1/1] "AI Automation braucht neue Infrastruktur" ❌ Realität: API-first, 8 Wochen bis Go-Live. #AIAutomation #Enterprise`, metadata: { platform: "Twitter/X", format: "tweet" } },
  { id: "twitter-post-03", type: "twitter-post", title: "Woche 3 Teaser", content: `[1/1] Vorher: 45.000€/Monat. Nachher: 3.750€/Monat. AI Automation rechnet sich. ROI-Framework im Whitepaper 👉 #AIAutomation #ROI`, metadata: { platform: "Twitter/X", format: "tweet" } },
  // Emails
  { id: "email-newsletter-01", type: "email-newsletter", title: "Kampagnen-Kick-off", content: `**Subject Line:** AI Automation: Warum jetzt der richtige Zeitpunkt ist\n**Preview Text:** 73% planen, 12% machen – gehören Sie zu den 12%?\n\n---\n\nHallo,\n\nin den nächsten drei Wochen nehmen wir Sie mit auf eine Reise durch AI Automation.\n\n📌 **Woche 1** – Warum jetzt?\n📌 **Woche 2** – Wie genau?\n📌 **Woche 3** – Was bringt's?\n\n**Plus: Zwei exklusive Whitepaper.**\n\n→ **[Jetzt lesen: "Warum 2026 das Jahr der AI Automation wird"]**`, metadata: { platform: "Email", format: "newsletter" } },
  { id: "email-newsletter-02", type: "email-newsletter", title: "Ihr AI Automation Toolkit", content: `**Subject Line:** Ihr AI Automation Toolkit ist komplett 🎯\n**Preview Text:** 3 Artikel, 2 Whitepaper, 1 ROI-Rechner.\n\n---\n\nHallo,\n\nIhr komplettes Toolkit:\n\n📄 **3 Blog-Artikel** zur AI Automation\n📘 **2 Whitepaper** (Readiness + Business Case)\n📊 **ROI-Rechner** (im Whitepaper)\n\n**Exklusiv: Kostenlose AI-Readiness-Beratung** – 60 Min., remote, echte Analyse.\n\n→ **[Jetzt Termin buchen]**`, metadata: { platform: "Email", format: "newsletter" } },
  // Instagram
  { id: "instagram-caption-01", type: "instagram-caption", title: "Behind the Scenes: AI-Team", content: `Die Menschen hinter der Technologie. 👋\n\nWenn wir über AI Automation sprechen, klingt das nach Algorithmen. Aber es sind Menschen mit Leidenschaft und viel Kaffee. ☕\n\n🔹 Machine Learning & NLP\n🔹 Enterprise Integration\n🔹 Cloud & Security\n🔹 UX & Prozessdesign\n\n🔗 Link in Bio\n\n#AIAutomation #TeamWork #BehindTheScenes #TechTeam`, metadata: { platform: "Instagram", format: "caption" } },
  { id: "instagram-caption-02", type: "instagram-caption", title: "AI Automation in 60 Sekunden", content: `AI Automation in 60 Sekunden. ⏱️\n\n❓ Was? KI übernimmt wiederkehrende Geschäftsprozesse.\n💡 Warum? 30-70% weniger Kosten, 90% weniger Fehler.\n🎯 Für wen? Unternehmen mit Routineprozessen.\n\nSwipe für Details → 🔗 Link in Bio!\n\n🔖 Speichern für später!\n\n#AIAutomation #KünstlicheIntelligenz #Digitalisierung`, metadata: { platform: "Instagram", format: "caption" } },
  // Whitepapers
  {
    id: "whitepaper-01", type: "whitepaper",
    title: "AI Automation Readiness Assessment: Methodik und Bewertungsmatrix für IT-Entscheider",
    content: `# AI Automation Readiness Assessment

*Methodik und Bewertungsmatrix für IT-Entscheider*

## Executive Summary

Die Einführung von AI Automation in Geschäftsprozesse ist keine Frage des "Ob" mehr, sondern des "Wann" und "Wie". Doch bevor Unternehmen in Technologie investieren, müssen sie ihre eigene Readiness ehrlich bewerten. Dieses Whitepaper liefert ein praxiserprobtes Framework, mit dem IT-Entscheider den Reifegrad ihrer Organisation systematisch einschätzen und eine fundierte Roadmap entwickeln können.

## Inhaltsverzeichnis

1. Warum ein Readiness Assessment entscheidend ist
2. Die 5 Dimensionen der AI-Readiness
3. Self-Assessment: Bewertungsmatrix
4. Branchenspezifische Benchmarks
5. Priorisierungs-Framework für AI-Initiativen
6. Ihre Roadmap für die ersten 90 Tage
7. Fazit und nächste Schritte

---

## 1. Warum ein Readiness Assessment entscheidend ist

Laut einer McKinsey-Studie scheitern 70% aller AI-Projekte nicht an der Technologie, sondern an mangelnder organisatorischer Vorbereitung. Die häufigsten Gründe:

- **Fehlende Datenqualität** (43% der gescheiterten Projekte)
- **Unklare Verantwortlichkeiten** (37%)
- **Überdimensionierter Scope** (29%)
- **Mangelnde Stakeholder-Unterstützung** (24%)

Ein strukturiertes Readiness Assessment hilft, diese Risiken vor der Investition zu identifizieren und zu adressieren.

## 2. Die 5 Dimensionen der AI-Readiness

### 2.1 Strategie & Vision

Gibt es eine klare Vorstellung davon, was AI Automation für das Unternehmen leisten soll? Eine AI-Strategie muss nicht hundert Seiten umfassen – aber sie muss existieren.

**Bewertungskriterien:**
- Ist AI Automation in der Unternehmensstrategie verankert?
- Gibt es einen C-Level-Sponsor?
- Sind konkrete Use Cases identifiziert und priorisiert?
- Existiert ein Business Case mit messbaren KPIs?

### 2.2 Daten & Infrastruktur

AI Automation ist nur so gut wie die Daten, die sie verarbeitet. Die technische Infrastruktur muss API-fähig sein und Datenqualität muss systematisch gemanagt werden.

**Bewertungskriterien:**
- Sind die Kernsysteme API-fähig?
- Gibt es eine Data-Governance-Struktur?
- Wie ist die Datenqualität in den Zielprozessen?
- Existiert eine Cloud-Strategie?

### 2.3 Prozesse & Operations

Nicht jeder Prozess eignet sich gleichermaßen für AI Automation. Die besten Kandidaten sind hochvolumig, regelbasiert und fehleranfällig.

**Bewertungskriterien:**
- Sind Prozesse dokumentiert und standardisiert?
- Gibt es Prozess-KPIs (Durchlaufzeit, Fehlerquote, Kosten)?
- Wie hoch ist das manuelle Arbeitsvolumen?
- Gibt es bereits RPA oder andere Automatisierung?

### 2.4 Menschen & Kultur

Technologie allein reicht nicht. Die Organisation muss bereit sein, neue Arbeitsweisen anzunehmen und den Change aktiv zu gestalten.

**Bewertungskriterien:**
- Gibt es AI/ML-Kompetenz im Unternehmen?
- Ist die Belegschaft offen für Veränderung?
- Existiert ein Change-Management-Plan?
- Sind Schulungsressourcen eingeplant?

### 2.5 Governance & Compliance

Besonders in regulierten Branchen müssen AI-Lösungen von Anfang an compliant sein. DSGVO, branchenspezifische Regulierung und interne Richtlinien sind keine nachgelagerten Themen.

**Bewertungskriterien:**
- Gibt es eine AI-Governance-Richtlinie?
- Sind Datenschutzanforderungen für AI-Nutzung geklärt?
- Existiert ein Framework für Audit und Nachvollziehbarkeit?
- Wie werden Bias und Fairness adressiert?

## 3. Self-Assessment: Bewertungsmatrix

Bewerten Sie jede Dimension auf einer Skala von 1-5:

| Dimension | 1 (Anfänger) | 3 (Fortgeschritten) | 5 (Führend) |
|-----------|--------------|---------------------|-------------|
| Strategie | Keine AI-Strategie | AI auf Roadmap, erste Use Cases | AI-Strategie, dediziertes Budget, C-Level-Sponsor |
| Daten | Silos, keine APIs | Teilweise integriert, APIs vorhanden | Data Governance, hohe Qualität, Cloud-ready |
| Prozesse | Undokumentiert, manuell | Dokumentiert, teilweise standardisiert | Optimiert, KPI-gesteuert, teilautomatisiert |
| Menschen | Keine AI-Kompetenz | Einzelne Experten, Grundverständnis | AI-Team, Schulungsprogramm, Change-Kultur |
| Governance | Keine Richtlinien | Basis-Datenschutz, erste Richtlinien | AI-Governance-Framework, Audit-Prozesse |

**Gesamtscore-Interpretation:**
- **5-10 Punkte**: Grundlagenarbeit nötig – starten Sie mit Awareness und Strategie
- **11-17 Punkte**: Gute Basis – fokussieren Sie auf Quick Wins und Pilotprojekte
- **18-25 Punkte**: Bereit für Skalierung – entwickeln Sie eine Enterprise-weite Roadmap

## 4. Branchenspezifische Benchmarks

| Branche | Durchschnittlicher Readiness-Score | Top-Prozesse für Automation |
|---------|-----------------------------------|---------------------------|
| Finanzdienstleistungen | 16/25 | Kreditprüfung, Compliance-Reporting, Kundenservice |
| Fertigung | 12/25 | Qualitätskontrolle, Predictive Maintenance, Supply Chain |
| Gesundheitswesen | 11/25 | Patientenadministration, Befundung, Abrechnung |
| IT & Software | 19/25 | Incident Management, Code Review, Deployment |
| Öffentlicher Sektor | 9/25 | Antragsbearbeitung, Bürgerkommunikation, Archivierung |

## 5. Priorisierungs-Framework

Bewerten Sie jeden Prozess-Kandidaten nach zwei Achsen:

**Impact** (Geschäftswert der Automatisierung):
- Kostenersparnis
- Zeitersparnis
- Fehlerreduktion
- Skalierbarkeit

**Feasibility** (Umsetzbarkeit):
- Datenqualität und -verfügbarkeit
- Prozesskomplexität
- Systemintegration
- Organisatorische Readiness

> **Golden Rule:** Starten Sie mit Prozessen, die hohen Impact UND hohe Feasibility haben. Sparen Sie die "Moonshots" für später.

## 6. Ihre Roadmap für die ersten 90 Tage

### Tage 1-30: Assessment & Strategie
- Readiness-Assessment durchführen (dieses Whitepaper!)
- Top-5-Prozesse identifizieren und bewerten
- Business Case für Top-2-Prozesse erstellen
- Stakeholder-Alignment sicherstellen

### Tage 31-60: Pilot-Vorbereitung
- Technologie-Evaluation und Vendor-Auswahl
- Datenqualitäts-Assessment für Pilot-Prozess
- Team zusammenstellen (intern + extern)
- Pilot-Scope definieren und abgrenzen

### Tage 61-90: Proof of Concept
- PoC implementieren und testen
- Ergebnisse messen und dokumentieren
- Go/No-Go-Entscheidung für Rollout
- Rollout-Plan und Budget für Phase 2 erstellen

## 7. Fazit und nächste Schritte

AI Automation ist eine strategische Entscheidung, keine technische Spielerei. Ein ehrliches Readiness Assessment ist der erste Schritt – und dieser ist kostenlos und schmerzfrei.

**Ihr nächster Schritt:** Vereinbaren Sie eine kostenlose AI-Readiness-Beratung mit unseren Experten. 60 Minuten, Ihre Prozesse, konkrete Empfehlungen.

---

*Über uns: Wir sind ein Team aus AI-Ingenieuren, Enterprise-Architekten und Prozessberatern mit über 50 erfolgreichen AI-Automation-Projekten im DACH-Raum.*`,
    metadata: { platform: "Download/Gated Content", format: "whitepaper-pdf" },
  },
  {
    id: "whitepaper-02", type: "whitepaper",
    title: "Der Business Case für AI Automation: ROI-Framework, Kennzahlen und Methodik",
    content: `# Der Business Case für AI Automation

*ROI-Framework, Kennzahlen und Methodik*

## Executive Summary

Jede AI-Initiative braucht einen überzeugenden Business Case. Dieses Whitepaper liefert ein erprobtes ROI-Framework, das IT-Entscheider und CFOs eine gemeinsame Sprache gibt. Mit konkreten Berechnungsmethoden, Benchmark-Daten aus über 50 Projekten und einem Template für Ihren individuellen Business Case.

## Inhaltsverzeichnis

1. Warum klassische ROI-Berechnungen bei AI zu kurz greifen
2. Das 4-Ebenen-ROI-Framework
3. Kostenkategorien und Einsparungspotentiale
4. Benchmark-Daten aus der Praxis
5. Schritt-für-Schritt: Ihr Business Case
6. Typische Amortisationszeiten
7. Template und Methodik

---

## 1. Warum klassische ROI-Berechnungen zu kurz greifen

Der klassische ROI (Gewinn / Investition × 100) erfasst bei AI Automation nur einen Bruchteil des tatsächlichen Werts. Neben direkten Kosteneinsparungen gibt es signifikante indirekte Benefits, die oft 40-60% des Gesamtwerts ausmachen.

**Die häufigsten Fehler bei der ROI-Berechnung:**
- Nur direkte Personalkosten berücksichtigen
- Qualitätsverbesserungen ignorieren
- Skalierungseffekte nicht einrechnen
- Opportunitätskosten des Abwartens vergessen

## 2. Das 4-Ebenen-ROI-Framework

### Ebene 1: Direkte Kosteneinsparungen
Reduktion von Personalaufwand für manuelle, repetitive Tätigkeiten. Am einfachsten zu berechnen und am überzeugendsten für den CFO.

**Formel:**
> Einsparung = Prozessvolumen × Zeitersparnis pro Vorgang × Stundensatz

### Ebene 2: Qualitäts- und Compliance-Gewinne
Fehlerreduktion, konsistentere Ergebnisse, lückenlose Dokumentation. Schwieriger zu quantifizieren, aber oft der überzeugendste Langzeit-Faktor.

**Typische Metriken:**
- Fehlerquote vorher vs. nachher
- Kosten pro Fehler (Nacharbeit, Kundenunzufriedenheit)
- Compliance-Verstöße und deren Kosten

### Ebene 3: Geschwindigkeit und Skalierung
Schnellere Durchlaufzeiten ermöglichen schnelleres Wachstum ohne proportionalen Personalaufbau.

**Typische Metriken:**
- Durchlaufzeit vorher vs. nachher
- Kapazität pro FTE vorher vs. nachher
- Skalierungskosten bei 2x Volumen

### Ebene 4: Strategischer Wert
Wettbewerbsvorteile, Mitarbeiterzufriedenheit, Innovationsfähigkeit. Am schwierigsten zu quantifizieren, aber entscheidend für die langfristige Rechtfertigung.

## 3. Kostenkategorien und Einsparungspotentiale

### Investitionskosten (CapEx/OpEx)

| Kategorie | Typische Kosten | Anmerkung |
|-----------|----------------|-----------|
| Plattform-Lizenz | 2.000-10.000€/Monat | Je nach Volumen und Features |
| Implementierung | 30.000-80.000€ | Pro Prozess, einmalig |
| Integration | 10.000-30.000€ | Abhängig von Systemkomplexität |
| Schulung | 5.000-15.000€ | Einmalig + jährliche Updates |
| Betrieb & Support | 500-2.000€/Monat | Monitoring, Wartung, Updates |

### Einsparungspotentiale nach Prozesstyp

| Prozess | Volumen (Beispiel) | Kosten vorher | Kosten nachher | Einsparung |
|---------|-------------------|---------------|----------------|------------|
| Rechnungseingang | 5.000/Monat | 45.000€ | 3.750€ | 91,7% |
| IT-Tickets L1 | 3.000/Monat | 37.500€ | 11.250€ | 70,0% |
| Vertragsextraktion | 500/Monat | 12.500€ | 5.000€ | 60,0% |
| Onboarding | 50/Monat | 8.333€ | 5.000€ | 40,0% |
| Reporting | 200 Reports/Monat | 16.667€ | 2.500€ | 85,0% |

## 4. Benchmark-Daten aus der Praxis

Aus über 50 AI-Automation-Projekten im DACH-Raum:

**Durchschnittliche Ergebnisse:**
- **57% Kostensenkung** bei den automatisierten Prozessen
- **83% Fehlerreduktion** in der Datenverarbeitung
- **4,2x schnellere Durchlaufzeiten**
- **5,7 Monate** durchschnittliche Amortisationszeit
- **312% ROI** über 3 Jahre (Median)

**Verteilung der Amortisationszeiten:**
- Unter 3 Monate: 18% der Projekte
- 3-6 Monate: 47% der Projekte
- 6-12 Monate: 28% der Projekte
- Über 12 Monate: 7% der Projekte

## 5. Schritt-für-Schritt: Ihr Business Case

### Schritt 1: Ist-Zustand dokumentieren
- Prozessvolumen (Vorgänge pro Monat/Jahr)
- Durchschnittliche Bearbeitungszeit pro Vorgang
- Involvierte Mitarbeiter und deren Stundensätze
- Aktuelle Fehlerquote und Kosten pro Fehler

### Schritt 2: Soll-Zustand projizieren
- Erwartete Automatisierungsquote (konservativ: 60-70%)
- Verbleibende manuelle Bearbeitungszeit
- Qualitätsverbesserung (Fehlerreduktion)

### Schritt 3: Investition kalkulieren
- Einmalige Kosten (Implementierung, Integration, Schulung)
- Laufende Kosten (Lizenz, Betrieb, Support)
- Puffer für Unvorhergesehenes (10-15%)

### Schritt 4: ROI berechnen
> **Jährlicher ROI** = (Jährliche Einsparung - Jährliche Kosten) / Gesamtinvestition × 100

### Schritt 5: Sensitivitätsanalyse
Berechnen Sie drei Szenarien:
- **Konservativ**: 40% Automatisierung, minimale Quality-Gains
- **Realistisch**: 60% Automatisierung, moderate Quality-Gains
- **Optimistisch**: 80% Automatisierung, volle Quality-Gains

## 6. Typische Amortisationszeiten

| Szenario | Investment | Monatl. Einsparung | Amortisation |
|----------|-----------|-------------------|-------------|
| Klein (1 Prozess) | 50.000€ | 15.000€ | 3,3 Monate |
| Mittel (3 Prozesse) | 150.000€ | 45.000€ | 3,3 Monate |
| Groß (5+ Prozesse) | 350.000€ | 85.000€ | 4,1 Monate |

## 7. Fazit

AI Automation ist eine der wenigen Investitionen, die sich typischerweise innerhalb eines halben Jahres amortisieren. Der Business Case ist klar – die Frage ist nur, welche Prozesse Sie zuerst angehen.

**Ihr nächster Schritt:** Buchen Sie einen ROI-Workshop mit unseren Experten. Wir rechnen gemeinsam Ihren individuellen Business Case durch – basierend auf Ihren echten Zahlen.

---

*Über uns: Wir sind ein Team aus AI-Ingenieuren, Enterprise-Architekten und Prozessberatern mit über 50 erfolgreichen AI-Automation-Projekten im DACH-Raum.*`,
    metadata: { platform: "Download/Gated Content", format: "whitepaper-pdf" },
  },
];

// --- Simulated Stage 4: Review ---

const review: ReviewResult = {
  overallScore: 8,
  consistencyNotes:
    "Sehr konsistente Kampagne mit 17 Assets über alle Kanäle. Drei-Wochen-Narrativ durchgehend eingehalten. Whitepaper ergänzen die Blog-Reihe perfekt als Gated Content für Lead-Generierung.",
  assetReviews: [
    { assetId: "blog-article-01", score: 9, strengths: ["Starker Einstieg mit Daten", "Actionable Checkliste"], issues: [], suggestions: [], revised: false },
    { assetId: "blog-article-02", score: 8, strengths: ["Technische Tiefe mit Business-Relevanz"], issues: [], suggestions: [], revised: false },
    { assetId: "blog-article-03", score: 9, strengths: ["Überzeugende Beispielrechnung"], issues: [], suggestions: [], revised: false },
    { assetId: "linkedin-post-01", score: 8, strengths: ["Starker Statistik-Hook"], issues: [], suggestions: [], revised: false },
    { assetId: "linkedin-post-02", score: 8, strengths: ["Interaktiv, fördert Engagement"], issues: [], suggestions: [], revised: false },
    { assetId: "linkedin-post-03", score: 8, strengths: ["Effektives Myth-Busting"], issues: [], suggestions: [], revised: false },
    { assetId: "linkedin-post-04", score: 9, strengths: ["Konkrete Zahlen überzeugen"], issues: [], suggestions: [], revised: false },
    { assetId: "linkedin-post-05", score: 8, strengths: ["Guter Abschluss"], issues: [], suggestions: [], revised: false },
    { assetId: "twitter-post-01", score: 7, strengths: ["Prägnant"], issues: [], suggestions: [], revised: false },
    { assetId: "twitter-post-02", score: 7, strengths: ["Myth-Busting-Format"], issues: [], suggestions: [], revised: false },
    { assetId: "twitter-post-03", score: 8, strengths: ["Konkrete Zahlen in 280 Zeichen"], issues: [], suggestions: [], revised: false },
    { assetId: "email-newsletter-01", score: 8, strengths: ["Klare Struktur, guter Ausblick"], issues: [], suggestions: [], revised: false },
    { assetId: "email-newsletter-02", score: 9, strengths: ["Hervorragende Zusammenfassung"], issues: [], suggestions: [], revised: false },
    { assetId: "instagram-caption-01", score: 8, strengths: ["Authentisch"], issues: [], suggestions: [], revised: false },
    { assetId: "instagram-caption-02", score: 8, strengths: ["Gut für Carousel"], issues: [], suggestions: [], revised: false },
    { assetId: "whitepaper-01", score: 9, strengths: ["Exzellentes Framework", "Praxisnah", "Sofort anwendbar"], issues: [], suggestions: [], revised: false },
    { assetId: "whitepaper-02", score: 9, strengths: ["CFO-gerecht", "Überzeugende Benchmarks", "Klare Methodik"], issues: [], suggestions: [], revised: false },
  ],
};

// --- Run Pipeline ---

async function main() {
  console.log(chalk.bold("\n🧪 Content Creator – Dry Run (Simulated Pipeline)\n"));

  let spinner = ora("Parsing campaign brief...").start();
  spinner.succeed(`Brief parsed: ${chalk.bold(brief.topic)} → ${brief.requestedAssets.map((a) => `${a.count}x ${a.type}`).join(", ")}`);

  spinner = ora("Creating content plan...").start();
  spinner.succeed(`Content plan ready: ${chalk.bold(plan.campaignName)} (${plan.assets.length} assets planned)`);

  spinner = ora(`Generating ${plan.assets.length} assets...`).start();
  spinner.succeed(`${assets.length} assets generated`);

  spinner = ora("Reviewing assets for quality and consistency...").start();
  spinner.succeed(`Review complete: ${chalk.bold(String(review.overallScore))}/10 overall`);

  const state: PipelineState = {
    userPrompt: "Dry Run",
    language: brief.language,
    brief,
    plan,
    assets,
    review,
  };

  // Stage 5: Export
  spinner = ora("Exporting campaign...").start();
  const outputDir = await exportCampaign(state);
  state.outputDir = outputDir;
  spinner.succeed(`Campaign exported to ${chalk.underline(outputDir)}`);

  // Stage 6: Generate Images (Gemini)
  spinner = ora(`Generating images for ${state.assets!.length} assets...`).start();
  try {
    state.assets = await generateImages(state.assets!, state.brief!, outputDir);
    const imageCount = state.assets.filter((a) => a.imagePath).length;
    spinner.succeed(`${imageCount} images generated`);
  } catch (err) {
    spinner.fail(`Image generation failed: ${(err as Error).message}`);
  }

  // Stage 7: Generate PDFs for whitepapers
  spinner = ora("Generating whitepaper PDFs...").start();
  try {
    state.assets = await generatePdfs(state.assets!, outputDir, state.language);
    const pdfCount = state.assets.filter((a) => a.pdfPath).length;
    spinner.succeed(`${pdfCount} PDF(s) generated`);
  } catch (err) {
    spinner.fail(`PDF generation failed: ${(err as Error).message}`);
  }

  // Re-export HTML preview with PDF links
  const { exportHtmlPreview } = await import("./export/html-preview.js");
  await exportHtmlPreview(outputDir, state);

  console.log(chalk.green(`\n✅ Campaign "${plan.campaignName}" generated successfully!`));
  console.log(`   ${chalk.bold(String(state.assets!.length))} assets (${state.assets!.filter(a => a.type === "whitepaper").length} whitepapers as PDF)`);
  console.log(`   Open ${chalk.underline(outputDir + "/preview/index.html")} to preview.\n`);
}

main().catch((err) => {
  console.error(chalk.red(`\n❌ Error: ${(err as Error).message}\n`));
  process.exit(1);
});
