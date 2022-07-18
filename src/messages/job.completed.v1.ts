import { basename } from "path";
import { Message } from "./message";

export class JobCompletedV1 extends Message {
    constructor() {
        super("job", "completed", 1);
    }

    public jobId: string;
}