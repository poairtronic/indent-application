import { Project } from 'ts-morph';
import { extractControllerPath, extractModuleName } from './extractors/controller.extractor';
import { extractEndpoints } from './extractors/method.extractor';
import { ApiEndpoint } from './types';

export class ApiScanner {
  private project: Project;

  constructor(tsConfigFilePath: string) {
    this.project = new Project({
      tsConfigFilePath
    });
  }

  public scan(): ApiEndpoint[] {
    const allEndpoints: ApiEndpoint[] = [];
    
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const classes = sourceFile.getClasses();

      for (const classDecl of classes) {
        if (classDecl.getDecorator('Controller')) {
          const controllerPath = extractControllerPath(classDecl);
          const moduleName = extractModuleName(classDecl);
          
          const endpoints = extractEndpoints(classDecl, controllerPath, moduleName);
          allEndpoints.push(...endpoints);
        }
      }
    }

    return allEndpoints;
  }
}
