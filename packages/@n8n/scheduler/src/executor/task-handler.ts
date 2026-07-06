import { UnexpectedError } from 'n8n-workflow';

import type { ClaimedTask } from '../core/types';

/**
 * Runs one claimed task. Registered against a `taskType`; the executor resolves
 * the handler for a task's type and calls it. A throw means the attempt failed
 * (the executor retries with backoff or marks the task failed); resolving means
 * the work was handed off and the task can complete.
 */
export type TaskHandler = (task: ClaimedTask) => Promise<void>;

/**
 * Where handlers live, keyed by `taskType`.
 * Internal: integrations register hrough the `Scheduler` entry point; only the executor resolves from here.
 * The executor claims only the types present (`registeredTypes`), so an
 * instance never picks up work it has no handler for.
 */
export class TaskHandlerRegistry {
	private readonly handlers = new Map<string, TaskHandler>();

	/** Register `handler` for `taskType`. Throws if one is already registered. */
	register(taskType: string, handler: TaskHandler): void {
		if (this.handlers.has(taskType)) {
			throw new UnexpectedError(`A handler for task type '${taskType}' is already registered`);
		}
		this.handlers.set(taskType, handler);
	}

	resolve(taskType: string): TaskHandler | undefined {
		return this.handlers.get(taskType);
	}

	/** The registered task types, used to scope the claim to runnable work. */
	registeredTypes(): string[] {
		return [...this.handlers.keys()];
	}
}
