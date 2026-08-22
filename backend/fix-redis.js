const fs = require('fs');

const target = 'src/redis-cache/redis-cache.service.ts';
let code = fs.readFileSync(target, 'utf8');

const setSearch = `      if (ttlSeconds && ttlSeconds > 0) {
        await this.redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, serialized);
      }`;

const setReplace = `      const multi = this.redisClient.multi();
      if (ttlSeconds && ttlSeconds > 0) {
        multi.set(key, serialized, 'EX', ttlSeconds);
      } else {
        multi.set(key, serialized);
      }

      // Track keys in sets for fast invalidation without SCAN
      const parts = key.split(':');
      if (parts.length >= 1) {
        const p1 = parts[0]; // e.g. "reports"
        multi.sadd(\`idx:\${p1}\`, key);
        if (ttlSeconds) multi.expire(\`idx:\${p1}\`, ttlSeconds);
        
        if (parts.length >= 2) {
           const p2 = p1 + ':' + parts[1]; // e.g. "reports:production"
           multi.sadd(\`idx:\${p2}\`, key);
           if (ttlSeconds) multi.expire(\`idx:\${p2}\`, ttlSeconds);
           
           if (parts.length >= 3 && parts[0] === 'user' && parts[1] === 'notifications') {
             const p3 = p2 + ':' + parts[2]; // e.g. "user:notifications:123"
             multi.sadd(\`idx:\${p3}\`, key);
             if (ttlSeconds) multi.expire(\`idx:\${p3}\`, ttlSeconds);
           }
        }
      }
      await multi.exec();`;

code = code.replace(setSearch, setReplace);

const invalidateSearch = `    try {
      this.logger.log(\`Invalidating keys with pattern: \${pattern}\`);
      let cursor = '0';
      const batchSize = 100;
      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          batchSize,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          this.logger.log(\`Deleted \${keys.length} keys matching pattern: \${pattern}\`);
        }
      } while (cursor !== '0');
    } catch (err) {`;

const invalidateReplace = `    try {
      this.logger.log(\`Invalidating keys with pattern via index: \${pattern}\`);
      let prefix = pattern.replace(/:\\*$/, '').replace(/\\*$/, '');
      if (prefix === 'analytics') prefix = 'analytics'; // handle 'analytics:*'
      if (prefix === 'reports') prefix = 'reports'; // handle 'reports:*'
      
      const idxKey = \`idx:\${prefix}\`;
      const keys = await this.redisClient.smembers(idxKey);
      
      if (keys && keys.length > 0) {
        // chunk deletion to avoid large command payloads
        const chunkSize = 500;
        for (let i = 0; i < keys.length; i += chunkSize) {
           const chunk = keys.slice(i, i + chunkSize);
           await this.redisClient.del(...chunk);
        }
        await this.redisClient.del(idxKey);
        this.logger.log(\`Deleted \${keys.length} keys matching pattern: \${pattern}\`);
      } else {
        // if no keys in index, check if it's an exact key match (not a pattern)
        if (!pattern.includes('*')) {
          await this.redisClient.del(pattern);
        }
      }
    } catch (err) {`;

code = code.replace(invalidateSearch, invalidateReplace);

fs.writeFileSync(target, code, 'utf8');
console.log('Redis SCAN replaced with deterministic set-based invalidation');
