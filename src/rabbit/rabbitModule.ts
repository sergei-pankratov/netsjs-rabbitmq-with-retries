import { AmqpConnectionManager, RabbitHandlerConfig, RabbitMQModule, RabbitRpcParamsFactory, RABBIT_HANDLER } from '@golevelup/nestjs-rabbitmq';
import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, DiscoveredMethodWithMeta } from '@golevelup/nestjs-discovery';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib'
import { IMessage } from 'src/messages/message';

@Module({})
export class MqModule extends RabbitMQModule implements OnApplicationBootstrap {

    private readonly discoveryService: DiscoveryService;
    private readonly connectionsManager: AmqpConnectionManager;


    constructor(discover: DiscoveryService, externalContextCreator: ExternalContextCreator, rpcParamsFactory: RabbitRpcParamsFactory, connectionManager: AmqpConnectionManager) {
        super(discover, externalContextCreator, rpcParamsFactory, connectionManager)
        this.connectionsManager = connectionManager;
        this.discoveryService = discover;

    }
    public async onApplicationBootstrap() {
        const queueBindingThatRunLast: Function[] = [];
        const connection = this.connectionsManager.getConnections()[0];
        const channelWrapper: ChannelWrapper = connection.managedChannel;
        channelWrapper.addSetup(async (channel: Channel, done) => {
            try {
                const rabbitMeta =
                    await this.discoveryService.controllerMethodsWithMetaAtKey<RabbitHandlerConfig>(RABBIT_HANDLER);

                const groupedByExchange = rabbitMeta.reduce(function (r, a) {
                    r[a.meta.exchange] = r[a.meta.exchange] || [];
                    r[a.meta.exchange].push(a);
                    return r;
                }, Object.create(null));

                for (var exchangeName in groupedByExchange) {

                    const queueMetas = groupedByExchange[exchangeName];
                    const unroutedExchange = exchangeName + '-unrouted';
                    await channel.assertExchange(unroutedExchange, 'fanout', { durable: true, autoDelete: false });
                    await channel.assertExchange(exchangeName, 'topic', { durable: true, autoDelete: false, alternateExchange: unroutedExchange });
                    await channel.assertQueue(unroutedExchange, { durable: true, autoDelete: false, })
                    await channel.assertQueue(exchangeName + "-failed", { durable: true, autoDelete: false, })
                    await channel.bindQueue(unroutedExchange, unroutedExchange, '*');

                    for (var index in queueMetas) {
                        const item = queueMetas[index] as DiscoveredMethodWithMeta<RabbitHandlerConfig>;
                        const queueMeta = item.meta;
                        const queueName = queueMeta.queue;
                        const msg = (queueMeta as any).message as IMessage;

                        const waitQueueName = queueName + `-retry-queue`;
                        const preretry_exchange = `${queueName}-pre-retry`;
                        const retry_exchange = `${queueName}-retry`;

                        await channel.assertExchange(preretry_exchange, "direct");
                        await channel.assertExchange(retry_exchange, "direct");

                        await channel.assertQueue(waitQueueName, {
                            durable: true,
                            deadLetterExchange: retry_exchange,
                            arguments: { 'x-message-ttl': 10_000 },
                        });

                        await channel.bindQueue(waitQueueName, preretry_exchange, msg.getRoutingKey());
                        queueBindingThatRunLast.push((channel: Channel) => channel.bindQueue(queueName, retry_exchange, msg.getRoutingKey()));
                    }
                }

                

                this.connectionsManager.getConnections()[0].managedChannel.addSetup(async (channel: Channel, done) => {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    for (var index in queueBindingThatRunLast) {
                        await queueBindingThatRunLast[index](channel);
                    }
                    done();
                });

                super.onApplicationBootstrap();

                done();

            } catch (e) {
                Logger.error("Error {e}", e);
            }
        });
    }
}