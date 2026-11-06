import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponsePayload<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponsePayload<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ResponsePayload<T> | T> {
    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }
}
