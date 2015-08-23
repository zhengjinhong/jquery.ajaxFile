interface IFileData {
    name: string;
    element: HTMLInputElement;
}

interface IOption {
    method?: string;
    url?: string;

    data?: any;
    files?: IFileData[];
    desiredResponseDataType?: DataType;

    timeoutInSeconds?: number;
}

interface IResponseStatus {
    code: number;
    text: string;
    isSuccess: boolean;
}

interface IAjaxFileResult {
    error?: any;
    data?: any;
    status?: IResponseStatus;
}

interface IAjaxFileResultCallback {
    (result: IAjaxFileResult);
}

interface IAjaxFilePromise {
    then(success: IAjaxFileResultCallback, error?: IAjaxFileResultCallback): IAjaxFilePromise;
    done(success: IAjaxFileResultCallback): IAjaxFilePromise;
    fail(error: IAjaxFileResultCallback): IAjaxFilePromise;
    always(error: IAjaxFileResultCallback): IAjaxFilePromise;

    abord(): void;
}

interface IAjaxFileStatic {
    send(option: IOption): IAjaxFilePromise;
}

declare var AjaxFile: IAjaxFileStatic;

declare module 'ajaxfile' {
    export = AjaxFile;
}
