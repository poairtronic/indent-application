const fs = require('fs');
const path = require('path');

function walkDir(dir, filter, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, filter, callback);
        } else if (filter.test(fullPath)) {
            callback(fullPath);
        }
    }
}

console.log("=== BACKEND CONTROLLERS ===");
walkDir(path.join(__dirname, 'backend/src'), /\.controller\.ts$/, (file) => {
    const content = fs.readFileSync(file, 'utf-8');
    const controllerMatch = content.match(/@Controller\(['"]([^'"]+)['"]\)/);
    const basePath = controllerMatch ? controllerMatch[1] : '';
    console.log(`\nFile: ${path.relative(__dirname, file)}`);
    console.log(`Base Path: /${basePath}`);
    
    const lines = content.split('\n');
    let currentMethod = '';
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const routeMatch = line.match(/@(Get|Post|Put|Patch|Delete)\(['"]?([^'"]*)['"]?\)/);
        if (routeMatch) {
            const httpMethod = routeMatch[1].toUpperCase();
            let routePath = routeMatch[2];
            if (routePath && !routePath.startsWith('/')) routePath = '/' + routePath;
            console.log(`  - ${httpMethod} /${basePath}${routePath}`);
        }
    }
});

console.log("\n=== FRONTEND API CALLS (axios) ===");
walkDir(path.join(__dirname, 'frontend/src'), /\.(ts|tsx)$/, (file) => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('axios.') || line.includes('api.get') || line.includes('api.post') || line.includes('api.put') || line.includes('api.patch') || line.includes('api.delete')) {
            console.log(`${path.relative(__dirname, file)}:${i+1}: ${line.trim()}`);
        }
    });
});

console.log("\n=== FRONTEND ENDPOINTS CONSTANTS ===");
walkDir(path.join(__dirname, 'frontend/src/constants'), /\.ts$/, (file) => {
    const content = fs.readFileSync(file, 'utf-8');
    console.log(`\nFile: ${path.relative(__dirname, file)}`);
    const lines = content.split('\n');
    lines.forEach((line) => {
        if (line.includes('=')) {
            console.log(`  ${line.trim()}`);
        }
    });
});

