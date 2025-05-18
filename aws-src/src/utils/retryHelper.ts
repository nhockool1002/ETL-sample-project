import promiseRetry from 'promise-retry';

export async function retryWrapper<T>(
  fn: () => Promise<T>,
  options = { retries: 3, minTimeout: 1000, factor: 2 }
): Promise<T> {
  const { retries, minTimeout, factor } = options;
  return promiseRetry((retry, number) => {
    return fn().catch(err => {
      if (isTransientError(err)) {
        retry(err);
      }
      throw err;
    });
  }, { retries, minTimeout, factor });
}

function isTransientError(err: any): boolean {
  if (!err) return false;
  const transientMessages = ['ECONNRESET', 'ETIMEDOUT', 'EHOSTUNREACH', 'Deadlock', 'timeout', '502', '503', '504'];
  return transientMessages.some(msg => err.message.includes(msg));
}
