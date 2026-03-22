export interface JumperSetting {
    regex: string;
    basePath: string;
    targetExt: string;
    delimiter: string;
    pathCapture: number;
    fallbackPath?: string;
    sourceExt: string[];
    checkFilePaths?: boolean;
}
