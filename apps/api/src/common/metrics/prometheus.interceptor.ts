import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { httpRequestDuration, httpRequestsTotal } from './prometheus.module';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.url;
    const end = httpRequestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const statusCode = res.statusCode?.toString() || '200';
          end({ status_code: statusCode });
          httpRequestsTotal.inc({ method, route, status_code: statusCode });
        },
        error: (err) => {
          const statusCode = err.status?.toString() || '500';
          end({ status_code: statusCode });
          httpRequestsTotal.inc({ method, route, status_code: statusCode });
        },
      }),
    );
  }
}
