import { ClassDeclaration, SourceFile, CallExpression, Node, SyntaxKind, TemplateExpression } from 'ts-morph';
import { FrontendApiEndpoint } from '../types';

export function extractServices(sourceFiles: SourceFile[]): FrontendApiEndpoint[] {
  const endpoints: FrontendApiEndpoint[] = [];

  for (const sourceFile of sourceFiles) {
    const classes = sourceFile.getClasses();
    
    // Fallback: If no classes (e.g. function-based service), look for apiClient calls
    // Usually services have `class XService extends BaseService`
    for (const cls of classes) {
      if (cls.getName()?.endsWith('Service')) {
        const methods = cls.getMethods();
        for (const method of methods) {
          const callExpressions = method.getDescendantsOfKind(SyntaxKind.CallExpression);
          
          for (const callExpr of callExpressions) {
            const expression = callExpr.getExpression();
            const text = expression.getText();
            
            // Match apiClient.get, apiClient.post, this.get, this.post (from BaseService)
            if (
              text.includes('apiClient.get') || text.includes('apiClient.post') ||
              text.includes('apiClient.put') || text.includes('apiClient.patch') ||
              text.includes('apiClient.delete') ||
              text.includes('this.get') || text.includes('this.post') ||
              text.includes('this.put') || text.includes('this.patch') ||
              text.includes('this.delete')
            ) {
              
              let httpMethod = 'UNKNOWN';
              if (text.includes('.get')) httpMethod = 'GET';
              else if (text.includes('.post')) httpMethod = 'POST';
              else if (text.includes('.put')) httpMethod = 'PUT';
              else if (text.includes('.patch')) httpMethod = 'PATCH';
              else if (text.includes('.delete')) httpMethod = 'DELETE';

              const args = callExpr.getArguments();
              let url = 'unknown';
              if (args.length > 0) {
                const urlArg = args[0];
                if (Node.isStringLiteral(urlArg)) {
                  url = urlArg.getLiteralValue();
                } else if (Node.isTemplateExpression(urlArg)) {
                  url = getTemplateStringLiteral(urlArg);
                } else if (Node.isNoSubstitutionTemplateLiteral(urlArg)) {
                  url = urlArg.getLiteralValue();
                } else {
                  // E.g., it might be a constant imported from api.ts like `API_ENDPOINTS.DETAIL(id)`
                  url = urlArg.getText();
                }
              }

              // Extract generic types: apiClient.get<ResponseDto, RequestDto>
              let responseDto = undefined;
              let requestDto = undefined;
              
              const typeArgs = callExpr.getTypeArguments();
              if (typeArgs.length > 0) {
                responseDto = typeArgs[0].getText();
                if (typeArgs.length > 1) {
                  requestDto = typeArgs[1].getText();
                }
              }

              // If it's a POST/PUT/PATCH, and we didn't get requestDto from generics, try to infer from the second argument
              if (['POST', 'PUT', 'PATCH'].includes(httpMethod) && args.length > 1 && !requestDto) {
                 const bodyArg = args[1];
                 const type = bodyArg.getType();
                 requestDto = type.getText();
                 // Clean up complex object literals or inline types if needed
                 if (requestDto.length > 50 || requestDto.includes('{')) {
                   requestDto = 'InlineObject';
                 }
              }

              endpoints.push({
                service: cls.getName()!,
                hook: '', // Will be matched later or left blank if unused
                method: httpMethod,
                url,
                requestDto,
                responseDto,
                sourceFile: sourceFile.getFilePath(),
                lineNumber: callExpr.getStartLineNumber()
              });
            }
          }
        }
      }
    }
  }

  return endpoints;
}

function getTemplateStringLiteral(node: TemplateExpression): string {
  let str = node.getHead().getLiteralText();
  for (const span of node.getTemplateSpans()) {
    const expr = span.getExpression().getText();
    const literal = span.getLiteral().getLiteralText();
    str += `\${${expr}}${literal}`;
  }
  return str;
}
