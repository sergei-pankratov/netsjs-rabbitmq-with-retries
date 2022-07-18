import { basename } from "path";
import { Message } from "./message";

export class JobCreatedV1 extends Message {
    constructor() {
        super("job", "created", 1);
    }

    public jobId: string;
}