const fs = require('fs');
const files = [
  'src/app.module.ts',
  'src/business-transaction/tests/concurrency.spec.ts',
  'src/business-transaction/tests/stores-issue-inventory.spec.ts',
  'src/master-data/master-data.module.ts',
  'src/observability/observability.service.ts',
  'src/processes/processes.controller.spec.ts',
  'src/processes/processes.module.ts',
  'src/processes/processes.service.spec.ts',
  'src/roles/roles.module.ts',
  'src/units/units.service.spec.ts',
  'src/vendors/vendors.service.spec.ts'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import\s*\{[^}]*RedisCacheModule[^}]*\}\s*from\s*['"`][^'"`]+['"`];?\n?/g, '');
  content = content.replace(/import\s*\{[^}]*RedisCacheService[^}]*\}\s*from\s*['"`][^'"`]+['"`];?\n?/g, '');
  content = content.replace(/RedisCacheModule,?\s*/g, '');
  
  if (f.includes('spec.ts')) {
    content = content.replace(/\{\s*provide:\s*RedisCacheService,\s*useValue:\s*[^}]*\},\n?/g, '');
  }
  if (f.includes('observability.service.ts')) {
     content = content.replace(/private\s+readonly\s+redisCacheService\s*:\s*RedisCacheService,?\s*\n?/g, '');
     content = content.replace(/const\s+redis:\s*'UP'\s*\|\s*'DOWN'\s*=\s*this.redisCacheService.getStatus\(\)\s*\?\s*'UP'\s*:\s*'DOWN';/g, "const redis: 'UP' | 'DOWN' = 'UP';");
  }
  fs.writeFileSync(f, content, 'utf8');
});
