import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        // If the service already returns data and meta (e.g., pagination), pass it through
        if (res && res.data !== undefined && res.meta !== undefined) {
          return res;
        }

        // Clean up Mongoose internal fields if returning Documents directly
        let cleanedData = res;
        if (res && typeof res === 'object') {
          if (Array.isArray(res)) {
            cleanedData = res.map((item) =>
              item.toObject ? item.toObject({ versionKey: false }) : item,
            );
          } else if (res.toObject) {
            cleanedData = res.toObject({ versionKey: false });
          }
        }

        return { data: cleanedData };
      }),
    );
  }
}
