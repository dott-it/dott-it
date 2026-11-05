export interface ErrorLikeObject{
    name:string;
    message:string;
    cause?:unknown;
    stack?:string| undefined
}

export function isErrorLikeObject(e:unknown): e is ErrorLikeObject {
    return typeof e === 'object' && e !== null && 'message' in e && 'name' in e;
}

export function errorFromErrorLikeObject(e: ErrorLikeObject): Error {
    let newError:Error = new UnknowError(e.message, {
        cause: e.cause})
        if(e.name === 'Error') newError = new Error(e.message, {cause: e.cause});
        if(e.name==="EvalError") newError = new EvalError(e.message, {cause: e.cause});
        if(e.name==="RangeError") newError = new RangeError(e.message, {cause: e.cause});
        if(e.name==="ReferenceError") newError = new ReferenceError(e.message, {cause: e.cause});
        if(e.name==="SyntaxError") newError = new SyntaxError(e.message, {cause: e.cause});
        if(e.name==="TypeError") newError = new TypeError(e.message, {cause: e.cause});
        if(e.name==="URIError") newError = new URIError(e.message, {cause: e.cause});
        if(e.name==="ResponseError" && isResponseError(e)) {
            newError = new ResponseError(e.response, e.data,e.message)
        }
        if(e.name ==="ResponseTransformError" && isReponseTransformError(e)) {
            newError = new ResponseTransformerError(e.response, e.transformError, e.message);
        }
        newError.stack = e.stack;
        return newError;

}

export class UnknowError extends Error {
    originalErr:unknown
    constructor (err:unknown,options?: ErrorOptions|undefined) {
        super('Unknown error' , options );
        this.originalErr = err;
    }

}

export class ResponseError <T,ErrorCode extends string = string> extends Error {
    data?: T;
    response: Response;
    displayMessage?: string;
    displayMessageKey?: string;
    errorCode?: ErrorCode;

    constructor(response:Response, data?:T , reason?:string, errorCode?:ErrorCode){
        super(reason ?? `Response Error: ${response.statusText} - ${response.statusText}`);
        this.name = 'ResponseError';
        this.response = response;
        this.data = data;
        this.errorCode = errorCode;
    }
    toString(): string {
        return `${this.name}: ${this.message} \n Display Message: ${this.displayMessage ?? 'N/A'} \n Error Code: ${this.errorCode ?? 'N/A'} \n Data: ${JSON.stringify(this.data)} \n Response: ${this.response.status} - ${this.response.statusText}`;
    }

    isClientResponseError(): boolean {
        return this.response.status >= 400 && this.response.status < 500;
    }
    isServerResponseError(): boolean {
        return this.response.status >= 500 && this.response.status < 600;
    }
}

export function isResponseError<T,ErrorCode extends string>(e:unknown): e is ResponseError<T,ErrorCode> {
    if(e instanceof ResponseError) return true;
    return ( isErrorLikeObject(e)&& e.name === 'ResponseError' && 'response' in e && e.response instanceof Response && 'data' in e && (e.data === null|| typeof e.data === 'object')) ;
}

export class ResponseTransformerError<T> extends ResponseError<T> {
    transformError: Error;
    constructor (response: Response, transformError:Error, reason?:string){
        super(response, undefined, reason);
        this.transformError = transformError;
        this.name = 'ResponseTransformerError';
    }

}
export function isReponseTransformError<T>(e:unknown): e is ResponseTransformerError<T> {
    return isResponseError(e) && e.response.status >= 400 && e.response.status < 500;
}