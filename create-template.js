const fs = require('fs');
const path = require('path');

// Le dossier source est le répertoire actuel (racine du projet Antigravity)
const sourceDir = __dirname;
// Le nom du dossier cible peut être passé en argument, sinon par défaut 'fullstack-monorepo-template'
const targetDirName = process.argv[2] || 'fullstack-monorepo-template';
// On crée le dossier cible au même niveau que le dossier actuel
const targetDir = path.join(sourceDir, '..', targetDirName);

// Liste des dossiers et fichiers à exclure de la copie
const excludeList = [
  '.git',
  'node_modules',
  '.turbo',
  '.next',
  'dist',
  'build',
  '.env', // On exclut .env pour des raisons de sécurité, mais on garde .env.example
  '.agent',
  '.mcp'
];

console.log(`Création du template dans : ${targetDir}...`);

// Sécurité : on vérifie que le dossier n'existe pas déjà
if (fs.existsSync(targetDir)) {
  console.error(`❌ Erreur : Le dossier de destination '${targetDir}' existe déjà.`);
  console.error(`Veuillez le supprimer ou choisir un autre nom. (ex: node create-template.js mon-nouveau-projet)`);
  process.exit(1);
}

// Fonction récursive pour copier les dossiers et fichiers
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      // On vérifie si l'élément (dossier ou fichier) est dans la liste d'exclusion
      if (!excludeList.includes(childItemName)) {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      }
    });
  } else {
    // Si c'est un fichier, on le copie simplement
    fs.copyFileSync(src, dest);
  }
}

try {
  copyRecursiveSync(sourceDir, targetDir);
  console.log('✅ Structure copiée avec succès !');
  console.log('\n--- PROCHAINES ÉTAPES ---');
  console.log(`1. Allez dans le nouveau dossier : cd ../${targetDirName}`);
  console.log(`2. Initialisez un nouveau dépôt Git : git init`);
  console.log(`3. Installez les dépendances : npm install`);
  console.log(`4. Nettoyez le code métier (Business logic) dans apps/web et apps/api pour ne garder que la structure de base.`);
} catch (error) {
  console.error('❌ Erreur lors de la copie des fichiers :', error);
}
