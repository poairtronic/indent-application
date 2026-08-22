const fs = require('fs');

const file = 'src/business-transaction/services/business-transaction.service.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: Make cache invalidation non-blocking
content = content.replace(
`  private async invalidateMetadataCache(): Promise<void> {
    try {
      await Promise.all([`,
`  private invalidateMetadataCache(): void {
    try {
      Promise.all([`
);
content = content.replace(
`        this.cacheService.invalidateByPattern('analytics:insights:*'),
      ]);
    } catch (err) {
      this.logger.warn(\`Failed to invalidate metadata cache: \${err.message}\`);`,
`        this.cacheService.invalidateByPattern('analytics:insights:*'),
      ]).catch(err => this.logger.warn(\`Failed to invalidate metadata cache async: \${err.message}\`));
    } catch (err) {
      this.logger.warn(\`Failed to trigger metadata cache invalidation: \${err.message}\`);`
);

content = content.replace(
`  private async invalidateWorkflowCache(): Promise<void> {
    try {
      await Promise.all([`,
`  private invalidateWorkflowCache(): void {
    try {
      Promise.all([`
);
content = content.replace(
`        this.cacheService.invalidateByPattern('reports:workflow:*'),
      ]);
    } catch (err) {
      this.logger.warn(\`Failed to invalidate workflow cache: \${err.message}\`);`,
`        this.cacheService.invalidateByPattern('reports:workflow:*'),
      ]).catch(err => this.logger.warn(\`Failed to invalidate workflow cache async: \${err.message}\`));
    } catch (err) {
      this.logger.warn(\`Failed to trigger workflow cache invalidation: \${err.message}\`);`
);

content = content.replace(
`  private async invalidateCostCache(): Promise<void> {
    try {
      await Promise.all([`,
`  private invalidateCostCache(): void {
    try {
      Promise.all([`
);
content = content.replace(
`        this.cacheService.invalidateByPattern('reports:production:*'),
      ]);
    } catch (err) {
      this.logger.warn(\`Failed to invalidate cost cache: \${err.message}\`);`,
`        this.cacheService.invalidateByPattern('reports:production:*'),
      ]).catch(err => this.logger.warn(\`Failed to invalidate cost cache async: \${err.message}\`));
    } catch (err) {
      this.logger.warn(\`Failed to trigger cost cache invalidation: \${err.message}\`);`
);

content = content.replace(
`  private async invalidateAllCache(): Promise<void> {
    try {
      await Promise.all([`,
`  private invalidateAllCache(): void {
    try {
      Promise.all([`
);
content = content.replace(
`        this.cacheService.invalidateByPattern('analytics:*'),
      ]);
    } catch (err) {
      this.logger.warn(\`Failed to invalidate all cache: \${err.message}\`);`,
`        this.cacheService.invalidateByPattern('analytics:*'),
      ]).catch(err => this.logger.warn(\`Failed to invalidate all cache async: \${err.message}\`));
    } catch (err) {
      this.logger.warn(\`Failed to trigger all cache invalidation: \${err.message}\`);`
);

// Fix 2: Remove redundant post-mutation fetches
content = content.replace(/await this\.invalidateMetadataCache\(\);/g, 'this.invalidateMetadataCache();');
content = content.replace(/await this\.invalidateWorkflowCache\(\);/g, 'this.invalidateWorkflowCache();');
content = content.replace(/await this\.invalidateCostCache\(\);/g, 'this.invalidateCostCache();');
content = content.replace(/await this\.invalidateAllCache\(\);/g, 'this.invalidateAllCache();');

content = content.replace(/return this\.findTransactionForResponse\(id\);/g, 'return { id, success: true };');
content = content.replace(/return this\.findTransactionById\(result\.indent\.id\);/g, 'return { id: result.indent.id, success: true };');

fs.writeFileSync(file, content);
console.log('Fixed business transaction service successfully');
