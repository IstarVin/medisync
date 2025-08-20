import { goto } from '$app/navigation';
import { app } from '$lib/states/app.svelte';
import { source } from 'sveltekit-sse';
import type { LayoutLoad } from './$types';

let connected = false;

export const load: LayoutLoad = async () => {
	if (!connected) {
		const mainSource = source('/events');
		mainSource
			.select('qrcode')
			.json()
			.subscribe((v) => {
				if (!app.qrEnabled) {
					return;
				}

				if (v && typeof v === 'object' && 'studentId' in v) {
					goto(`/students/${v.studentId}`);
				}
			});

		connected = true;
	}
};
