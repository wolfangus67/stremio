let faqData = [];
let formulaire = { version: '', appareil: '', probleme: '' };

const versions = ["1.6 (stable)", "1.7 (beta)"];
const appareils = ["Windows", "macOS", "Android", "iOS"];
const problemes = ["Catalogue vide", "Lecture qui bug", "Autre problème"];

window.onload = async () => {
  // Charger FAQ
  const res = await fetch('faq.json');
  faqData = await res.json();

  // Afficher boutons version
  const versionDiv = document.getElementById('step-version');
  versions.forEach(v => {
    const btn = document.createElement('button');
    btn.innerText = v;
    btn.onclick = () => selectVersion(v);
    versionDiv.appendChild(btn);
  });

  // Recherche Reddit + FAQ locale
  document.getElementById('search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') recherche(e.target.value);
  });
};

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

function copier() {
  const texte = document.getElementById('formulaire').innerText;
  navigator.clipboard.writeText(texte);
  alert('✅ Message copié dans le presse-papier');
}

async function recherche(val) {
  // D'abord FAQ locale
  const localSolution = findSolution(val);
  const container = document.getElementById('search-results');
  container.innerHTML = '';
  if (localSolution) {
    container.innerHTML = `<h3>✅ Solution FAQ :</h3><ul>${localSolution.map(s => `<li>${s}</li>`).join('')}</ul>`;
    return;
  }

  // Sinon Reddit
  const url = `https://www.reddit.com/r/Stremio/search.json?q=${encodeURIComponent(val)}&restrict_sr=1`;
  const r = await fetch(url);
  const data = await r.json();
  const posts = data.data.children;

  if (posts.length === 0) {
    container.innerHTML = "❌ Aucun résultat Reddit trouvé.";
    return;
  }

  container.innerHTML = "<h3>🔎 Résultats Reddit :</h3>";
  posts.slice(0, 5).forEach(post => {
    const p = post.data;
    const a = document.createElement('a');
    a.href = `https://reddit.com${p.permalink}`;
    a.target = "_blank";
    a.innerText = `📌 ${p.title}`;
    container.appendChild(a);
    container.appendChild(document.createElement('br'));
  });
}