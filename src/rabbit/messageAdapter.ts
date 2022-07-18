import { AmqpConnection, Nack, QueueOptions, RabbitHandlerConfig } from "@golevelup/nestjs-rabbitmq";
import { IMessage } from "src/messages/message";
import { Inject, Logger } from '@nestjs/common';
import { Channel, ConsumeMessage } from "amqplib";


export const MessageToQueueDefAdapter = <T extends IMessage>(input: any, queueIntent: string)
    : Pick<RabbitHandlerConfig, "queue" | "connection" | "exchange" | "routingKey" | "createQueueIfNotExists" | "assertQueueErrorHandler" | "queueOptions" | "errorBehavior" | "errorHandler" | "allowNonJsonMessages"> => {
    const msg: IMessage = new input();
    const queueName = `${msg.entityName}-${queueIntent}-v${msg.version}`;
    const preretry_exchange = `${queueName}-pre-retry`;

    return {
        message: msg,
        queue: queueName,
        exchange: msg.entityName,
        routingKey: msg.getRoutingKey(),
        errorHandler: (ch: Channel, message: ConsumeMessage, err: Error) => {
            if (message.properties.headers && message.properties.headers["x-death"] && message.properties.headers["x-death"][0].count > 1) {
                Logger.warn(`dropping message. routing key: "${message.fields.routingKey}" \r\n content: ${message.content.toString()}}`,);
                ch.ack(message, false);
                ch.sendToQueue(msg.entityName + '-failed', message.content, {});
            } else
                ch.nack(message, false, false);
        },
        assertQueueErrorHandler: (channel: Channel,
            queueName: string,
            queueOptions: QueueOptions | undefined,
            error: any) => { 
                Logger.warn(queueName, error);
            },
        queueOptions: {
            deadLetterExchange: preretry_exchange,
            deadLetterRoutingKey: msg.getRoutingKey(),
            durable: true,
            exclusive: false,
            autoDelete: false,
        },
        createQueueIfNotExists: true,
    } as any;

};