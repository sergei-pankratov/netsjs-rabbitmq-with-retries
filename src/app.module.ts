import { MessageHandlerErrorBehavior, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MqModule } from './rabbit/rabbitModule';
// import { RabbitModule } from './rabbit/rabbitmodule';

@Module({
  imports: [MqModule.forRoot(MqModule, {
    exchanges: [
      {
        name: '/',
        type: 'direct',
      },
    ],
    defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
    enableControllerDiscovery: true,
    uri: 'amqp://guest:guest@localhost:5672',
    connectionInitOptions: { wait: false },
    prefetchCount: 1,
  })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
