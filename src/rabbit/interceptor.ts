// import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
// import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

// @Injectable()
// export class ExampleInterceptor implements NestInterceptor {
//   intercept(context: ExecutionContext, next: CallHandler<any>) {
//     const shouldSkip = isRabbitContext(context);
//     if (shouldSkip) {
//       return next.handle();
//     }

//     // Execute custom interceptor logic for HTTP request/response
//     return next.handle();
//   }
// }