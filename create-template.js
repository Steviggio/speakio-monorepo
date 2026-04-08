const fs = require('fs');
const path = require('path');

const sourceDir = __dirname;
const targetDirName = process.argv[2] || 'fullstack-monorepo-template';
const targetDir = path.join(sourceDir, '..', targetDirName);

const excludeList = [
  '.git',
  'node_modules',
  '.turbo',
  '.next',
  'dist',
  'build',
  '.env',
  '.agent',
  '.mcp'
];

console.log(`Création du template dans : ${targetDir}...`);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Erreur : Le dossier de destination '${targetDir}' existe déjà.`);
  console.error(`Veuillez le supprimer ou choisir un autre nom. (ex: node create-template.js mon-nouveau-projet)`);
  process.exit(1);
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      if (!excludeList.includes(childItemName)) {
        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
      }
    });
  } else {
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
