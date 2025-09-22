import { goto } from '$app/navigation';
import { navigating } from '$app/state';
import { app } from '$lib/states/app.svelte';
import { source, type Source } from 'sveltekit-sse';

class Client {
	private mainSource: Source | null = null;
	private connected = false;

	connect() {
		if (this.connected) {
			return;
		}

		this.mainSource = source('/events');
		this.mainSource
			.select('qrcode')
			.json()
			.subscribe((v) => {
				if (!app.qrEnabled) {
					return;
				}

				if (v && typeof v === 'object' && 'studentId' in v) {
					const id = v.studentId as string;
					navigating.complete?.then(() => {
						// eslint-disable-next-line svelte/no-navigation-without-resolve
						goto(`/students/${id}`).catch(console.warn);
					});
				}
			});

		this.connected = true;
	}
}

export const client = new Client();
