import { SourceFile, CallExpression, Node, SyntaxKind, TemplateExpression } from 'ts-morph';
import { FrontendApiEndpoint } from '../types';

export function extractServices(sourceFiles: SourceFile[]): FrontendApiEndpoint[] {
  const endpoints: FrontendApiEndpoint[] = [];

  for (const sourceFile of sourceFiles) {
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const callExpr of callExpressions) {
      const expression = callExpr.getExpression();
      const text = expression.getText();

      if (!isApiCallExpression(text)) {
        continue;
      }

      const serviceName = getServiceName(callExpr);
      if (!serviceName || serviceName === 'BaseService') {
        continue;
      }

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
          url = urlArg.getText();
        }
      }

      let responseDto = undefined;
      let requestDto = undefined;

      const typeArgs = callExpr.getTypeArguments();
      if (typeArgs.length > 0) {
        responseDto = typeArgs[0].getText();
        if (typeArgs.length > 1) {
          requestDto = typeArgs[1].getText();
        }
      }

      if (['POST', 'PUT', 'PATCH'].includes(httpMethod) && args.length > 1 && !requestDto) {
        const bodyArg = args[1];
        const type = bodyArg.getType();
        requestDto = type.getText();
        if (requestDto.length > 50 || requestDto.includes('{')) {
          requestDto = 'InlineObject';
        }
      }

      endpoints.push({
        service: serviceName,
        hook: '',
        method: httpMethod,
        url,
        requestDto,
        responseDto,
        sourceFile: sourceFile.getFilePath(),
        lineNumber: callExpr.getStartLineNumber(),
      });
    }
  }

  return endpoints;
}

function isApiCallExpression(text: string): boolean {
  return (
    text.includes('apiClient.get') ||
    text.includes('apiClient.post') ||
    text.includes('apiClient.put') ||
    text.includes('apiClient.patch') ||
    text.includes('apiClient.delete') ||
    text.includes('this.get') ||
    text.includes('this.post') ||
    text.includes('this.put') ||
    text.includes('this.patch') ||
    text.includes('this.delete')
  );
}

function getServiceName(callExpr: CallExpression): string | undefined {
  let current: Node | undefined = callExpr;

  while (current) {
    if (Node.isClassDeclaration(current)) {
      const name = current.getName();
      if (name && (name.endsWith('Service') || name.toLowerCase().includes('service'))) {
        return name;
      }
    }

    if (Node.isVariableDeclaration(current)) {
      const name = current.getName();
      if (name && (name.endsWith('Service') || name.toLowerCase().includes('service'))) {
        return name;
      }
    }

    current = current.getParent();
  }

  return undefined;
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
