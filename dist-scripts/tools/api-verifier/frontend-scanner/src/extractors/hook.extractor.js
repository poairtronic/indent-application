"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHooks = extractHooks;
const ts_morph_1 = require("ts-morph");
function extractHooks(sourceFiles) {
    const hooks = [];
    for (const sourceFile of sourceFiles) {
        // Only analyze files in hooks/ or files starting with 'use'
        if (!sourceFile.getFilePath().includes('hooks') && !sourceFile.getBaseName().startsWith('use'))
            continue;
        const functions = sourceFile.getFunctions();
        const arrowFuncs = sourceFile.getVariableDeclarations().filter(v => v.getInitializerIfKind(ts_morph_1.SyntaxKind.ArrowFunction));
        // A helper to process a function body for React Query calls
        const processFunctionBody = (funcName, bodyNode) => {
            const calls = bodyNode.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
            for (const call of calls) {
                const text = call.getExpression().getText();
                if (text === 'useQuery' || text === 'useMutation' || text === 'useInfiniteQuery') {
                    let queryKey;
                    // First arg is usually options object in v5, or queryKey in v4.
                    // Handle object syntax (React Query v5 standard)
                    const args = call.getArguments();
                    if (args.length > 0) {
                        const firstArg = args[0];
                        if (ts_morph_1.Node.isObjectLiteralExpression(firstArg)) {
                            const queryKeyProp = firstArg.getProperty('queryKey');
                            if (queryKeyProp && ts_morph_1.Node.isPropertyAssignment(queryKeyProp)) {
                                const init = queryKeyProp.getInitializer();
                                if (init && ts_morph_1.Node.isArrayLiteralExpression(init)) {
                                    queryKey = init.getElements().map(e => e.getText());
                                }
                            }
                        }
                        else if (ts_morph_1.Node.isArrayLiteralExpression(firstArg)) {
                            // v4 standard: useQuery(['users'], fetchUsers)
                            queryKey = firstArg.getElements().map(e => e.getText());
                        }
                    }
                    hooks.push({
                        hookName: funcName,
                        queryKey,
                        mutationName: text === 'useMutation' ? funcName : undefined,
                        sourceFile: sourceFile.getFilePath(),
                        lineNumber: call.getStartLineNumber()
                    });
                }
            }
        };
        for (const func of functions) {
            if (func.getName()?.startsWith('use')) {
                processFunctionBody(func.getName(), func);
            }
        }
        for (const v of arrowFuncs) {
            if (v.getName().startsWith('use')) {
                processFunctionBody(v.getName(), v.getInitializer());
            }
        }
    }
    return hooks;
}
