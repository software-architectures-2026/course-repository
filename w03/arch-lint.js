// Layered architecture linter for EventHub
// Fails if any layer violates dependency rules
const fs = require('fs');
const path = require('path');

const rules = [
  {
    layer: 'routes',
    dir: 'src/routes',
    allowed: ['../services'],
    forbidden: ['../repositories'],
  },
  {
    layer: 'services',
    dir: 'src/services',
    allowed: ['../repositories', '../services'],
    forbidden: ['../routes'],
  },
  {
    layer: 'repositories',
    dir: 'src/repositories',
    allowed: [],
    forbidden: ['../services', '../routes'],
  },
];

function scanFile(file, rule) {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /require\(['"](.*?)['"]\)/g;
  let match;
  const violations = [];
  while ((match = importRegex.exec(content))) {
    const imp = match[1];
    if (rule.forbidden.some(f => imp.startsWith(f))) {
      violations.push(`Forbidden import in ${file}: ${imp}`);
    }
    if (rule.allowed.length && !rule.allowed.some(a => imp.startsWith(a)) && imp.startsWith('..')) {
      violations.push(`Disallowed import in ${file}: ${imp}`);
    }
  }
  return violations;
}

function scanDir(dir, rule) {
  const absDir = path.join(__dirname, dir);
  if (!fs.existsSync(absDir)) return [];
  const files = fs.readdirSync(absDir).filter(f => f.endsWith('.js'));
  let violations = [];
  for (const file of files) {
    violations = violations.concat(scanFile(path.join(absDir, file), rule));
  }
  return violations;
}

function main() {
  let allViolations = [];
  for (const rule of rules) {
    allViolations = allViolations.concat(scanDir(rule.dir, rule));
  }
  if (allViolations.length) {
    console.error('Layered architecture violations found:');
    allViolations.forEach(v => console.error(v));
    process.exit(1);
  } else {
    console.log('Layered architecture rules PASSED.');
  }
}

if (require.main === module) {
  main();
}
