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
 * Génère un PDF client-side avec jsPDF en rendu texte natif (import dynamique
 * pour éviter le SSR). On n'utilise volontairement PAS html2canvas : celui-ci
 * lève « Attempting to parse an unsupported color function "oklch" » sur les
 * couleurs Tailwind v4, ce qui faisait échouer tout l'export. Le rendu texte
 * est en prime plus léger et laisse le texte sélectionnable.
 */
export const exportArticleAsPdf = async (title, content) => {
    const safeTitle = (title || "article").trim() || "article";
    const filename = slugify(safeTitle) + ".pdf";

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    const PT_TO_MM = 0.3527777778;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    const bottom = pageHeight - margin;
    let y = margin;

    doc.setTextColor(15, 23, 42); // slate-900

    const applyStyle = (seg, size) => {
        doc.setFontSize(size);
        if (seg.code) {
            doc.setFont("courier", seg.bold ? "bold" : "normal");
        } else if (seg.bold && seg.italic) {
            doc.setFont("helvetica", "bolditalic");
        } else if (seg.bold) {
            doc.setFont("helvetica", "bold");
        } else if (seg.italic) {
            doc.setFont("helvetica", "italic");
        } else {
            doc.setFont("helvetica", "normal");
        }
    };

    // Pose un bloc de segments stylés avec retour à la ligne mot à mot et saut
    // de page automatique. `indent` décale le bloc (utile pour les puces).
    const writeBlock = (segments, { size, bold = false, spacingAfter = 2.5, indent = 0 } = {}) => {
        const lineHeight = size * PT_TO_MM * 1.45;
        const left = margin + indent;
        const right = margin + contentWidth;

        const words = [];
        for (const seg of segments) {
            for (const w of seg.text.split(/\s+/).filter((part) => part.length > 0)) {
                words.push({ text: w, bold: seg.bold || bold, italic: seg.italic, code: seg.code });
            }
        }
        if (words.length === 0) {
            y += lineHeight + spacingAfter;
            return;
        }

        if (y + lineHeight > bottom) { doc.addPage(); y = margin; }
        let x = left;
        let atLineStart = true;
        for (const w of words) {
            applyStyle(w, size);
            const wordWidth = doc.getTextWidth(w.text);
            const spaceWidth = atLineStart ? 0 : doc.getTextWidth(" ");
            if (!atLineStart && x + spaceWidth + wordWidth > right) {
                y += lineHeight;
                if (y + lineHeight > bottom) { doc.addPage(); y = margin; }
                x = left;
                atLineStart = true;
            }
            if (!atLineStart) x += spaceWidth;
            doc.text(w.text, x, y, { baseline: "top" });
            x += wordWidth;
            atLineStart = false;
        }
        y += lineHeight + spacingAfter;
    };

    writeBlock(tokenizeInline(safeTitle), { size: 22, bold: true, spacingAfter: 4 });

    let pendingBlank = false;
    for (const rawLine of (content || "").split("\n")) {
        const line = rawLine.replace(/\s+$/g, "");
        if (line.trim() === "") { pendingBlank = true; continue; }
        if (pendingBlank) { y += 1.5; pendingBlank = false; }

        if (line.startsWith("### ")) {
            writeBlock(tokenizeInline(line.slice(4)), { size: 13, bold: true, spacingAfter: 1.5 });
        } else if (line.startsWith("## ")) {
            writeBlock(tokenizeInline(line.slice(3)), { size: 15, bold: true, spacingAfter: 2 });
        } else if (line.startsWith("# ")) {
            writeBlock(tokenizeInline(line.slice(2)), { size: 18, bold: true, spacingAfter: 2.5 });
        } else if (/^\s*[-*]\s+/.test(line)) {
            const item = line.replace(/^\s*[-*]\s+/, "");
            writeBlock([{ text: "•  ", bold: false, italic: false, code: false }, ...tokenizeInline(item)], {
                size: 11,
                spacingAfter: 1,
                indent: 2,
            });
        } else {
            writeBlock(tokenizeInline(line), { size: 11 });
        }
    }

    doc.save(filename);
};

/**
 * Découpe une ligne markdown en segments stylés : `code`, **gras**, *italique*.
 */
const tokenizeInline = (text) => {
    const tokens = [];
    const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) {
            tokens.push({ text: text.slice(last, m.index), bold: false, italic: false, code: false });
        }
        if (m[1]) tokens.push({ text: m[1].slice(1, -1), bold: false, italic: false, code: true });
        else if (m[2]) tokens.push({ text: m[2].slice(2, -2), bold: true, italic: false, code: false });
        else if (m[3]) tokens.push({ text: m[3].slice(1, -1), bold: false, italic: true, code: false });
        last = re.lastIndex;
    }
    if (last < text.length) {
        tokens.push({ text: text.slice(last), bold: false, italic: false, code: false });
    }
    return tokens.length ? tokens : [{ text, bold: false, italic: false, code: false }];
};

const slugify = (s) =>
    s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036F]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "article";

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
