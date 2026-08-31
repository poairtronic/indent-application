const fs = require('fs');
const path = require('path');

const prismaSchemaPath = path.join(__dirname, '../database/schema.prisma');
const schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');

const models = [];
let currentModel = null;

schemaContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('model ')) {
    const modelName = trimmed.split(' ')[1];
    currentModel = { name: modelName, fields: [] };
    models.push(currentModel);
  } else if (trimmed === '}' && currentModel) {
    currentModel = null;
  } else if (currentModel && trimmed && !trimmed.startsWith('//')) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && !trimmed.includes('@@')) {
      const fieldName = parts[0];
      const fieldType = parts[1];
      const isOptional = fieldType.includes('?');
      const isArray = fieldType.includes('[]');
      const isRelation = parts.join(' ').includes('@relation');
      currentModel.fields.push({ fieldName, fieldType, isOptional, isArray, isRelation, raw: trimmed });
    }
  }
});

let dbDoc = `# DATABASE DOCUMENTATION\n\n`;
let erDoc = `# ER DIAGRAM\n\n\`\`\`mermaid\nerDiagram\n`;

for (const m of models) {
  dbDoc += `## Table: ${m.name}\n\n`;
  dbDoc += `| Column | Type | Nullable | Relation | Notes |\n`;
  dbDoc += `|---|---|---|---|---|\n`;

  for (const f of m.fields) {
    dbDoc += `| ${f.fieldName} | ${f.fieldType} | ${f.isOptional ? 'YES' : 'NO'} | ${f.isRelation ? 'YES' : 'NO'} | |\n`;
    
    if (f.isRelation && !f.isArray) {
      const relatedModel = f.fieldType.replace('?', '');
      erDoc += `  ${m.name} }o--|| ${relatedModel} : "${f.fieldName}"\n`;
    } else if (f.isRelation && f.isArray) {
      const relatedModel = f.fieldType.replace('[]', '');
      erDoc += `  ${m.name} ||--o{ ${relatedModel} : "${f.fieldName}"\n`;
    }
  }
  dbDoc += `\n`;
  
  erDoc += `  ${m.name} {\n`;
  for (const f of m.fields) {
    if (!f.isRelation) {
      const typeClean = f.fieldType.replace('?', '').replace('[]', '');
      erDoc += `    ${typeClean} ${f.fieldName}\n`;
    }
  }
  erDoc += `  }\n\n`;
}

erDoc += `\`\`\`\n`;

fs.writeFileSync(path.join(__dirname, '../docs/database/DATABASE_DOCUMENTATION.md'), dbDoc);
fs.writeFileSync(path.join(__dirname, '../docs/database/ER_DIAGRAM.md'), erDoc);
console.log('Database docs generated.');
