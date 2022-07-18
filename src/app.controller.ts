import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ConsumeMessage } from 'amqplib';
import { AppService } from './app.service';
import { JobCompletedV1 } from './messages/job.completed.v1';
import { JobCreatedV1 } from './messages/job.created.v1';
import { PaymentCreatedV1 } from './messages/payment.created.v1';
// import { ExampleInterceptor } from './rabbit/interceptor';
import { MessageToQueueDefAdapter } from './rabbit/messageAdapter';

// import { ASRabbitSubscribe } from './rabbit/asrabbitsubscribe';

// @UseInterceptors(ExampleInterceptor)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }


  @RabbitSubscribe(MessageToQueueDefAdapter(JobCreatedV1, 'processing'))
  async getHello(msg: JobCreatedV1, amqpMsg: ConsumeMessage): Promise<void> {

    throw new Error('testing retry');
  }

  // @RabbitSubscribe(MessageToQueueDefAdapter(PaymentCreatedV1, 'processing'))
  // test(): string {
  //   return this.appService.getHello();
  // }


  // @RabbitSubscribe(MessageToQueueDefAdapter(JobCompletedV1, 'notifying'))
  // test2(): string {
  //   return this.appService.getHello();
  // }
}
