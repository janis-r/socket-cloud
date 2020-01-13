import {Event} from "qft";
import {ContextId} from "../../configurationContext";
import {ExternalId} from "../../clientConnectionPool";
import {PushToClientMessage} from "../data/serverMessage/PushToClientMessage";

export class OutgoingMessageEvent extends Event {
    static readonly TYPE = Symbol("outgoing-message");

    private readonly recipientProviders = new Set<RecipientCountProvider>();
    private recipientCount = 0;

    constructor(readonly contextId: ContextId,
                readonly message: PushToClientMessage,
                readonly externalIds?: ExternalId[]) {
        super(OutgoingMessageEvent.TYPE);
    }

    readonly addRecipientProvider = (provider: RecipientCountProvider): void => {
        this.recipientProviders.add(provider);
        provider.then(value => this.recipientCount += value);
    };

    async getRecipientCount(): Promise<number> {
        await Promise.all(this.recipientProviders);
        return this.recipientCount;
    }
}

type RecipientCountProvider = Promise<number>;
