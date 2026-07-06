import type { SwitchRootProps } from 'reka-ui';

export type SwitchSize = 'small' | 'large';

export type SwitchProps = Pick<
	SwitchRootProps,
	'disabled' | 'required' | 'name' | 'value' | 'id' | 'defaultValue' | 'as'
> & {
	label?: string;
	size?: SwitchSize;
	/**
	 * When `true`, the switch renders a mixed state (thumb centered, active track) used for
	 * bulk actions over a heterogeneous selection. Clicking while indeterminate emits
	 * `update:modelValue` with `true` (i.e. "turn everything on"). The parent is responsible
	 * for clearing this flag once the selection becomes homogeneous.
	 */
	indeterminate?: boolean;
};

export type SwitchSlots = {
	label(props: { label?: string }): unknown;
};

export type SwitchEmits = Record<string, never>;
