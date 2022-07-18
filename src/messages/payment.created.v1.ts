import { basename } from "path";
import { Message } from "./message";

export class PaymentCreatedV1 extends Message {
    constructor() {
        super("payment", "created", 1);
    }

    public paymentId: string;
}