import {
	runDataAttemptedDynamicCredentials,
	runDataUsedDynamicCredentials,
} from '../src/dynamic-credentials-helpers';
import type { IRunData, ITaskData } from '../src/interfaces';

const task = (flags: Partial<ITaskData>): ITaskData =>
	({ startTime: 0, executionTime: 0, ...flags }) as ITaskData;

describe('dynamic-credentials-helpers', () => {
	describe('runDataUsedDynamicCredentials', () => {
		it('returns false for undefined or empty run data', () => {
			expect(runDataUsedDynamicCredentials(undefined)).toBe(false);
			expect(runDataUsedDynamicCredentials({})).toBe(false);
		});

		it('returns false when no task used a dynamic credential', () => {
			const runData: IRunData = { node: [task({}), task({ attemptedDynamicCredentials: true })] };
			expect(runDataUsedDynamicCredentials(runData)).toBe(false);
		});

		it('returns true when any task of any node used a dynamic credential', () => {
			const runData: IRunData = {
				A: [task({})],
				B: [task({}), task({ usedDynamicCredentials: true })],
			};
			expect(runDataUsedDynamicCredentials(runData)).toBe(true);
		});
	});

	describe('runDataAttemptedDynamicCredentials', () => {
		it('returns false for undefined or empty run data', () => {
			expect(runDataAttemptedDynamicCredentials(undefined)).toBe(false);
			expect(runDataAttemptedDynamicCredentials({})).toBe(false);
		});

		it('returns true on an attempt even when resolution did not succeed', () => {
			const runData: IRunData = { node: [task({ attemptedDynamicCredentials: true })] };
			expect(runDataAttemptedDynamicCredentials(runData)).toBe(true);
			expect(runDataUsedDynamicCredentials(runData)).toBe(false);
		});

		it('reports both when a credential was used', () => {
			const runData: IRunData = {
				node: [task({ usedDynamicCredentials: true, attemptedDynamicCredentials: true })],
			};
			expect(runDataAttemptedDynamicCredentials(runData)).toBe(true);
			expect(runDataUsedDynamicCredentials(runData)).toBe(true);
		});
	});
});
