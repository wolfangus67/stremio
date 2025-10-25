// ...existing code...
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function recherche(val) {
  const container = document.getElementById('search-results');
  const safeVal = (val || "").trim();

  if (!safeVal) {
    container.textContent = "⚠️ Veuillez entrer un mot clé.";
    return;
  }

  container.textContent = `⏳ Recherche en cours pour "${safeVal}"...`;

  // 1. FAQ locale (si définie)
  let localSolution = null;
  if (typeof findSolution === 'function') {
    try {
      localSolution = findSolution(safeVal);
    } catch (e) {
      console.error('Erreur dans findSolution', e);
    }
  }
  if (localSolution && localSolution.length) {
    container.innerHTML = `<h3>✅ Résultat FAQ :</h3><ul>${localSolution.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`;
    return;
  }

  // 2. Subreddits à interroger
  const subreddits = ["Stremio", "StremioAddons"];
  let allPosts = [];

  for (const sub of subreddits) {
    const url = `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.json?q=${encodeURIComponent(safeVal)}&restrict_sr=1&sort=new&limit=10`;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Erreur HTTP ${r.status}`);
      const data = await r.json();
      const posts = (data.data.children || []).map(p => ({
        title: p.data.title,
        link: `https://reddit.com${p.data.permalink}`,
        sub
      }));
      allPosts = allPosts.concat(posts);
    } catch (e) {
      console.error(`❌ Erreur avec le subreddit ${sub}`, e);
      // Probable blocage CORS côté navigateur -> informer l'utilisateur
      if (e instanceof TypeError) {
        container.innerHTML = `❌ Requête bloquée (probable CORS). Pour interroger Reddit depuis le navigateur, utilisez un proxy serveur ou relayer la requête côté backend. Voir la console pour détails.`;
        return;
      }
    }
  }

  // 3. Affichage des résultats
  container.innerHTML = ""; // vider avant affichage
  if (allPosts.length === 0) {
    container.textContent = `❌ Aucun résultat trouvé.`;
    return;
  }

  const title = document.createElement('h3');
  title.textContent = '🔎 Résultats Reddit :';
  container.appendChild(title);

  const list = document.createElement('div');
  allPosts.slice(0, 10).forEach(post => {
    const a = document.createElement('a');
    a.href = post.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = `📌 [${post.sub}] ${post.title}`;
    list.appendChild(a);
    list.appendChild(document.createElement('br'));
  });
  container.appendChild(list);
}
// ...existing code...