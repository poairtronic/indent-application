const fs = require('fs');

const files = [
  'src/vendors/vendors.service.spec.ts',
  'src/processes/processes.controller.spec.ts',
  'src/units/units.service.spec.ts',
  'src/processes/processes.service.spec.ts'
];

files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  
  // Remove import RedisCacheService
  text = text.replace(/import\s*\{\s*RedisCacheService\s*\}\s*from\s*['"`][^'"`]+['"`];?\n?/g, '');
  
  // Remove the multiline object for RedisCacheService from providers array
  text = text.replace(/\{\s*provide:\s*RedisCacheService\s*,[\s\S]*?\},?\n?/g, '');
  
  fs.writeFileSync(f, text, 'utf8');
});
