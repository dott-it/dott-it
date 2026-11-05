export function isPromiseLike<T>(input:unknown): input is PromiseLike<T> {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof (input as PromiseLike<T>).then === 'function'
  );
}