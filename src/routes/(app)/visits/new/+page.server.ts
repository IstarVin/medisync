import { db } from '$lib/server/db/index.js';
import { clinicVisits, students, users } from '$lib/server/db/schema.js';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const studentId = url.searchParams.get('studentId');

	if (!studentId) {
		throw redirect(302, '/students');
	}

	try {
		// Fetch the student to create visit for
		const [student] = await db
			.select({
				id: students.id,
				studentId: students.studentId,
				firstName: students.firstName,
				lastName: students.lastName,
				grade: students.grade,
				section: students.section
			})
			.from(students)
			.where(eq(students.id, studentId))
			.limit(1);

		if (!student) {
			throw redirect(302, '/students');
		}

		// Fetch available nurses for the form
		const availableNurses = await db
			.select({
				id: users.id,
				name: users.firstName,
				lastName: users.lastName,
				role: users.role
			})
			.from(users)
			.where(eq(users.role, 'nurse'))
			.orderBy(users.firstName, users.lastName);

		// Format nurse names for display
		const formattedNurses = availableNurses.map((nurse) => ({
			id: nurse.id,
			name: `${nurse.name} ${nurse.lastName}`
		}));

		return {
			student,
			availableNurses: formattedNurses
		};
	} catch (error) {
		console.error('Error loading student for new visit:', error);
		throw redirect(302, '/students');
	}
};

export const actions: Actions = {
	createVisit: async ({ request }) => {
		try {
			const formData = await request.formData();

			// Extract visit data
			const visitData = {
				studentId: formData.get('studentId') as string,
				nurseId: formData.get('nurseId') as string,
				visitType: formData.get('visitType') as string,
				severity: formData.get('severity') as string,
				isEmergency: formData.get('isEmergency') === 'true',
				reason: formData.get('reason') as string,
				details: formData.get('details') as string,
				medicationsGiven: formData.get('medicationsGiven') as string
			};

			// Validate required fields
			if (!visitData.studentId || !visitData.reason.trim()) {
				return fail(400, {
					error: 'Student ID and reason are required'
				});
			}

			if (!visitData.nurseId) {
				return fail(400, {
					error: 'Nurse selection is required'
				});
			}

			// Validate visit type
			const validVisitTypes = [
				'emergency',
				'illness',
				'injury',
				'medication',
				'checkup',
				'mental_health',
				'other'
			];
			if (!validVisitTypes.includes(visitData.visitType)) {
				return fail(400, {
					error: 'Invalid visit type'
				});
			}

			// Validate severity
			const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
			if (!validSeverityLevels.includes(visitData.severity)) {
				return fail(400, {
					error: 'Invalid severity level'
				});
			}

			// Verify student exists
			const [student] = await db
				.select({ id: students.id })
				.from(students)
				.where(eq(students.id, visitData.studentId))
				.limit(1);

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
			}

			// Verify nurse exists
			const [nurse] = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.id, visitData.nurseId))
				.limit(1);

			if (!nurse) {
				return fail(400, {
					error: 'Selected nurse not found'
				});
			}

			// Create the visit
			const [newVisit] = await db
				.insert(clinicVisits)
				.values({
					studentId: visitData.studentId,
					attendedById: visitData.nurseId,
					visitType: visitData.visitType as
						| 'emergency'
						| 'illness'
						| 'injury'
						| 'medication'
						| 'checkup'
						| 'mental_health'
						| 'other',
					severity: visitData.severity as 'low' | 'medium' | 'high' | 'critical',
					isEmergency: visitData.isEmergency,
					chiefComplaint: visitData.reason,
					symptoms: visitData.details || null,
					medicationGiven: visitData.medicationsGiven || null,
					status: 'active',
					parentNotified: visitData.isEmergency // Auto-notify parents for emergency visits
				})
				.returning({ id: clinicVisits.id });

			// Redirect to the new visit page
			throw redirect(302, `/visits/${newVisit.id}`);
		} catch (error) {
			console.error('Error creating visit:', error);
			return fail(500, {
				error: 'Failed to create visit. Please try again.'
			});
		}
	}
};
