﻿enum DataType {
    Json,
    Xml,
    Text
}

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

    timeout?: number;
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

    abord();
}