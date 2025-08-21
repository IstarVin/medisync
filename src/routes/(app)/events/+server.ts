import { generateSessionToken } from '$lib/server/auth';
import { mainEvents } from '$lib/server/events';
import { produce } from 'sveltekit-sse';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	return produce(async ({ emit }) => {
		const sessionId = generateSessionToken();
		mainEvents.setEventEmitter(sessionId, emit);

		return () => {
			mainEvents.removeEventEmitter(sessionId);
		};
	});
};
