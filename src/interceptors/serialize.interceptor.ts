import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { plainToClass } from 'class-transformer';

//this creates a decorator for the serializer
export function Serialize(dto: any) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(
    context: ExecutionContext,
    handler: CallHandler<any>,
  ): Observable<any> {
    // Run something before a request is handled by the request handler

    return handler.handle().pipe(
      // data is the incoming entity from the service
      map((data: any) => {
        //Run something before the response is sent out
        return plainToClass(this.dto, data, {
          // This makes sure only properties with @expose() are sent!!
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
