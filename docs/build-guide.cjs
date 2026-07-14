/*
 * Génère le guide de formation PDF (docs/guide-formation.pdf) avec jsPDF.
 * Prérequis : dépendances du frontend installées (npm install dans frontend/).
 *   node docs/build-guide.cjs
 */
const path = require("path");
const fs = require("fs");
const { jsPDF } = require(path.join(__dirname, "..", "frontend", "node_modules", "jspdf"));

const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

const PW = 210;
const PH = 297;
const M = 20;
const CW = PW - 2 * M;
const PT = 0.3527777778;

const DARK = [30, 41, 59];
const MUTED = [71, 85, 105];
const GREEN = [15, 81, 50];
const ACCENT = [16, 185, 129];

let y = M;

const lineH = (size) => size * PT * 1.15;

const setFont = (size, style = "normal", color = DARK) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
};

const ensure = (h) => {
    if (y + h > PH - M - 8) {
        doc.addPage();
        y = M;
    }
};

const para = (text, opts = {}) => {
    const { size = 10.5, style = "normal", color = DARK, indent = 0, gap = 2.4, marker = null } = opts;
    const markerGap = marker ? 6 : 0;
    setFont(size, style, color);
    const lines = doc.splitTextToSize(text, CW - indent - markerGap);
    const lh = lineH(size);
    for (let i = 0; i < lines.length; i++) {
        ensure(lh);
        if (i === 0 && marker) {
            setFont(size, "bold", color === DARK ? GREEN : color);
            doc.text(marker, M + indent, y, { baseline: "top" });
            setFont(size, style, color);
        }
        doc.text(lines[i], M + indent + markerGap, y, { baseline: "top" });
        y += lh;
    }
    y += gap;
};

const bullets = (items) => items.forEach((it) => para(it, { marker: "•", indent: 2, gap: 1.4 }));
const steps = (items) => items.forEach((it, i) => para(it, { marker: `${i + 1}.`, indent: 2, gap: 1.6 }));

const h1 = (label) => {
    y += 4;
    ensure(lineH(16) + 8);
    setFont(16, "bold", GREEN);
    doc.text(label, M, y, { baseline: "top" });
    y += lineH(16) + 1.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(M, y, M + CW, y);
    y += 4.5;
};

const h2 = (label) => {
    y += 2.5;
    ensure(lineH(12.5) + 3);
    setFont(12.5, "bold", DARK);
    doc.text(label, M, y, { baseline: "top" });
    y += lineH(12.5) + 2.2;
};

const note = (label, text) => {
    const lh = lineH(9.5);
    setFont(9.5, "normal", DARK);
    const bodyLines = doc.splitTextToSize(text, CW - 9);
    const boxH = (label ? lh : 0) + bodyLines.length * lh + 5;
    ensure(boxH + 3);
    doc.setFillColor(240, 250, 244);
    doc.roundedRect(M, y, CW, boxH, 1.4, 1.4, "F");
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(M, y, 1.6, boxH, "F");
    let ty = y + 2.5;
    if (label) {
        setFont(9.5, "bold", GREEN);
        doc.text(label, M + 5, ty, { baseline: "top" });
        ty += lh;
    }
    setFont(9.5, "normal", DARK);
    for (const ln of bodyLines) {
        doc.text(ln, M + 5, ty, { baseline: "top" });
        ty += lh;
    }
    y += boxH + 3.5;
};

const table = (headers, rows) => {
    const cols = headers.length;
    const colW = CW / cols;
    const size = 9.5;
    const lh = lineH(size);
    const padY = 1.8;
    const drawRow = (cells, isHead) => {
        setFont(size, isHead ? "bold" : "normal", DARK);
        const cellLines = cells.map((c) => doc.splitTextToSize(String(c), colW - 4));
        const rowH = Math.max(...cellLines.map((l) => l.length)) * lh + padY * 2;
        ensure(rowH);
        if (isHead) {
            doc.setFillColor(226, 232, 240);
            doc.rect(M, y, CW, rowH, "F");
        }
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        for (let c = 0; c < cols; c++) {
            const x = M + c * colW;
            doc.rect(x, y, colW, rowH);
            setFont(size, isHead ? "bold" : "normal", DARK);
            let ty = y + padY;
            for (const ln of cellLines[c]) {
                doc.text(ln, x + 2, ty, { baseline: "top" });
                ty += lh;
            }
        }
        y += rowH;
    };
    ensure(lh * 3);
    drawRow(headers, true);
    rows.forEach((r) => drawRow(r, false));
    y += 3.5;
};

// ---------- Couverture ----------
doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
doc.rect(0, 0, PW, 80, "F");
doc.setTextColor(255, 255, 255);
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("GUIDE DE FORMATION", PW / 2, 42, { align: "center" });
doc.setFont("helvetica", "normal");
doc.setFontSize(10);
doc.text("Manuel utilisateur", PW / 2, 52, { align: "center" });

doc.setTextColor(DARK[0], DARK[1], DARK[2]);
doc.setFont("helvetica", "bold");
doc.setFontSize(25);
doc.text("Plateforme de génération", PW / 2, 130, { align: "center" });
doc.text("de contenu SEO assistée par IA", PW / 2, 143, { align: "center" });
doc.setFont("helvetica", "normal");
doc.setFontSize(12);
doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
doc.text("Prise en main et utilisation au quotidien", PW / 2, 158, { align: "center" });

doc.setDrawColor(203, 213, 225);
doc.line(M + 30, 250, PW - M - 30, 250);
doc.setFontSize(10);
doc.text("Version 1.0", PW / 2, 258, { align: "center" });

// ---------- Sommaire ----------
doc.addPage();
y = M;
setFont(16, "bold", GREEN);
doc.text("Sommaire", M, y, { baseline: "top" });
y += lineH(16) + 6;
const toc = [
    "1.  Présentation",
    "2.  Accès et connexion",
    "3.  Le tableau de bord",
    "4.  Générer des idées d'articles",
    "5.  Rédiger un article",
    "6.  Retravailler le texte",
    "7.  Analyser le référencement (SEO)",
    "8.  Publier, exporter et planifier",
    "9.  Historique et cycle de vie des articles",
    "10. Gérer son entreprise",
    "11. Paramètres du compte",
    "12. Administration",
    "13. Questions fréquentes",
];
toc.forEach((t) => {
    setFont(11, "normal", DARK);
    doc.text(t, M + 2, y, { baseline: "top" });
    y += lineH(11) + 2.4;
});

// ---------- 1. Présentation ----------
doc.addPage();
y = M;
h1("1. Présentation");
para(
    "Cette application permet de produire des articles optimisés pour le référencement naturel, de la première idée jusqu'à la publication. Elle s'appuie sur un modèle d'intelligence artificielle pour suggérer des sujets, rédiger le contenu et le retravailler, tout en gardant l'auteur maître de chaque étape.",
);
para("Ce guide s'adresse à toute personne amenée à utiliser l'outil : rédacteurs, responsables éditoriaux ou gestionnaires de contenu. Aucune compétence technique n'est nécessaire.");
h2("Ce dont vous avez besoin");
bullets([
    "Un compte sur la plateforme (voir la section 2).",
    "Un navigateur web à jour.",
    "Le cas échéant, un compte Notion ou Google si vous souhaitez exporter ou planifier vos publications sur ces services.",
]);
note("À savoir", "Les captures d'écran peuvent varier légèrement selon les mises à jour, mais l'emplacement des menus et le déroulé des actions restent identiques.");

// ---------- 2. Accès et connexion ----------
h1("2. Accès et connexion");
para("La page d'accueil de connexion propose trois moyens d'accéder à votre espace : l'email et un mot de passe, votre compte Google, ou un lien de connexion envoyé par email.");
h2("Créer un compte");
steps([
    "Sur la page de connexion, ouvrez l'onglet « Inscription ».",
    "Renseignez votre nom, votre adresse email et un mot de passe d'au moins six caractères.",
    "Validez : vous êtes connecté automatiquement et redirigé vers le tableau de bord.",
]);
h2("Se connecter avec un mot de passe");
para("Depuis l'onglet « Connexion », saisissez votre email et votre mot de passe, puis validez.");
h2("Se connecter avec Google");
para("Cliquez sur « Continuer avec Google » et choisissez votre compte. Si c'est votre première connexion par ce biais, un compte est créé automatiquement à partir de votre adresse Google.");
h2("Se connecter sans mot de passe");
para("Si vous préférez ne pas saisir de mot de passe, demandez un lien de connexion :");
steps([
    "Sur l'onglet « Connexion », saisissez votre adresse email.",
    "Cliquez sur « Recevoir un lien de connexion ».",
    "Ouvrez l'email reçu et cliquez sur le lien. Vous êtes connecté immédiatement.",
]);
note("Sécurité", "Le lien n'est valable que quelques minutes et ne peut servir qu'une seule fois. Passé ce délai, demandez-en simplement un nouveau.");

// ---------- 3. Tableau de bord ----------
h1("3. Le tableau de bord");
para("Une fois connecté, le tableau de bord donne une vue d'ensemble de votre activité : nombre d'articles, statuts (brouillon, publié, archivé) et accès rapides aux principales actions. C'est le point de départ pour créer un nouvel article ou reprendre un travail en cours.");
para("Le menu latéral, présent sur toutes les pages, permet de naviguer entre le tableau de bord, les idées, l'éditeur, l'historique, l'entreprise et les paramètres.");

// ---------- 4. Idées ----------
h1("4. Générer des idées d'articles");
para("Lorsque vous manquez d'inspiration, la page « Idées » propose des sujets à partir d'un simple mot-clé ou d'un secteur d'activité.");
steps([
    "Ouvrez « Idées » depuis le menu latéral.",
    "Saisissez un mot-clé ou un thème (par exemple : « nutrition sportive »).",
    "Précisez si besoin le type de contenu et l'audience visée.",
    "Lancez la génération : une liste de sujets vous est proposée.",
    "Reprenez le sujet qui vous convient pour démarrer un article.",
]);
note("Conseil", "Plus votre mot-clé est précis, plus les suggestions sont pertinentes. N'hésitez pas à relancer une génération pour obtenir d'autres pistes.");

// ---------- 5. Rédiger ----------
h1("5. Rédiger un article");
para("L'éditeur est l'espace central de rédaction. Il combine la saisie manuelle et l'assistance de l'IA.");
h2("Démarrer");
steps([
    "Ouvrez « Éditeur » depuis le menu, ou partez d'une idée générée.",
    "Donnez un titre à votre article : il sert de base à la génération.",
]);
h2("Paramétrer la génération");
para("Dans le panneau de configuration, réglez :");
table(
    ["Réglage", "Rôle"],
    [
        ["Fourchette de mots", "Longueur souhaitée, exprimée par un minimum et un maximum."],
        ["Ton", "Registre du texte : professionnel, informel, amical, formel ou enthousiaste."],
        ["Audience", "Public visé, qui oriente le vocabulaire et le niveau de détail."],
    ],
);
h2("Générer le contenu");
para("Cliquez sur « Générer » : l'IA rédige un article complet (titre, introduction, sections et conclusion) en respectant la fourchette de mots et le ton demandés. Le résultat s'affiche dans l'éditeur, où vous pouvez le modifier librement.");

// ---------- 6. Retravailler ----------
h1("6. Retravailler le texte");
para("Plusieurs outils permettent d'améliorer un texte existant, sans tout régénérer.");
h2("Reformuler un passage");
para("La reformulation agit sur la partie que vous sélectionnez, ce qui vous laisse un contrôle fin sur le résultat.");
steps([
    "Dans l'éditeur, sélectionnez le passage à reformuler.",
    "Cliquez sur « Reformuler ». Seul ce passage est réécrit et remplacé sur place.",
    "Si vous ne sélectionnez rien, c'est le paragraphe situé sous le curseur qui est reformulé.",
]);
h2("Actions rapides");
bullets([
    "Améliorer le style : resserre les phrases et fluidifie les transitions.",
    "Ajouter une introduction : insère une accroche en tête d'article.",
    "Optimiser le SEO : replace naturellement les mots-clés et clarifie la structure.",
]);
h2("Suggestions");
para("Le bouton de suggestions propose trois pistes d'amélioration concrètes et hiérarchisées, utiles pour repérer d'un coup d'œil ce qui aurait le plus d'impact.");

// ---------- 7. SEO ----------
h1("7. Analyser le référencement (SEO)");
para("L'onglet SEO évalue la qualité de votre article au regard du référencement. Un score global sur 100 est accompagné du détail par critère.");
para("Le bouton « Analyse SEO avancée » lance une évaluation côté serveur qui prend en compte sept critères pondérés :");
bullets([
    "la longueur du contenu,",
    "la longueur du titre,",
    "la structure des titres (sous-titres),",
    "la densité de mots-clés,",
    "la lisibilité,",
    "la présence de liens,",
    "la qualité de l'introduction.",
]);
para("Le score obtenu est enregistré avec l'article, ce qui permet de suivre son évolution au fil des modifications.");
note("Bon à savoir", "Une densité de mots-clés trop élevée est pénalisée : viser le naturel reste la meilleure stratégie.");

// ---------- 8. Publier / exporter ----------
h1("8. Publier, exporter et planifier");
h2("Enregistrer et publier");
para("À tout moment, enregistrez votre article pour le conserver en brouillon, ou publiez-le lorsqu'il est prêt. Le statut de l'article est mis à jour en conséquence.");
h2("Exporter");
para("Vous pouvez récupérer votre article dans deux formats :");
bullets([
    "PDF : un document propre, prêt à partager, au texte sélectionnable.",
    "Markdown : un fichier texte réutilisable dans d'autres outils.",
]);
h2("Exporter vers Notion");
para("Si vous avez connecté Notion dans les paramètres, l'article peut être exporté sous forme de page Notion. Un nouvel export met à jour la page existante plutôt que d'en créer une seconde.");
h2("Planifier la publication");
para("Vous pouvez inscrire la date de publication prévue dans un calendrier. Au moment de planifier, choisissez le calendrier de destination :");
table(
    ["Calendrier", "Ce qui est créé"],
    [
        ["Google Calendar", "Un événement daté dans votre agenda Google."],
        ["Notion", "Une page datée dans votre espace Notion."],
    ],
);
note("Prérequis", "Le service choisi doit être connecté au préalable dans « Paramètres ». Sans cela, la planification vous invitera à établir la connexion.");

// ---------- 9. Historique / cycle de vie ----------
h1("9. Historique et cycle de vie des articles");
para("La page « Historique » liste l'ensemble de vos articles, avec des filtres par statut et par type. Vous n'y voyez que vos propres contenus.");
h2("Archivage automatique");
para("Pour garder l'espace lisible dans la durée, les articles publiés depuis plus de trente jours sont archivés automatiquement. L'archivage est « léger » : le corps du texte est retiré, mais la thématique (titre, type) et les liens sont conservés.");
note("Important", "Un article archivé ne peut pas retrouver son texte d'origine. Si vous devez conserver une version complète, pensez à l'exporter (PDF ou Markdown) avant l'échéance.");

// ---------- 10. Entreprise ----------
h1("10. Gérer son entreprise");
para("La section « Entreprise » permet de regrouper plusieurs utilisateurs au sein d'une même organisation, gérée par un propriétaire.");
h2("Créer une entreprise");
steps([
    "Ouvrez « Entreprise » dans le menu latéral.",
    "Saisissez le nom de l'entreprise et validez. Vous en devenez le propriétaire.",
]);
h2("Gérer les membres");
para("En tant que propriétaire, vous pouvez :");
bullets([
    "ajouter un membre en renseignant l'adresse email d'un utilisateur existant,",
    "retirer un membre de l'entreprise,",
    "consulter la liste des membres et leur rôle (propriétaire ou membre).",
]);
note("À noter", "Un utilisateur ne peut appartenir qu'à une seule entreprise à la fois, et le propriétaire ne peut pas être retiré.");

// ---------- 11. Paramètres ----------
h1("11. Paramètres du compte");
para("La page « Paramètres » regroupe la configuration de votre compte, organisée par onglets :");
table(
    ["Onglet", "Contenu"],
    [
        ["Profil", "Nom, email, biographie, avatar."],
        ["Préférences", "Langue de l'interface (français ou anglais), thème clair ou sombre, réglages de génération par défaut."],
        ["Notifications", "Choix des emails que vous souhaitez recevoir."],
        ["Sécurité", "Historique des adresses IP de connexion."],
        ["Intégrations", "Connexion à Notion et à Google Calendar."],
    ],
);
para("Le changement de langue est immédiat et s'applique à toute l'interface.");

// ---------- 12. Administration ----------
h1("12. Administration");
para("Les comptes disposant du rôle administrateur accèdent à un panneau dédié, depuis l'entrée « Admin » du menu latéral. Ce panneau donne accès :");
bullets([
    "aux statistiques globales de la plateforme,",
    "à la liste des utilisateurs et à leur gestion,",
    "au bannissement d'adresses IP.",
]);
para("Ces fonctions ne sont pas visibles pour les comptes standards.");

// ---------- 13. FAQ ----------
h1("13. Questions fréquentes");
h2("Je ne reçois pas le lien de connexion");
para("Vérifiez le dossier des courriers indésirables. Le lien n'est envoyé que si un compte existe pour cette adresse ; assurez-vous d'utiliser l'email associé à votre compte. Le lien expirant vite, demandez-en un nouveau si nécessaire.");
h2("L'export PDF échoue");
para("Réessayez l'opération. Si le problème persiste, rechargez la page puis relancez l'export. Un article vide (sans titre ni contenu) ne peut pas être exporté.");
h2("La génération IA ne répond pas");
para("Le service peut être momentanément indisponible. Patientez quelques instants et relancez. Si l'indisponibilité se prolonge, signalez-le à l'administrateur.");
h2("L'export ou la planification Notion est refusé");
para("Vérifiez que Notion est bien connecté dans « Paramètres » et que la page parente a été partagée avec l'intégration. Reconnectez le service si besoin.");
h2("Un article a disparu de sa forme complète");
para("Il a probablement été archivé automatiquement après trente jours. Seuls le titre, le type et les liens sont alors conservés. Pensez à exporter les contenus importants avant cette échéance.");

// ---------- Pieds de page ----------
const total = doc.getNumberOfPages();
for (let p = 2; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Guide de formation — Plateforme de contenu SEO", M, PH - 10, { baseline: "top" });
    doc.text(String(p - 1), PW - M, PH - 10, { align: "right", baseline: "top" });
}

const out = path.join(__dirname, "guide-formation.pdf");
fs.writeFileSync(out, Buffer.from(doc.output("arraybuffer")));
console.log("PDF écrit :", out, "—", total, "pages");
