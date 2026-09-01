const fs = require('fs');
const path = require('path');

const files = [
  'apps/web/app/(main)/resources/page.tsx',
  'apps/web/app/(main)/resources/components/DomainGroupCard.tsx',
  'apps/web/app/(main)/resources/components/LanguageFilterPopover.tsx',
  'apps/web/app/(main)/resources/utils.ts',
  'apps/api/src/resources/services/resource-content-normalization.service.ts',
  'apps/web/lib/api/resources.ts',
  'apps/api/scripts/db-check.ts',
  'apps/api/scripts/drop-index.ts',
  'apps/api/scripts/import-and-publish-all.ts'
];

for (const file of files) {
  const filePath = path.resolve(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove TSX curly brace comments first
    content = content.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
    
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove single line comments
    // Using negative lookbehind for : to avoid removing http://
    // However, JS regex negative lookbehind might not be supported in older Node, 
    // but Node 20+ supports it.
    content = content.replace(/(?<!:)\/\/.*$/gm, '');
    
    // Remove empty lines created by comment removal (multiple blank lines to single blank line)
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`Removed comments from ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
