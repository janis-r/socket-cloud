export enum ConnectionState {
    Connecting,
    Open,
    Closing,
    Closed
}

export const connectionStateToString = (state: ConnectionState) => [
    'connecting',
    'open',
    'closing',
    'closed'
][state];
