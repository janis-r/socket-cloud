import { Inject } from "quiver-framework";
import { CachingPolicy } from "../../configurationContext/data/CachingPolicy";
import { ConfigurationContext } from "../../configurationContext/data/ConfigurationContext";
import { ClientConnection } from "../../clientConnectionPool/model/ClientConnection";
import { ChannelId } from "../data/ChannelId";
import { Logger } from "../../logger/service/Logger";
import { globalMessageChannel } from "../data/globalMessageChannel";

export class DataContextManager {

    @Inject()
    readonly context: ConfigurationContext;
    @Inject()
    private readonly logger: Logger;

    private readonly contextChannelsByConnection = new Map<ClientConnection, Set<ChannelId>>();
    private readonly contextChannels = new Map<ChannelId, Set<ClientConnection>>();

    get connectionCount(): number {
        return this.contextChannelsByConnection.size;
    }

    get channelCount(): number {
        return this.contextChannels.size;
    }

    addConnection(connection: ClientConnection): void {
        const { contextChannelsByConnection } = this;
        contextChannelsByConnection.set(connection, new Set<ChannelId>());
    }

    removeConnection(connection: ClientConnection): void {
        const { contextChannels, contextChannelsByConnection } = this;

        contextChannelsByConnection.get(connection).forEach(channelId => {
            const collection = contextChannels.get(channelId);
            collection.delete(connection);
            if (collection.size === 0) {
                contextChannels.delete(channelId);
            }
        });

        contextChannelsByConnection.delete(connection);
    }

    subscribeToChannel(channels: ChannelId[], connection: ClientConnection): void {
        const { contextChannels, contextChannelsByConnection } = this;
        for (const channelId of channels) {
            if (!contextChannels.has(channelId)) {
                contextChannels.set(channelId, new Set<ClientConnection>([connection]));
            } else {
                this.contextChannels.get(channelId).add(connection);
            }
            contextChannelsByConnection.get(connection).add(channelId);
        }
    }

    unsubscribeFromChannel(channels: ChannelId[], connection: ClientConnection): void {
        const { logger, contextChannels, contextChannelsByConnection } = this;
        for (const channelId of channels) {
            if (!contextChannels.has(channelId)) {
                logger.debug(`DataContextManager inconsistency - connection id ${connection.id} is not present in channel ${channelId}`);
                continue;
            }

            const collection = contextChannels.get(channelId);
            collection.delete(connection);
            if (collection.size === 0) {
                contextChannels.delete(channelId);
            }

            contextChannelsByConnection.get(connection).delete(channelId);
        }
    }

    getConnectionsChannels(connection: ClientConnection): ReadonlySet<ChannelId> | null {
        return this.contextChannelsByConnection.get(connection) ?? null;
    }

    getConnections(): ReadonlySet<ClientConnection> {
        return new Set([...this.contextChannelsByConnection.keys()]);
    }

    getChannelConnections(channelId: ChannelId): ReadonlySet<ClientConnection> | null {
        const { contextChannels, contextChannelsByConnection } = this;
        if (channelId === globalMessageChannel) {
            return new Set(contextChannelsByConnection.keys());
        }
        return contextChannels.get(channelId) ?? null;
    }

    getChannelCachingPolicy(channelId: ChannelId): Readonly<CachingPolicy> | null {
        const {
            context: {
                cachingPolicy: generalPolicy,
                channelConfig
            }
        } = this;

        const channelPolicy = channelConfig?.[channelId]?.cachingPolicy;
        if (!generalPolicy && !channelPolicy) {
            return null;
        }

        if (!!generalPolicy !== !!channelPolicy) {
            return channelPolicy ?? generalPolicy;
        }

        return {
            cacheTime: channelPolicy.cacheTime ?? generalPolicy.cacheTime,
            cacheSize: channelPolicy.cacheSize ?? generalPolicy.cacheSize
        }
    }

}
