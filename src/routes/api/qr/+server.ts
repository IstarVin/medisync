import { db } from '$lib/server/db';
import { systemSettings } from '$lib/server/db/schema';
import { mainEvents } from '$lib/server/events';
import { json, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import z from 'zod';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const studentId = url.searchParams.get('id');

	if (!studentId) {
		return json({ error: 'Student ID is required' }, { status: 400 });
	}

	// If user is authenticated, redirect directly to student page
	if (locals.user) {
		throw redirect(302, `/students/${studentId}`);
	}

	// For unauthenticated users, we could redirect to a public student info page
	// or handle it differently based on your requirements
	// For now, let's redirect to login with a return URL
	throw redirect(302, `/login?returnTo=/students/${studentId}`);
};

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
