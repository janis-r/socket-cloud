import {Command, Event, Inject} from "qft";
import {DataContextManagerProvider} from "../service/DataContextManagerProvider";
import {MessageType, RestoreChannelsRequestMessage} from "../data";
import {ClientConnection} from "../../clientConnectionPool";
import {MessageCache} from "../model/MessageCache";
import {RestoredMessage, RestoreChannelsResponseMessage} from "../data/serverMessage/RestoreChannelsResponseMessage";

export class RestoreClientSubscription implements Command {

    @Inject()
    private event: Event<{ connection: ClientConnection, message: RestoreChannelsRequestMessage }>;
    @Inject()
    private dataContextManagerProvider: DataContextManagerProvider;
    @Inject()
    private messageCache: MessageCache;

    async execute(): Promise<void> {
        const {
            event: {
                data: {
                    message: {channels},
                    connection,
                    connection: {context: {id: contextId}}
                }
            },
            dataContextManagerProvider: {getContextManager},
            messageCache
        } = this;

        const contextManager = await getContextManager(contextId);
        const channelMessages: ReturnType<MessageCache['getMessageCache']> = [];
        for (const {channel, messageId} of channels) {
            const {cacheTimeMs, maxCacheSize} = contextManager.getChannelCachingPolicy(channel);
            const messages = messageCache.getMessageCache(contextId, channel, {cacheTimeMs, maxCacheSize, messageId});
            if (messages) {
                channelMessages.push(...messages);
            }
        }

        const messageIds = new Set<RestoredMessage['messageId']>();

        const preparedMessage: RestoreChannelsResponseMessage = {
            type: MessageType.RestoreResponse,
            payload: channelMessages
                .filter(({message: {messageId}}) => {
                    if (!messageIds.has(messageId)) {
                        messageIds.add(messageId);
                        return true;
                    }
                    return false;
                })
                .sort((a, b) => a.time - b.time)
                .map(({message}) => message)
        };
        connection.send(JSON.stringify(preparedMessage));
    }
}
