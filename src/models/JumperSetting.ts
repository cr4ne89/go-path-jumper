export interface JumperSetting {
    language: string | string[];
    regexPattern: string;
    regexMatchPattern: string;
    basePath: string;
    fileExtension: string;
    delimiter: string;
    pathCapture: number;
    defaultBasePath?: string;
    sourceExtensions?: string[];
    lint?: boolean;
}
