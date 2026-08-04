import { Project } from 'ts-morph';
import { extractServices } from './extractors/service.extractor';
import { extractHooks } from './extractors/hook.extractor';
import { analyzeFrontendApis, AnalysisResults } from './analyzers/quality.analyzer';

export class FrontendApiScanner {
  private project: Project;

  constructor(tsConfigFilePath: string) {
    this.project = new Project({
      tsConfigFilePath
    });
  }

  public scan(): AnalysisResults {
    const sourceFiles = this.project.getSourceFiles();

    console.log(`[Scanner] Extracting services...`);
    const services = extractServices(sourceFiles);

    console.log(`[Scanner] Extracting hooks...`);
    const hooks = extractHooks(sourceFiles);

    console.log(`[Scanner] Analyzing API connections...`);
    return analyzeFrontendApis(services, hooks);
  }
}
