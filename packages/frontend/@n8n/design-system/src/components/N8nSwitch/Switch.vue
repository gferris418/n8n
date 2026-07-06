<script setup lang="ts">
import { reactiveOmit, reactivePick } from '@vueuse/core';
import { Label, Primitive, SwitchRoot, SwitchThumb, useForwardProps } from 'reka-ui';
import { computed, useAttrs, useId } from 'vue';

import type { SwitchProps, SwitchSlots } from './Switch.types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<SwitchProps>(), {
	size: 'small',
});
const slots = defineSlots<SwitchSlots>();
const uuid = computed(() => props.id ?? useId());

const rootProps = useForwardProps(reactivePick(props, 'required', 'value', 'defaultValue'));

const modelValue = defineModel<boolean>({ default: undefined });

/**
 * Proxy between the public model and the underlying SwitchRoot. While indeterminate, the
 * switch presents as "mixed" (never checked), and any toggle resolves to `true` so a bulk
 * action over a heterogeneous selection turns everything on.
 */
const switchModel = computed<boolean>({
	get: () => (props.indeterminate ? false : modelValue.value),
	set: (value) => {
		modelValue.value = props.indeterminate ? true : value;
	},
});

/**
 * Only present while indeterminate, so that Reka UI's own `aria-checked` binding stays
 * untouched in the regular checked/unchecked states.
 */
const mixedAttrs = computed(() =>
	props.indeterminate ? { 'aria-checked': 'mixed' as const, 'data-indeterminate': '' } : {},
);

const attrs = useAttrs();
const primitiveClass = computed(() => attrs.class);
const rootAttrs = computed(() => reactiveOmit(attrs, ['class']));
</script>

<template>
	<Primitive
		:as
		:class="[$style.switch, $style[size], primitiveClass]"
		:data-disabled="disabled ? '' : undefined"
	>
		<SwitchRoot
			:id="uuid"
			v-bind="{ ...rootProps, ...rootAttrs, ...mixedAttrs }"
			v-model="switchModel"
			:name="name"
			:disabled="disabled"
			:class="$style.switchRoot"
			:aria-labelledby="label ? uuid : undefined"
			:aria-label="!label && 'Toggle'"
		>
			<SwitchThumb :class="$style.switchThumb" />
		</SwitchRoot>
		<Label
			v-if="label || !!slots.label"
			:for="uuid"
			:class="$style.label"
			:data-disabled="disabled ? '' : undefined"
		>
			<slot name="label" :label="label">
				{{ label }}
			</slot>
		</Label>
	</Primitive>
</template>

<style lang="css" module>
.switch {
	display: inline-flex;
	flex-direction: row;
	align-items: center;
	gap: var(--spacing--2xs);
	cursor: pointer;

	&[data-disabled] {
		cursor: not-allowed;
		opacity: 0.6;
	}
}

.switchRoot {
	position: relative;
	box-sizing: content-box;
	padding: 0;
	margin: 0;
	background-color: var(--switch--color--background);
	border: 1px solid var(--switch--border-color);
	cursor: inherit;
	flex-shrink: 0;
	transition:
		background-color 0.15s ease,
		border-color 0.15s ease;

	/* The mixed state sits on the active-colored track, same as checked. */
	&[data-state='checked'],
	&[data-indeterminate] {
		background-color: var(--switch--color--background--active);
		border-color: var(--switch--color--background--active);
	}

	&:focus-visible {
		box-shadow: 0 0 0 2px var(--color--secondary);
		outline: none;
		z-index: 1;
	}
}

.switchThumb {
	position: absolute;
	top: 50%;
	left: 2px;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--switch--toggle--color);
	transition:
		left 0.15s cubic-bezier(0.4, 0, 0.2, 1),
		width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: left, width;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);

	/* Mixed-state dash inside the thumb; hidden unless indeterminate. */
	&::after {
		content: '';
		border-radius: 1px;
		background-color: var(--switch--color--background--active);
		opacity: 0;
		transition: opacity 0.15s ease;
	}
}

.switchRoot[data-indeterminate] .switchThumb::after {
	opacity: 1;
}

/*
 * Hover/press stretch: the thumb elongates by 2px along the track. Unchecked is anchored
 * left (grows inward to the right), checked is anchored right (left shifts in sync so it
 * grows inward to the left), indeterminate stays centered. Disabled switches don't stretch.
 */

.label {
	flex: 1;
	font-size: var(--font-size--sm);
	line-height: 1.25;
	color: var(--color--text--shade-1);
	cursor: inherit;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;

	&[data-disabled] {
		color: var(--color--text--tint-1);
	}
}

/* Size: Small (for parameters panel) */
.small .switchRoot {
	width: 32px;
	height: 16px;
	border-radius: 48px;
}

.small .switchThumb {
	width: 12px;
	height: 12px;

	/* Fixed half-height radius (not 50%) so the thumb reads as a pill while stretched. */
	border-radius: 6px;

	&::after {
		width: 6px;
		height: 2px;
	}
}

.small .switchRoot[data-state='checked'] .switchThumb {
	left: calc(100% - 14px);
}

.small .switchRoot[data-indeterminate] .switchThumb {
	left: calc(50% - 6px);
}

.small .switchRoot:not([data-disabled]):hover .switchThumb,
.small .switchRoot:not([data-disabled]):active .switchThumb {
	width: 14px;
}

.small .switchRoot[data-state='checked']:not([data-disabled]):hover .switchThumb,
.small .switchRoot[data-state='checked']:not([data-disabled]):active .switchThumb {
	left: calc(100% - 16px);
}

.small .switchRoot[data-indeterminate]:not([data-disabled]):hover .switchThumb,
.small .switchRoot[data-indeterminate]:not([data-disabled]):active .switchThumb {
	left: calc(50% - 7px);
}

.small .label {
	font-size: var(--font-size--2xs);
}

/* Size: Large (for settings) */
.large .switchRoot {
	width: 40px;
	height: 20px;
	border-radius: 48px;
}

.large .switchThumb {
	width: 16px;
	height: 16px;
	border-radius: 8px;

	&::after {
		width: 8px;
		height: 2px;
	}
}

.large .switchRoot[data-state='checked'] .switchThumb {
	left: calc(100% - 18px);
}

.large .switchRoot[data-indeterminate] .switchThumb {
	left: calc(50% - 8px);
}

.large .switchRoot:not([data-disabled]):hover .switchThumb,
.large .switchRoot:not([data-disabled]):active .switchThumb {
	width: 18px;
}

.large .switchRoot[data-state='checked']:not([data-disabled]):hover .switchThumb,
.large .switchRoot[data-state='checked']:not([data-disabled]):active .switchThumb {
	left: calc(100% - 20px);
}

.large .switchRoot[data-indeterminate]:not([data-disabled]):hover .switchThumb,
.large .switchRoot[data-indeterminate]:not([data-disabled]):active .switchThumb {
	left: calc(50% - 9px);
}
</style>
