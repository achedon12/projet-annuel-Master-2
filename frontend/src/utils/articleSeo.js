/**
 * Heuristiques SEO et utilitaires d'export pour l'éditeur d'article.
 * Tout est calculé côté client (aucun appel API), instantané et gratuit.
 */

// Mots vides FR + EN ignorés lors de l'extraction de mots-clés.
const STOP_WORDS = new Set([
    // FR
    "afin", "ainsi", "alors", "aussi", "autour", "autre", "autres", "aux", "avec", "avoir",
    "bien", "ceci", "cela", "celle", "celui", "ces", "cette", "ceux", "comme", "dans",
    "deja", "déjà", "depuis", "des", "donc", "dont", "elle", "elles", "encore", "entre",
    "est", "etait", "était", "etre", "être", "été", "faire", "fait", "ils", "jusque",
    "les", "leur", "leurs", "lui", "mais", "meme", "même", "moi", "moins", "non", "notre",
    "nous", "ont", "où", "par", "pas", "peut", "plus", "pour", "puis", "quand", "que",
    "quel", "quelle", "qui", "sans", "selon", "ses", "son", "sont", "sous", "sur", "toi",
    "tous", "tout", "tres", "très", "une", "via", "voici", "voilà", "vos", "votre", "vous",
    "oui",
    // EN
    "about", "after", "all", "also", "and", "any", "are", "ask", "been", "boy", "but",
    "can", "day", "did", "even", "for", "from", "get", "has", "have", "her", "him", "his",
    "how", "into", "its", "just", "know", "let", "like", "make", "may", "men", "more",
    "much", "new", "not", "now", "off", "old", "one", "only", "our", "out", "own", "put",
    "say", "see", "set", "she", "some", "such", "than", "that", "the", "their", "them",
    "there", "these", "they", "this", "those", "time", "too", "try", "two", "use", "very",
    "was", "way", "what", "when", "where", "which", "who", "will", "with", "would", "yet",
    "you", "your",
]);

const WORD_RE = /[a-zàâäéèêëîïôöùûüç]{4,}/giu;

/**
 * Extrait les top-N mots-clés (par fréquence) depuis un texte brut/markdown.
 *
 * @param {string} content
 * @param {number} limit
 * @returns {string[]}
 */
export const extractKeywords = (content, limit = 6) => {
    if (!content || typeof content !== "string") return [];
    const cleaned = content
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`[^`]*`/g, " ")
        .replace(/!\[.*?\]\(.*?\)/g, " ")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .toLowerCase();

    const counts = new Map();
    const matches = cleaned.match(WORD_RE) || [];
    for (const word of matches) {
        if (STOP_WORDS.has(word)) continue;
        counts.set(word, (counts.get(word) || 0) + 1);
    }

    return [...counts.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([word]) => word);
};

/**
 * Calcule l'analyse SEO heuristique d'un article : checks individuels et score global pondéré.
 *
 * @param {{title: string, content: string, targetWords: number}} input
 * @returns {{score:number, checks:{contentLength:string, optimizedTitle:string, structure:string, keywords:string}, wordCount:number, keywords:string[]}}
 */
export const analyzeSeo = ({ title = "", content = "", targetWords = 800 }) => {
    const trimmedContent = content.trim();
    const wordCount = trimmedContent ? trimmedContent.split(/\s+/).filter(Boolean).length : 0;
    const keywords = extractKeywords(content);

    const checks = {
        contentLength: wordCount >= targetWords * 0.8 ? "good" : wordCount >= targetWords * 0.4 ? "fair" : "poor",
        optimizedTitle: title.length >= 30 && title.length <= 70 ? "good" : title.length > 0 ? "fair" : "poor",
        structure: hasHeadings(content) ? "good" : "poor",
        keywords: keywords.length >= 4 ? "good" : keywords.length >= 2 ? "fair" : "poor",
    };

    const weights = { contentLength: 0.35, optimizedTitle: 0.2, structure: 0.2, keywords: 0.25 };
    const pointFor = (verdict) => (verdict === "good" ? 100 : verdict === "fair" ? 55 : 15);
    const score = Math.round(
        Object.entries(checks).reduce((sum, [key, verdict]) => sum + pointFor(verdict) * weights[key], 0),
    );

    return { score, checks, wordCount, keywords };
};

const hasHeadings = (content) => /^\s*#{2,3}\s+\S/m.test(content);

/**
 * Déclenche un téléchargement client-side d'un blob Markdown.
 */
export const exportArticleAsMarkdown = (title, content) => {
    const safeTitle = (title || "article").trim() || "article";
    const filename = slugify(safeTitle) + ".md";
    const body = `# ${safeTitle}\n\n${content || ""}`;
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    triggerDownload(blob, filename);
};

/**
 * Génère un PDF client-side via html2pdf.js (import dynamique pour éviter le SSR).
 */
export const exportArticleAsPdf = async (title, content) => {
    const safeTitle = (title || "article").trim() || "article";
    const filename = slugify(safeTitle) + ".pdf";

    const container = document.createElement("div");
    container.style.padding = "40px";
    container.style.fontFamily = "Inter, Helvetica, Arial, sans-serif";
    container.style.color = "#0f172a";
    container.style.maxWidth = "720px";
    container.innerHTML = renderMarkdownToHtml(safeTitle, content || "");

    const { default: html2pdf } = await import("html2pdf.js");
    await html2pdf()
        .from(container)
        .set({
            margin: 10,
            filename,
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .save();
};

const slugify = (s) =>
    s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036F]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "article";

const escapeHtml = (s) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/**
 * Convertit le markdown en HTML minimal pour le rendu PDF.
 * Volontairement simple : H1/H2/H3, paragraphes, listes, gras/italique, code inline.
 */
const renderMarkdownToHtml = (title, body) => {
    const lines = body.split("\n");
    const html = [];
    html.push(`<h1 style="font-size:28px;margin-bottom:24px">${escapeHtml(title)}</h1>`);
    let inList = false;
    for (const rawLine of lines) {
        const line = rawLine.replace(/\s+$/g, "");
        if (line.startsWith("### ")) {
            if (inList) { html.push("</ul>"); inList = false; }
            html.push(`<h3 style="font-size:18px;margin-top:18px">${formatInline(line.slice(4))}</h3>`);
        } else if (line.startsWith("## ")) {
            if (inList) { html.push("</ul>"); inList = false; }
            html.push(`<h2 style="font-size:22px;margin-top:22px">${formatInline(line.slice(3))}</h2>`);
        } else if (line.startsWith("# ")) {
            if (inList) { html.push("</ul>"); inList = false; }
            html.push(`<h1 style="font-size:26px;margin-top:24px">${formatInline(line.slice(2))}</h1>`);
        } else if (/^\s*[-*]\s+/.test(line)) {
            if (!inList) { html.push("<ul>"); inList = true; }
            html.push(`<li>${formatInline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
        } else if (line.trim() === "") {
            if (inList) { html.push("</ul>"); inList = false; }
            html.push("");
        } else {
            if (inList) { html.push("</ul>"); inList = false; }
            html.push(`<p style="line-height:1.6;margin:8px 0">${formatInline(line)}</p>`);
        }
    }
    if (inList) html.push("</ul>");
    return html.join("\n");
};

const formatInline = (s) => {
    let out = escapeHtml(s);
    out = out.replace(/`([^`]+)`/g, "<code style=\"background:#f1f5f9;padding:1px 4px;border-radius:3px\">$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return out;
};

const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 0);
};
