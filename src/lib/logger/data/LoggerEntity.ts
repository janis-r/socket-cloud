export interface LoggerEntity {
    readonly name: string;
    readonly log: (...message: any[]) => void
}
