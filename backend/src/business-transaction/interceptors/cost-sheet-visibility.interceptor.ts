import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CostSheetVisibilityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      map((data) => {
        return this.filterResponse(data, user);
      }),
    );
  }

  private filterResponse(tx: any, user: any): any {
    if (!tx) return tx;

    const hasCostSheetView =
      !user ||
      user.permissions?.includes('costsheet.view') ||
      user.permissions?.includes('settings.manage');

    // List payload
    if (tx.data && Array.isArray(tx.data) && tx.meta) {
      return {
        ...tx,
        data: tx.data.map((item: any) => this.filterSingleTransaction(item, hasCostSheetView)),
      };
    }

    // Single payload
    return this.filterSingleTransaction(tx, hasCostSheetView);
  }

  private filterSingleTransaction(tx: any, hasCostSheetView: boolean): any {
    if (!tx) return tx;
    if (typeof tx !== 'object') return tx;

    // Check if the object looks like a transaction
    if (!tx.indentNumber && !tx.currentState && !tx.status) {
      return tx;
    }

    const cloned = { ...tx };

    if (!hasCostSheetView) {
      cloned.costSheet = null;
      if (cloned.predictedTotal !== undefined) {
        cloned.predictedTotal = null;
      }
      if (cloned.costNumber !== undefined) {
        cloned.costNumber = null;
      }

      if (cloned.items && Array.isArray(cloned.items)) {
        cloned.items = cloned.items.map((item: any) => {
          if (item.indentProcesses && Array.isArray(item.indentProcesses)) {
            return {
              ...item,
              indentProcesses: item.indentProcesses.map((ip: any) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { predictedCost, actualCost, ...rest } = ip;
                return rest;
              }),
            };
          }
          return item;
        });
      }
    }

    return cloned;
  }
}
