const fs = require('fs');
const path = require('path');

function findFiles(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      findFiles(path.join(dir, file), filter, fileList);
    } else if (filter.test(file)) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = findFiles(path.join(__dirname, 'src'), /\.(ts|tsx)$/);
let results = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  // Simple regex to match useQuery({ queryKey: [...]
  const queryKeyRegex = /queryKey:\s*(\[.*?\])/gs;
  let match;
  while ((match = queryKeyRegex.exec(content)) !== null) {
    results.push({ file: path.relative(__dirname, file), key: match[1].replace(/\s+/g, ' ') });
  }
}

const grouped = {};
for (const res of results) {
  if (!grouped[res.key]) grouped[res.key] = [];
  grouped[res.key].push(res.file);
}

for (const [key, locations] of Object.entries(grouped)) {
  if (locations.length > 1) {
    console.log(`\nDuplicate Query Key: ${key}`);
    locations.forEach(loc => console.log(`  - ${loc}`));
  }
}
