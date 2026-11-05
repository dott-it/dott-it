import { errorFromErrorLikeObject, isErrorLikeObject, UnknowError } from "./error";

export type Result<T,E extends Error = Error> = T| E;

export const isResultError = <T>(v:Result<T>):v is Error => v instanceof Error;



export function error (e:unknown): Error{
    if(e instanceof Error) return e;
    if(isErrorLikeObject(e)) return errorFromErrorLikeObject(e);
    return new UnknowError(e);
}

export function success<T,E = undefined>(result:Result<T>,fallback?:E):T|E{
    return (isResultError(result) ? fallback : result) as T|E;
}


export function failt<T>(result:Result<T>):void{
    if (isResultError(result)) {
        throw result;
    }
}


export function successOrThrow<T,E extends Error = Error>(result:Result<T,E>):T{
    if (isResultError(result)) {
        throw result;
    }
    return result;
}

export async function successOrThrowAsync<T,E extends Error>(promise:Promise<Result<T,E>>):Promise<T> {
    const result = await promise;
    if (isResultError(result)) {
        throw result;
    }
    return result;
}

export function safe<Response>(fn:()=>Response): Result<Response> {
    try {
        return fn();
    } catch (e) {
        return error(e);
    }
}

export async function safeAsync<Response>(fn:()=>Promise<Response>): Promise<Result<Response>> {
    try {
        const res = await fn();
        return res
    } catch (e) {
        return error(e);
    }
}