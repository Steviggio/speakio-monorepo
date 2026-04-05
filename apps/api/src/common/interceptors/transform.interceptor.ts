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
        if (res && res.data !== undefined && res.meta !== undefined) {
          return res;
        }

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
