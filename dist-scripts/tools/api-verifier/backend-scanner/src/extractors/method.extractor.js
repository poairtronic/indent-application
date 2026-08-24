"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEndpoints = extractEndpoints;
const type_extractor_1 = require("./type.extractor");
const HTTP_METHODS = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Options', 'Head'];
function extractEndpoints(classDecl, controllerPath, moduleName) {
    const endpoints = [];
    const methods = classDecl.getMethods();
    // Class level guards and roles (applied to all methods)
    const classGuards = extractGuards(classDecl);
    const classRoles = extractRoles(classDecl);
    const classTags = extractSwaggerTags(classDecl);
    for (const method of methods) {
        for (const decorator of method.getDecorators()) {
            const decoratorName = decorator.getName();
            if (HTTP_METHODS.includes(decoratorName)) {
                const httpMethod = decoratorName.toUpperCase();
                // Extract path from decorator argument e.g. @Get('users/:id')
                let methodPath = '';
                const args = decorator.getArguments();
                if (args.length > 0) {
                    methodPath = args[0].getText().replace(/['"`]/g, '');
                }
                if (methodPath && !methodPath.startsWith('/'))
                    methodPath = '/' + methodPath;
                const fullPath = (controllerPath === '/' && methodPath === '') ? '/' :
                    `${controllerPath === '/' ? '' : controllerPath}${methodPath}`;
                const dtos = (0, type_extractor_1.extractMethodDto)(method);
                const methodGuards = extractGuards(method);
                const methodRoles = extractRoles(method);
                endpoints.push({
                    controller: classDecl.getName() || 'UnknownController',
                    module: moduleName,
                    method: httpMethod,
                    path: methodPath,
                    fullPath,
                    dto: dtos.bodyDto,
                    queryDto: dtos.queryDto,
                    paramsDto: dtos.paramsDto,
                    response: (0, type_extractor_1.extractResponseType)(method),
                    guards: [...new Set([...classGuards, ...methodGuards])],
                    roles: [...new Set([...classRoles, ...methodRoles])],
                    swagger: {
                        summary: extractSwaggerSummary(method),
                        tags: classTags,
                        responses: extractSwaggerResponses(method)
                    },
                    sourceFile: classDecl.getSourceFile().getFilePath(),
                    lineNumber: method.getStartLineNumber()
                });
            }
        }
    }
    return endpoints;
}
function extractGuards(node) {
    const guards = [];
    const decorator = node.getDecorator('UseGuards');
    if (decorator) {
        decorator.getArguments().forEach(arg => guards.push(arg.getText()));
    }
    return guards;
}
function extractRoles(node) {
    const roles = [];
    // Try @Roles() and @Permissions()
    const decorator = node.getDecorator('Roles') || node.getDecorator('Permissions') || node.getDecorator('RequirePermissions');
    if (decorator) {
        decorator.getArguments().forEach(arg => {
            // Remove array brackets if it's an array literal
            const text = arg.getText().replace(/^\[|\]$/g, '').trim();
            text.split(',').forEach(role => roles.push(role.trim().replace(/['"`]/g, '')));
        });
    }
    return roles.filter(Boolean);
}
function extractSwaggerTags(node) {
    const tags = [];
    const decorator = node.getDecorator('ApiTags');
    if (decorator) {
        decorator.getArguments().forEach(arg => tags.push(arg.getText().replace(/['"`]/g, '')));
    }
    return tags;
}
function extractSwaggerSummary(node) {
    const decorator = node.getDecorator('ApiOperation');
    if (decorator) {
        const args = decorator.getArguments();
        if (args.length > 0) {
            const obj = args[0].getText();
            const match = obj.match(/summary\s*:\s*['"`]([^'"`]+)['"`]/);
            if (match)
                return match[1];
        }
    }
    return undefined;
}
function extractSwaggerResponses(node) {
    const responses = [];
    for (const decorator of node.getDecorators()) {
        if (decorator.getName() === 'ApiResponse' || decorator.getName().startsWith('Api') && decorator.getName().endsWith('Response')) {
            const name = decorator.getName();
            // Handle @ApiOkResponse(), @ApiCreatedResponse() etc.
            let status = 'default';
            if (name === 'ApiOkResponse')
                status = 200;
            else if (name === 'ApiCreatedResponse')
                status = 201;
            else if (name === 'ApiAcceptedResponse')
                status = 202;
            else if (name === 'ApiNoContentResponse')
                status = 204;
            else if (name === 'ApiBadRequestResponse')
                status = 400;
            else if (name === 'ApiUnauthorizedResponse')
                status = 401;
            else if (name === 'ApiForbiddenResponse')
                status = 403;
            else if (name === 'ApiNotFoundResponse')
                status = 404;
            else if (name === 'ApiInternalServerErrorResponse')
                status = 500;
            else if (name === 'ApiResponse') {
                const args = decorator.getArguments();
                if (args.length > 0) {
                    const obj = args[0].getText();
                    const match = obj.match(/status\s*:\s*(\d+)/);
                    if (match)
                        status = parseInt(match[1], 10);
                }
            }
            responses.push({ status });
        }
    }
    return responses;
}
