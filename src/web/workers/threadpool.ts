type Task<Input, Output> = {
    input: Input;
    handlers: PromiseHandlers<Output>;
}

type PromiseHandlers<T> = {
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
}

export class WorkerPool<Input, Output> {
    numThreads: number;
    url: URL;

    workers: Worker[];
    idleWorkers: Worker[];

    taskQueue: Task<Input, Output>[];

    promiseHandlerMap: Map<Worker, PromiseHandlers<Output>>;

    constructor(numThreads: number, url: URL) {
        this.numThreads = numThreads;
        this.url = url;

        this.workers = this.spawnWorkers();
        this.idleWorkers = [...this.workers];  // Shallow copy
        this.promiseHandlerMap = new Map();
        this.taskQueue = [];
    }

    private spawnWorkers(): Worker[] {
        return Array.from({ length: this.numThreads }, () => {
            let worker = new Worker(this.url, { type: 'module' });
            worker.onmessage = (
                ev: MessageEvent<Output>,
            ) => {
                let handlers = this.promiseHandlerMap.get(worker)!;
                handlers.resolve(ev.data);
                this.promiseHandlerMap.delete(worker);

                this.idleWorkers.push(worker);
                this.beginNextTaskIfPossible();
            };
            worker.onerror = (ev: ErrorEvent) => {
                let handlers = this.promiseHandlerMap.get(worker)!;
                console.log("in error");
                handlers.reject(ev.message);
                this.promiseHandlerMap.delete(worker);

                this.idleWorkers.push(worker);
                this.beginNextTaskIfPossible();
            }
            return worker;
        });
    }

    private beginNextTaskIfPossible() {
        let worker = this.idleWorkers.shift();
        if (!worker) {
            return;
        }

        let task = this.taskQueue.shift();
        if (!task) {
            return;
        }

        this.promiseHandlerMap.set(worker, task.handlers);
        worker.postMessage(task.input);
    }

    submit(input: Input): Promise<Output> {
        return new Promise((resolve, reject) => {
            let task: Task<Input, Output> = {
                input: input, handlers: { resolve, reject }
            }
            this.taskQueue.push(task);
            this.beginNextTaskIfPossible();
        });
    }
}