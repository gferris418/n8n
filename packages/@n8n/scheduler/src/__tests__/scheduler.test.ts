import type { TaskHandler } from '../executor/task-handler';
import { Scheduler } from '../scheduler';

const fakeHandler = (): TaskHandler => async () => {};

describe('Scheduler', () => {
	it('exposes one process-wide instance', () => {
		expect(Scheduler.instance).toBeInstanceOf(Scheduler);
		expect(Scheduler.instance).toBe(Scheduler.instance);
	});

	it('registers a handler and rejects a duplicate for the same task type', () => {
		const scheduler = new Scheduler();
		scheduler.registerTaskHandler('entry-point:a', fakeHandler());

		expect(() => scheduler.registerTaskHandler('entry-point:a', fakeHandler())).toThrow(
			"A handler for task type 'entry-point:a' is already registered",
		);
	});

	it('keeps registrations scoped to their instance', () => {
		const first = new Scheduler();
		const second = new Scheduler();
		first.registerTaskHandler('entry-point:a', fakeHandler());

		expect(() => second.registerTaskHandler('entry-point:a', fakeHandler())).not.toThrow();
	});
});
