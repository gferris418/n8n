<script lang="ts" setup>
import type { ExecutionFilterType } from '../executions.types';
import ProjectHeader from '@/features/collaboration/projects/components/ProjectHeader.vue';
import GlobalExecutionsList from '../components/global/GlobalExecutionsList.vue';
import { useDocumentTitle } from '@/app/composables/useDocumentTitle';
import { useExternalHooks } from '@/app/composables/useExternalHooks';
import { useI18n } from '@n8n/i18n';
import { useProjectPages } from '@/features/collaboration/projects/composables/useProjectPages';
import { useTelemetry } from '@/app/composables/useTelemetry';
import { useToast } from '@/app/composables/useToast';
import InsightsSummary from '@/features/execution/insights/components/InsightsSummary.vue';
import { useInsightsStore } from '@/features/execution/insights/insights.store';
import { useExecutionsStore } from '../executions.store';
import { useWorkflowsListStore } from '@/app/stores/workflowsList.store';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { injectWorkflowDocumentStore } from '@/app/stores/workflowDocument.store';
import { N8nLoading } from '@n8n/design-system';
import ResourcesListEmptyState from '@/app/components/layouts/ResourcesListEmptyState.vue';
import { useWorkflowsEmptyState } from '@/features/workflows/composables/useWorkflowsEmptyState';
import { VIEWS } from '@/app/constants';

const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const telemetry = useTelemetry();
const externalHooks = useExternalHooks();
const workflowsListStore = useWorkflowsListStore();
const executionsStore = useExecutionsStore();
const insightsStore = useInsightsStore();
const documentTitle = useDocumentTitle();
const toast = useToast();
const workflowDocumentStore = injectWorkflowDocumentStore();

const overview = useProjectPages();
const { readOnlyEnv, projectPermissions } = useWorkflowsEmptyState();

const {
	executionsCount,
	executionsCountEstimated,
	concurrentExecutionsCount,
	filters,
	allExecutions,
} = storeToRefs(executionsStore);

// Without workflows there is nothing to execute: show the workflows empty state
// instead of an empty executions table. Defer the chrome only while emptiness is
// still unknown, so users with workflows keep an instant list.
const workflowsLoaded = ref(false);

const hasNoWorkflows = computed(
	() => workflowsLoaded.value && workflowsListStore.allWorkflows.length === 0,
);

const resolvingWorkflowsEmptiness = computed(
	() => !workflowsLoaded.value && workflowsListStore.allWorkflows.length === 0,
);

const goToCreateWorkflow = () => {
	void router.push({
		name: VIEWS.NEW_WORKFLOW,
		query: { projectId: route.params?.projectId as string | undefined },
	});
};

onBeforeMount(async () => {
	await loadWorkflows();
	workflowsLoaded.value = true;

	void externalHooks.run('executionsList.openDialog');
	telemetry.track('User opened Executions log', {
		workflow_id: workflowDocumentStore.value.workflowId,
	});
});

onMounted(async () => {
	documentTitle.set(i18n.baseText('executionsList.workflowExecutions'));
	document.addEventListener('visibilitychange', onDocumentVisibilityChange);

	await executionsStore.initialize();
});

onBeforeUnmount(() => {
	executionsStore.reset();
	document.removeEventListener('visibilitychange', onDocumentVisibilityChange);
});

async function loadWorkflows() {
	try {
		await workflowsListStore.fetchAllWorkflows(route.params?.projectId as string | undefined);
	} catch (error) {
		toast.showError(error, i18n.baseText('executionsList.showError.loadWorkflows.title'));
	}
}

function onDocumentVisibilityChange() {
	if (document.visibilityState === 'hidden') {
		executionsStore.stopAutoRefreshInterval();
	} else {
		void executionsStore.startAutoRefreshInterval();
	}
}

async function onRefreshData() {
	try {
		await executionsStore.fetchExecutions();
	} catch (error) {
		toast.showError(error, i18n.baseText('executionsList.showError.refreshData.title'));
	}
}

async function onUpdateFilters(newFilters: ExecutionFilterType) {
	executionsStore.reset();
	executionsStore.setFilters(newFilters);
	await executionsStore.initialize();
}

async function onExecutionStop() {
	await onRefreshData();
}
</script>
<template>
	<div
		v-if="resolvingWorkflowsEmptiness"
		:class="$style.loadingState"
		data-test-id="executions-loading-state"
	>
		<N8nLoading :rows="3" variant="p" />
	</div>
	<div v-else-if="hasNoWorkflows">
		<ProjectHeader />
		<ResourcesListEmptyState
			resource-key="workflows"
			:button-disabled="readOnlyEnv || !projectPermissions.workflow.create"
			:disabled-tooltip-text="
				readOnlyEnv ? i18n.baseText('readOnlyEnv.cantAdd.workflow') : undefined
			"
			@click:button="goToCreateWorkflow"
		/>
	</div>
	<GlobalExecutionsList
		v-else
		:executions="allExecutions"
		:filters="filters"
		:total="executionsCount"
		:estimated-total="executionsCountEstimated"
		:concurrent-total="concurrentExecutionsCount"
		@execution:stop="onExecutionStop"
		@update:filters="onUpdateFilters"
	>
		<ProjectHeader>
			<InsightsSummary
				v-if="overview.isOverviewSubPage && insightsStore.isSummaryEnabled"
				:loading="insightsStore.weeklySummary.isLoading"
				:summary="insightsStore.weeklySummary.state"
				time-range="week"
			/>
		</ProjectHeader>
	</GlobalExecutionsList>
</template>

<style lang="scss" module>
.loadingState {
	display: flex;
	flex-direction: column;
	justify-content: center;
	height: 100%;
	max-width: 480px;
	margin: 0 auto;
	padding: var(--spacing--2xl);
}
</style>
