import { ClassDeclaration } from 'ts-morph';

export function extractControllerPath(classDecl: ClassDeclaration): string {
  const controllerDecorator = classDecl.getDecorator('Controller');
  if (!controllerDecorator) return '';

  const args = controllerDecorator.getArguments();
  if (args.length === 0) return '';

  const arg = args[0];
  let path = arg.getText().replace(/['"`]/g, '');
  if (!path.startsWith('/')) path = '/' + path;
  
  return path;
}

export function extractModuleName(classDecl: ClassDeclaration): string {
  // A simple heuristic: check the source file's directory name or if it's exported in a .module.ts file
  const sourceFile = classDecl.getSourceFile();
  const dirName = sourceFile.getDirectory().getBaseName();
  // Capitalize first letter and add 'Module' if we don't have a better way without deep AST traversal of the module graph
  return dirName.charAt(0).toUpperCase() + dirName.slice(1) + 'Module';
}
