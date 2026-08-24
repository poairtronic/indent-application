const fs = require('fs');

const files = [
  'src/vendors/vendors.service.spec.ts',
  'src/processes/processes.controller.spec.ts',
  'src/units/units.service.spec.ts',
  'src/processes/processes.service.spec.ts'
];

files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/import\s*\{\s*RedisCacheService\s*\}\s*from\s*['"`][^'"`]+['"`];?\n?/g, '');
  text = text.replace(/\{\s*provide:\s*RedisCacheService,\s*useValue:\s*[^}]*\}\s*,?\n?/g, '');
  text = text.replace(/let\s+redisCacheService[^;]*;\n?/g, '');
  fs.writeFileSync(f, text, 'utf8');
});
