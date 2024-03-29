import { Command, Event, Inject } from "quiver-framework";
import { DataContextManagerProvider } from "../service/DataContextManagerProvider";
import { MessageType } from "../data/MessageType";
import { RestoreChannelsRequestMessage } from "../data/clientMessage/RestoreChannelsRequestMessage";
import { ClientConnection } from "../../clientConnectionPool/model/ClientConnection";
import { MessageManager } from "../service/MessageManager";
import {
    RestoreChannelsResponseMessage,
    restoreResponseUtil
} from "../data/serverMessage/RestoreChannelsResponseMessage";
import { CachedMessage } from "../data/cache/CachedMessage";

export class RestoreClientSubscription implements Command {

    @Inject()
    private event: Event<{ connection: ClientConnection, message: RestoreChannelsRequestMessage }>;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private messageManager: MessageManager;

    async execute(): Promise<void> {
        const {
            event: {
                data: {
                    message: { channels },
                    connection,
                    connection: { context: { id: contextId } }
                }
            },
            dataContextManagerProvider: { getContextManager },
            messageManager
        } = this;

        const contextManager = await getContextManager(contextId);
        const channelMessages = new Array<CachedMessage>();

        for (const { channel, filter } of channels) {
            const cachingPolicy = contextManager.getChannelCachingPolicy(channel);
            if (!cachingPolicy) {
                // Channel ain't got caching policy defined.
                // TODO: Is it worth an error log that someone has requested chan with no cache to be restored?
                return;
            }

            const messages = await messageManager.getCachedMessages(contextId, channel, filter);
            if (messages) {
                channelMessages.push(...messages);
            }
        }

        const messageIds = new Set<CachedMessage['messageId']>();

        const preparedMessage: RestoreChannelsResponseMessage = {
            type: MessageType.RestoreResponse,
            payload: channelMessages
                .filter(({ messageId }) => {
                    if (!messageIds.has(messageId)) {
                        messageIds.add(messageId);
                        return true;
                    }
                    return false;
                })
                .sort(({ time: t1, messageId: mId1 }, { time: t2, messageId: mId2 }) => {
                    if (t1 !== t2) {
                        return t1 - t2;
                    }
                    // This works with assumption that message ids are unique and usable for sorting
                    return mId1 > mId2 ? 1 : -1;
                })
        };
        connection.send(restoreResponseUtil.serialize(preparedMessage));
    }
}
