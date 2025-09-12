import { db } from '$lib/server/db/index.js';
import { clinicVisits } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const visitId = params.id;

		// Fetch the specific visit with related student and staff information
		const visit = await db.query.clinicVisits.findFirst({
			where: eq(clinicVisits.id, visitId),
			with: {
				student: {
					columns: {
						id: true,
						studentId: true,
						firstName: true,
						lastName: true,
						grade: true,
						section: true,
						profileUrl: true,
						dateOfBirth: true,
						chronicHealthConditions: true,
						currentMedications: true,
						healthHistory: true
					},
					with: {
						emergencyContacts: true
					}
				},
				attendedBy: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						role: true
					}
				}
			}
		});

		if (!visit) {
			throw error(404, 'Visit not found');
		}

		return {
			visit
		};
	} catch (err) {
		console.error('Error loading visit:', err);
		throw error(500, 'Failed to load visit details');
	}
};
