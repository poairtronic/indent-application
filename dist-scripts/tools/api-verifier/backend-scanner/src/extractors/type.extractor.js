"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMethodDto = extractMethodDto;
exports.extractResponseType = extractResponseType;
function extractMethodDto(methodDecl) {
    const result = {};
    const parameters = methodDecl.getParameters();
    for (const param of parameters) {
        const hasBody = param.getDecorator('Body') !== undefined;
        const hasQuery = param.getDecorator('Query') !== undefined;
        const hasParam = param.getDecorator('Param') !== undefined;
        const paramType = param.getTypeNode()?.getText() || param.getType().getText();
        if (hasBody)
            result.bodyDto = cleanType(paramType);
        if (hasQuery)
            result.queryDto = cleanType(paramType);
        if (hasParam)
            result.paramsDto = cleanType(paramType);
    }
    return result;
}
function extractResponseType(methodDecl) {
    const returnTypeNode = methodDecl.getReturnTypeNode();
    if (returnTypeNode) {
        return cleanType(returnTypeNode.getText());
    }
    return cleanType(methodDecl.getReturnType().getText());
}
function cleanType(typeStr) {
    // Remove import("..."). stuff that ts-morph sometimes returns
    return typeStr.replace(/import\([^)]+\)\./g, '').trim();
}
