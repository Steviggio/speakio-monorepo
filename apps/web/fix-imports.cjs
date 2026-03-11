const fs = require('fs');
const { execSync } = require('child_process');

try {
  const output = execSync('git grep -l "@/components/ui/[A-Z]"', { encoding: 'utf8' });
  const files = output.split('\n').filter(Boolean);

  for (const f of files) {
    if (!f.endsWith('.tsx') && !f.endsWith('.ts')) continue;
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/@\/components\/ui\/([A-Za-z]+)/g, (match, p1) => {
      return `@/components/ui/${p1.toLowerCase()}`;
    });
    fs.writeFileSync(f, content);
    console.log('Fixed imports in', f);
  }
} catch (e) {
  console.log('No matches or error:', e.message);
}
