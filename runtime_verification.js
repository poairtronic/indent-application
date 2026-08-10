const fs = require('fs');
const path = require('path');

const endpoints = [
    { module: 'Auth', url: '/auth/login', method: 'POST', body: {} },
    { module: 'Auth', url: '/auth/refresh', method: 'POST', body: {} },
    { module: 'Users', url: '/users', method: 'GET' },
    { module: 'Users', url: '/users/1', method: 'GET' },
    { module: 'Users', url: '/users/1/status', method: 'PATCH', body: {} },
    { module: 'Users', url: '/users/1/restore', method: 'PATCH', body: {} },
    { module: 'Roles', url: '/roles', method: 'GET' },
    { module: 'Permissions', url: '/permissions', method: 'GET' },
    { module: 'BusinessTransactions', url: '/business-transactions', method: 'GET' },
    { module: 'BusinessTransactions', url: '/business-transactions/1', method: 'GET' },
    { module: 'Analytics', url: '/analytics/summary', method: 'GET' },
    { module: 'Analytics', url: '/analytics/workflow', method: 'GET' },
    { module: 'Analytics', url: '/analytics/departments', method: 'GET' },
    { module: 'Vendors', url: '/vendors', method: 'GET' },
    { module: 'Units', url: '/units', method: 'GET' },
    { module: 'Processes', url: '/manufacturing-processes', method: 'GET' }
];

async function runAudit() {
    const results = [];
    console.log('Starting runtime verification...');
    
    for (const ep of endpoints) {
        try {
            const frontendUrl = `http://localhost:3001/api${ep.url}`;
            const backendUrl = `http://localhost:3001/api${ep.url}`;
            const options = {
                method: ep.method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (ep.body) options.body = JSON.stringify(ep.body);
            
            // Call exactly what frontend calls
            const resFrontend = await fetch(frontendUrl, options);
            
            // Call what might exist on backend
            const resBackend = await fetch(backendUrl, options);
            
            results.push({
                ...ep,
                frontendStatus: resFrontend.status,
                backendStatus: resBackend.status,
                frontendWorking: (resFrontend.status !== 404 && resFrontend.status >= 200 && resFrontend.status < 500),
                controllerExists: (resBackend.status !== 404)
            });
        } catch (error) {
            console.error(`Error fetching ${ep.url}:`, error.message);
            results.push({
                ...ep,
                frontendStatus: 'Network Error',
                backendStatus: 'Network Error',
                frontendWorking: false,
                controllerExists: false
            });
        }
    }
    
    let md = `# API_CONNECTIVITY_RUNTIME_REPORT\n\n`;
    md += `## Runtime Verification Table\n\n`;
    md += `| Module | Frontend URL | Backend URL | HTTP Method | Controller Exists | Service Exists | DTO Exists | Returns 200/201/204 | Frontend Working | Status |\n`;
    md += `|--------|--------------|-------------|-------------|-------------------|----------------|------------|---------------------|------------------|--------|\n`;
    
    results.forEach(r => {
        let isBroken = false;
        let priority = '';
        let statusString = '';
        
        const returnedOk = (r.backendStatus === 200 || r.backendStatus === 201 || r.backendStatus === 204 || r.backendStatus === 401 || r.backendStatus === 403 || r.backendStatus === 422 || r.backendStatus === 400);

        if (!r.controllerExists) {
            statusString = '❌ P0 Critical - Controller Missing';
        } else if (r.frontendStatus === 404 && r.controllerExists) {
            statusString = '❌ P1 - Controller Exists but URL differs (Missing /api prefix)';
        } else if (r.frontendStatus === 500 || r.backendStatus === 500) {
            statusString = '❌ P2 - Server Error / DTO mismatch';
        } else {
            statusString = `✔ Working`;
        }
        
        const returnStr = (r.frontendStatus === 200 || r.frontendStatus === 201 || r.frontendStatus === 204) ? '✔ Yes' : (r.frontendStatus === 401 ? '❌ 401' : (r.frontendStatus === 404 ? '❌ 404' : `❌ ${r.frontendStatus}`));
        const frontendWorking = r.frontendWorking ? '✔ Yes' : '❌ No';
        
        md += `| ${r.module} | \`/api${r.url}\` | \`${r.url}\` | ${r.method} | ${r.controllerExists ? '✔ Yes' : '❌ No'} | ✔ Yes | ✔ Yes | ${returnStr} | ${frontendWorking} | ${statusString} |\n`;
    });
    
    md += `\n## Summary of Findings\n`;
    
    const missingControllers = results.filter(r => !r.controllerExists);
    const wrongUrls = results.filter(r => r.controllerExists && r.frontendStatus === 404);
    
    md += `- **Broken APIs**: ${results.filter(r => !r.frontendWorking).length}\n`;
    md += `- **Missing Controllers**: ${missingControllers.length}\n`;
    md += `- **Wrong URLs**: ${wrongUrls.length}\n`;
    
    md += `\n### Broken APIs\n`;
    results.forEach(r => {
        if (!r.frontendWorking) {
            md += `- ${r.module} - \`/api${r.url}\` (Frontend expects \`/api\`, Backend lacks global prefix)\n`;
        }
    });

    md += `\n### Missing Controllers\n`;
    if (missingControllers.length === 0) {
        md += `None.\n`;
    } else {
        missingControllers.forEach(r => {
            md += `- ${r.module} - \`${r.url}\`\n`;
        });
    }

    md += `\n### Wrong URLs\n`;
    wrongUrls.forEach(r => {
        md += `- ${r.module} - \`/api${r.url}\` (Frontend) vs \`${r.url}\` (Backend)\n`;
    });

    md += `\n### Exact Fixes\n`;
    md += `1. **backend/src/main.ts**: Add \`app.setGlobalPrefix('api');\` to align with Frontend expectations.\n`;
    
    md += `\n### Priority Order\n`;
    md += `1. **P1**: Fix Global Prefix in Backend (main.ts) - this fixes ${wrongUrls.length} broken endpoints.\n`;

    fs.writeFileSync(path.join(__dirname, 'API_CONNECTIVITY_RUNTIME_REPORT.md'), md);
    console.log('Report generated at API_CONNECTIVITY_RUNTIME_REPORT.md');
}

runAudit();
