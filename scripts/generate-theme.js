import fs from 'fs';
import path from 'path';

const theme = JSON.parse(fs.readFileSync(path.resolve('./src/theme.json'), 'utf-8'));

function toKebabCase(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

function generateCssVariables(obj, prefix = '') {
  const lines = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      lines.push(...generateCssVariables(obj[key], `${prefix}${toKebabCase(key)}-`));
    } else if (key !== 'description') {
      lines.push(`  --${prefix}${toKebabCase(key)}: ${obj[key]};`);
    }
  }
  return lines;
}

const cssLines = [':root {
'];

// Generate CSS variables for colors, typography, layout, and components
for (const key in theme) {
  if (['colors', 'typography', 'layout', 'components'].includes(key)) {
    cssLines.push(`  /* ${key} */
`);
    cssLines.push(...generateCssVariables(theme[key], `${toKebabCase(key)}-`));
  }
}

cssLines.push('}');

const cssString = cssLines.join('\n');

// Create styles directory if it doesn\'t exist
if (!fs.existsSync(path.resolve('./src/styles'))) {
  fs.mkdirSync(path.resolve('./src/styles'));
}

fs.writeFileSync(path.resolve('./src/styles/theme.css'), cssString);

console.log('Successfully generated src/styles/theme.css');