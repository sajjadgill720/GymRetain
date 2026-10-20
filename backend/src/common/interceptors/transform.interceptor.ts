import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SSE_METADATA } from '@nestjs/common/constants';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    if (Reflect.getMetadata(SSE_METADATA, context.getHandler())) return next.handle();
    const response = context.switchToHttp().getResponse();
    response.setHeader('Cache-Control', 'no-store');
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        data,
      })),
    );
  }
}
