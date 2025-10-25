// ========================
// ⚙️ Mode DEBUG activable ici
// ========================
const DEBUG = true;

let faqData = [];
let formulaire = { version: '', appareil: '', probleme: '' };

const versions = ["1.6 (stable)", "1.7 (beta)"];
const appareils = ["Windows", "macOS", "Android", "iOS"];
const problemes = ["Catalogue vide", "Lecture qui bug", "Autre problème"];

window.onload = async () => {
  // Charger FAQ locale
  const res = await fetch('faq.json');
  faqData = await res.json();

  // Boutons de version
  const versionDiv = document.getElementById('step-version');
  versions.forEach(v => {
    const btn = document.createElement('button');
    btn.innerText = v;
    btn.onclick = () => selectVersion(v);
    versionDiv.appendChild(btn);
  });

  // Événements recherche
  const searchInput = document.getElementById('search');
  const searchBtn = document.getElementById('search-btn');

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') recherche(searchInput.value);
  });

  searchBtn.addEventListener('click', () => {
    recherche(searchInput.value);
  });
};

// === GUIDAGE FAQ ===
function selectVersion(v) {
  formulaire.version = v;
  const deviceDiv = document.getElementById('step-device');
  deviceDiv.innerHTML = '';
  appareils.forEach(a => {
    const btn = document.createElement('button');
    btn.innerText = a;
    btn.onclick = () => selectAppareil(a);
    deviceDiv.appendChild(btn);
  });
}

function selectAppareil(a) {
  formulaire.appareil = a;
  const problemDiv = document.getElementById('step-problem');
  problemDiv.innerHTML = '';
  problemes.forEach(p => {
    const btn = document.createElement('button');
    btn.innerText = p;
    btn.onclick = () => selectProbleme(p);
    problemDiv.appendChild(btn);
  });
}

function selectProbleme(p) {
  formulaire.probleme = p;
  const solution = findSolution(p);
  if (solution) {
    afficherSolution(solution);
  } else {
    genererFormulaire();
  }
}

// === RECHERCHE FAQ LOCALE ===
function findSolution(keyword) {
  keyword = keyword.toLowerCase();
  const match = faqData.find(item =>
    item.motsCles.some(c => keyword.includes(c.toLowerCase()))
  );
  return match ? match.solutions : null;
}

function afficherSolution(sol) {
  document.getElementById('solution').innerHTML =
    '<h3>✅ Solution trouvée :</h3><ul>' +
    sol.map(s => `<li>${s}</li>`).join('') +
    '</ul>';
  document.getElementById('formulaire-container').style.display = 'none';
}

function genererFormulaire() {
  const texte = `
[Titre du post]
Stremio - ${formulaire.probleme} sur ${formulaire.appareil}

[Version de Stremio]
${formulaire.version}

[Appareil]
${formulaire.appareil}

[Problème]
${formulaire.probleme}

[Ce que j’ai déjà essayé]
(none)
`;
  document.getElementById('solution').innerHTML = '';
  document.getElementById('formulaire-container').style.display = 'block';
  document.getElementById('formulaire').innerText = texte;

  const redditUrl = `https://www.reddit.com/r/Stremio/submit?selftext=${encodeURIComponent(texte)}`;
  document.getElementById('poster').href = redditUrl;
}

// === BOUTON COPIER ===
function copier() {
  const texte = document.getElementById('formulaire').innerText;
  navigator.clipboard.writeText(texte);
  alert('✅ Message copié dans le presse-papier');
}

// === RECHERCHE REDDIT VIA ALLOoRIGINS (CORS FIX) ===
async function recherche(val) {
  const container = document.getElementById('search-results');
  container.innerHTML = `⏳ Recherche en cours pour "<strong>${val}</strong>"...`;

  if (DEBUG) console.log("[DEBUG] Recherche lancée avec :", val);

  if (!val || val.trim() === "") {
    container.innerHTML = "⚠️ Veuillez entrer un mot clé.";
    if (DEBUG) console.warn("[DEBUG] Mot-clé vide.");
    return;
  }

  // 1. Vérification FAQ locale
  const localSolution = findSolution(val);
  if (localSolution) {
    if (DEBUG) console.log("[DEBUG] Résultat trouvé dans FAQ :", localSolution);
    container.innerHTML = `<h3>✅ Résultat FAQ :</h3><ul>${localSolution.map(s => `<li>${s}</li>`).join('')}</ul>`;
    return;
  }

  // 2. Requêtes Reddit via proxy
  const subreddits = ["Stremio", "StremioAddons"];
  let allPosts = [];

  for (const sub of subreddits) {
    const target = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(val)}&restrict_sr=1&sort=new`;
    const url = `https://corsproxy.io/?${encodeURIComponent(target)}`;


    if (DEBUG) console.log(`[DEBUG] Requête Reddit via proxy → ${url}`);

    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Erreur HTTP ${r.status}`);
      const data = await r.json();


      const posts = data.data.children.map(p => ({
        title: p.data.title,
        link: `https://reddit.com${p.data.permalink}`,
        sub
      }));

      if (DEBUG) console.log(`[DEBUG] ${sub} - ${posts.length} résultats`);
      allPosts = allPosts.concat(posts);

    } catch (e) {
      console.error(`[DEBUG] ❌ Erreur avec ${sub}`, e);
    }
  }

  // 3. Affichage
  if (allPosts.length === 0) {
    container.innerHTML = `❌ Aucun résultat trouvé ou requête bloquée.`;
    if (DEBUG) console.warn("[DEBUG] Aucun résultat Reddit.");
    return;
  }

  container.innerHTML = `<h3>🔎 Résultats Reddit :</h3>`;
  allPosts.slice(0, 10).forEach(post => {
    const a = document.createElement('a');
    a.href = post.link;
    a.target = "_blank";
    a.innerText = `📌 [${post.sub}] ${post.title}`;
    container.appendChild(a);
    container.appendChild(document.createElement('br'));
  });

  if (DEBUG) console.log(`[DEBUG] Affichage final de ${allPosts.length} résultats`);

  // 4. Bloc JSON debug optionnel
  if (DEBUG) {
    const debugBox = document.createElement('pre');
    debugBox.style.background = "#eee";
    debugBox.style.padding = "1rem";
    debugBox.style.maxHeight = "300px";
    debugBox.style.overflow = "auto";
    debugBox.innerText = JSON.stringify(allPosts, null, 2);
    container.appendChild(debugBox);
  }
}
