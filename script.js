async function recherche(val) {
  const container = document.getElementById('search-results');
  container.innerHTML = `⏳ Recherche en cours pour "<strong>${val}</strong>"...`;

  if (!val || val.trim() === "") {
    container.innerHTML = "⚠️ Veuillez entrer un mot clé.";
    return;
  }

  // 1. FAQ locale
  const localSolution = findSolution(val);
  if (localSolution) {
    container.innerHTML = `<h3>✅ Résultat FAQ :</h3><ul>${localSolution.map(s => `<li>${s}</li>`).join('')}</ul>`;
    return;
  }

  // 2. Subreddits à interroger
  const subreddits = ["Stremio", "StremioAddons"];
  let allPosts = [];

  for (const sub of subreddits) {
    const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(val)}&restrict_sr=1&sort=new`;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Erreur HTTP ${r.status}`);
      const data = await r.json();
      const posts = data.data.children.map(p => ({
        title: p.data.title,
        link: `https://reddit.com${p.data.permalink}`,
        sub
      }));
      allPosts = allPosts.concat(posts);
    } catch (e) {
      console.error(`❌ Erreur avec le subreddit ${sub}`, e);
    }
  }

  // 3. Affichage des résultats
  if (allPosts.length === 0) {
    container.innerHTML = `❌ Aucun résultat trouvé ou requête bloquée.`;
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
}
