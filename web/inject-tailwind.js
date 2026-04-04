// Script to inject Tailwind CDN into Next.js static export
// Run after: npm run build
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const indexFile = path.join(outDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error('index.html not found in out/ directory');
  process.exit(1);
}

let html = fs.readFileSync(indexFile, 'utf8');

// Inject Tailwind CDN before </head>
if (!html.includes('cdn.tailwindcss.com')) {
  html = html.replace('</head>', '<script src="https://cdn.tailwindcss.com"></script>\n</head>');
  fs.writeFileSync(indexFile, html);
  console.log('✅ Tailwind CDN injected into index.html');
} else {
  console.log('✅ Tailwind CDN already present');
}
