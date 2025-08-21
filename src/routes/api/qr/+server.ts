import { db } from '$lib/server/db';
import { systemSettings } from '$lib/server/db/schema';
import { mainEvents } from '$lib/server/events';
import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import z from 'zod';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.json();

	const res = z
		.object({ studentId: z.string().nonempty(), apiKey: z.string().nonempty().optional() })
		.safeParse(data);
	if (res.error) {
		return json(res.error);
	}

	const apiKey = res.data.apiKey;

	if (!apiKey && !locals.user) {
		return json({ message: 'Invalid api key' });
	}

	if (apiKey && !locals.user) {
		const validApiKey = await db.query.systemSettings.findFirst({
			where: and(eq(systemSettings.settingValue, apiKey), eq(systemSettings.isActive, true))
		});
		if (!validApiKey) {
			return json({ message: 'Invalid api key' });
		}
	}

	mainEvents.emitEvent('qrcode', { studentId: res.data.studentId });

	return json({ ok: true });
};
