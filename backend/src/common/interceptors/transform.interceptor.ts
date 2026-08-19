import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        let message = 'Operation successful';
        let responseData = data;

        if (data && typeof data === 'object' && 'message' in data && 'data' in data) {
          message = String((data as any).message);
          responseData = (data as any).data;
        }

        return {
          success: true,
          message,
          data: responseData ?? {},
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
