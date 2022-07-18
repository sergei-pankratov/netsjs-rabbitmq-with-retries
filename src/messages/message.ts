export interface IMessage {
    entityName: string,
    version: number
    eventName: string;
    getRoutingKey(): string
}

export class Message implements IMessage {
    entityName: string;
    version: number;
    eventName: string;

    constructor(entityName, eventName, version) {
        this.entityName = entityName;
        this.version = version;
        this.eventName = eventName;
    }
    getRoutingKey(): string {
        return `${this.entityName}.${this.eventName}.v${this.version}`;
    }
}