import { TaskHandlerRegistry } from './executor/task-handler';
import type { TaskHandler } from './executor/task-handler';

/**
 * The single entry point of `@n8n/scheduler`: the umbrella every integration
 * talks to, wrapping the package's functionality behind one object so the
 * internals (registry, executor, timer) never leave the package.
 */
export class Scheduler {
	/**
	 * The scheduler of this process. Integrations use this instance, never their own.
	 * TEMPORARY: this singleton will be removed in the next refactoring.
	 */
	static readonly instance = new Scheduler();

	private readonly taskHandlers = new TaskHandlerRegistry();

	/**
	 * Register the {@link TaskHandler} to run for every claimed task of
	 * `taskType`. Throws if the task type already has a handler.
	 */
	registerTaskHandler(taskType: string, handler: TaskHandler): void {
		this.taskHandlers.register(taskType, handler);
	}
}
