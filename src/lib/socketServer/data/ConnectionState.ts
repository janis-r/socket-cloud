export enum ConnectionState {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED
}

export const connectionStateToString = (state: ConnectionState) => [
    'connecting',
    'open',
    'closing',
    'closed'
][state];
