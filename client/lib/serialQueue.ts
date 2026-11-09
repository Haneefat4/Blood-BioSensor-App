/**
 * Runs async tasks one after another. A later preferences save waits until
 * the earlier save has updated the in-memory copy, so two quick edits cannot
 * overwrite each other with a stale snapshot.
 */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task, task);
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}
