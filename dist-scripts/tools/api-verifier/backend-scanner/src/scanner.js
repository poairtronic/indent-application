"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiScanner = void 0;
const ts_morph_1 = require("ts-morph");
const controller_extractor_1 = require("./extractors/controller.extractor");
const method_extractor_1 = require("./extractors/method.extractor");
class ApiScanner {
    project;
    constructor(tsConfigFilePath) {
        this.project = new ts_morph_1.Project({
            tsConfigFilePath
        });
    }
    scan() {
        const allEndpoints = [];
        const sourceFiles = this.project.getSourceFiles();
        for (const sourceFile of sourceFiles) {
            const classes = sourceFile.getClasses();
            for (const classDecl of classes) {
                if (classDecl.getDecorator('Controller')) {
                    const controllerPath = (0, controller_extractor_1.extractControllerPath)(classDecl);
                    const moduleName = (0, controller_extractor_1.extractModuleName)(classDecl);
                    const endpoints = (0, method_extractor_1.extractEndpoints)(classDecl, controllerPath, moduleName);
                    allEndpoints.push(...endpoints);
                }
            }
        }
        return allEndpoints;
    }
}
exports.ApiScanner = ApiScanner;
