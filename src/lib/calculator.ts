'use client';

export interface CalcLineResult {
  value: number | null;
  error: string | null;
}

interface EvaluationResult {
  results: Map<number, CalcLineResult>;
  variables: Map<string, number>;
}

function evaluateExpression(expr: string, scope: Map<string, number>): number {
  let processedExpr = expr;
  const sortedVars = Array.from(scope.keys()).sort((a, b) => b.length - a.length);

  for (const varName of sortedVars) {
    const value = scope.get(varName);
    if (value !== undefined) {
      processedExpr = processedExpr.replace(new RegExp(`\\b${varName}\\b`, 'g'), String(value));
    }
  }

  if (/[a-zA-Z_]/.test(processedExpr)) {
    const undefinedVar = processedExpr.match(/[a-zA-Z_][a-zA-Z0-9_]*/);
    throw new Error(`'${undefinedVar}' is not defined`);
  }
  
  const sanitizedExpr = processedExpr.replace(/\s+/g, '');
  if (!sanitizedExpr) {
    throw new Error('Empty expression');
  }

  if (/[^0-9.\-+*/()]/.test(sanitizedExpr)) {
    throw new Error('Invalid characters in expression');
  }
  
  try {
     return new Function('return ' + sanitizedExpr)();
  } catch (e) {
    throw new Error('Invalid syntax');
  }
 
}

export function evaluateNotebook(text: string): EvaluationResult {
  const lines = text.split('\n');
  const variables = new Map<string, number>();
  const results = new Map<number, CalcLineResult>();

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0 || trimmedLine.startsWith('#')) {
      return;
    }

    try {
      const assignmentMatch = trimmedLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
      if (assignmentMatch) {
        const [, varName, expr] = assignmentMatch;
        if (!expr.trim()) {
            throw new Error("Missing value for assignment");
        }
        const value = evaluateExpression(expr, variables);
        variables.set(varName, value);
        results.set(index, { value, error: null });
      } else {
        const value = evaluateExpression(trimmedLine, variables);
        results.set(index, { value, error: null });
      }
    } catch (e: any) {
      results.set(index, { value: null, error: e.message || 'Invalid expression' });
    }
  });

  return { results, variables };
}
