"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendApiScanner = void 0;
const ts_morph_1 = require("ts-morph");
const service_extractor_1 = require("./extractors/service.extractor");
const hook_extractor_1 = require("./extractors/hook.extractor");
const quality_analyzer_1 = require("./analyzers/quality.analyzer");
class FrontendApiScanner {
    project;
    constructor(tsConfigFilePath) {
        this.project = new ts_morph_1.Project({
            tsConfigFilePath
        });
    }
    scan() {
        const sourceFiles = this.project.getSourceFiles();
        console.log(`[Scanner] Extracting services...`);
        const services = (0, service_extractor_1.extractServices)(sourceFiles);
        console.log(`[Scanner] Extracting hooks...`);
        const hooks = (0, hook_extractor_1.extractHooks)(sourceFiles);
        console.log(`[Scanner] Analyzing API connections...`);
        return (0, quality_analyzer_1.analyzeFrontendApis)(services, hooks);
    }
}
exports.FrontendApiScanner = FrontendApiScanner;
