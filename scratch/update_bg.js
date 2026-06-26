const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace bg-bg-dark with bg-transparent in section/footer classNames
  content = content.replace(/className="([^"]*)bg-bg-dark([^"]*)"/g, (match, p1, p2) => {
    // Only replace if it's likely a section root (contains py- or relative etc)
    if (p1.includes('py-') || p1.includes('relative') || file === 'Footer.tsx' || file === 'About.tsx') {
      return `className="${p1}bg-transparent${p2}"`;
    }
    return match;
  });

  // Specifically for About.tsx which might have bg-slate-50 or bg-slate-950
  if (file === 'About.tsx') {
    content = content.replace(/bg-slate-50 dark:bg-slate-950/g, 'bg-transparent');
  }

  // Remove lines with absolute inset-0 tech-grid and tech-radial-vignette that are used as section backgrounds
  const lines = content.split('\n');
  const newLines = lines.filter(line => {
    if (line.includes('className="absolute inset-0 tech-grid') || 
        line.includes('className="absolute inset-0 tech-grid-fine pointer-events-none"') ||
        line.includes('className="absolute inset-0 tech-radial-vignette pointer-events-none"') ||
        line.includes('className="absolute inset-0 tech-grid-fine opacity-20 pointer-events-none"')) {
      // Keep it if it has 'mix-blend' or inside a specific component box, but most section ones are just pointer-events-none
      if (line.includes('mix-blend')) return true; // keep
      return false; // remove
    }
    return true;
  });

  content = newLines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  }
}
