import { mainEvents } from '$lib/server/events';
import { json } from '@sveltejs/kit';
import z from 'zod';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const res = z.object({ studentId: z.string().nonempty() }).safeParse(data);
	if (res.error) {
		return json(res.error);
	}

	mainEvents.emitEvent('qrcode', { ...res.data });

	return json({ ok: true });
};
