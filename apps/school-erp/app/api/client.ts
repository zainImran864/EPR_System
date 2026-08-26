/**
 * Typed client API requester with simulated network delay capability for CSR testing
 */
export async function mockFetch<T>(data: T, delayMs: number = 200): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delayMs);
  });
}
