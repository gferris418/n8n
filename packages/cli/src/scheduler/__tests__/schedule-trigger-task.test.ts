/* eslint-disable @typescript-eslint/naming-convention -- item keys are pinned to the legacy ScheduleTrigger emit shape */
import {
	buildScheduleTriggerItem,
	isScheduleTriggerTaskPayload,
	SCHEDULE_TRIGGER_TASK_TYPE,
	scheduleTriggerDeduplicationKey,
} from '../schedule-trigger-task';

describe('SCHEDULE_TRIGGER_TASK_TYPE', () => {
	test('is a stable persisted identifier', () => {
		// Persisted in `scheduled_job.taskType` and used to scope executor claims;
		// changing it orphans every existing schedule-trigger job.
		expect(SCHEDULE_TRIGGER_TASK_TYPE).toBe('workflow:schedule-trigger');
	});
});

describe('isScheduleTriggerTaskPayload', () => {
	test('accepts a payload with workflowId and nodeId', () => {
		expect(isScheduleTriggerTaskPayload({ workflowId: 'wf-1', nodeId: 'node-1' })).toBe(true);
	});

	test.each([
		['empty payload', {}],
		['missing nodeId', { workflowId: 'wf-1' }],
		['missing workflowId', { nodeId: 'node-1' }],
		['empty workflowId', { workflowId: '', nodeId: 'node-1' }],
		['empty nodeId', { workflowId: 'wf-1', nodeId: '' }],
		['non-string ids', { workflowId: 42, nodeId: true }],
	])('rejects %s', (_name, payload) => {
		expect(isScheduleTriggerTaskPayload(payload)).toBe(false);
	});
});

describe('scheduleTriggerDeduplicationKey', () => {
	test('derives jobId:scheduledFor in canonical UTC', () => {
		const key = scheduleTriggerDeduplicationKey({
			jobId: '7',
			scheduledFor: new Date('2026-07-06T07:30:00.000Z'),
		});

		expect(key).toBe('7:2026-07-06T07:30:00.000Z');
	});
});

describe('buildScheduleTriggerItem', () => {
	const scheduledFor = new Date('2026-07-06T07:30:00.000Z');

	test('mirrors the legacy Schedule Trigger emit shape, stamped from the occurrence', () => {
		// Pinned against the emit in `ScheduleTrigger.node.ts` — a workflow must
		// read the same fields whichever engine fired it. The fixed 2026 instant
		// also proves the item derives from `scheduledFor`, not the wall clock.
		expect(buildScheduleTriggerItem(scheduledFor, 'Europe/Berlin')).toEqual({
			json: {
				timestamp: '2026-07-06T09:30:00.000+02:00',
				'Readable date': 'July 6th 2026, 9:30:00 am',
				'Readable time': '9:30:00 am',
				'Day of week': 'Monday',
				Year: '2026',
				Month: 'July',
				'Day of month': '06',
				Hour: '09',
				Minute: '30',
				Second: '00',
				Timezone: 'Europe/Berlin (UTC+02:00)',
			},
		});
	});
});
