import {
	ClinicVisit,
	connectMongoDB,
	Student,
	User,
	type IStudent,
	type IUser
} from '$lib/server/db/index.js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const studentId = url.searchParams.get('studentId');

	if (!studentId) {
		throw redirect(302, '/students');
	}

	try {
		// Ensure MongoDB connection
		await connectMongoDB();

		// Fetch the student to create visit for
		const student = await Student.findById(studentId)
			.select('_id studentId firstName lastName grade section')
			.lean();

		if (!student) {
			throw redirect(302, '/students');
		}

		// Fetch available nurses for the form
		const availableNurses = await User.find({ role: 'nurse' })
			.select('_id firstName lastName role')
			.sort({ firstName: 1, lastName: 1 })
			.lean();

		// Format nurse names for display
		const formattedNurses = availableNurses.map((nurse) => ({
			id: (nurse as unknown as IUser)._id?.toString() || '',
			name: `${(nurse as unknown as IUser).firstName} ${(nurse as unknown as IUser).lastName}`
		}));

		// Format student data
		const formattedStudent = {
			id: (student as unknown as IStudent)._id?.toString() || '',
			studentId: (student as unknown as IStudent).studentId || '',
			firstName: (student as unknown as IStudent).firstName || '',
			lastName: (student as unknown as IStudent).lastName || '',
			grade: (student as unknown as IStudent).grade || '',
			section: (student as unknown as IStudent).section || null
		};

		return {
			student: formattedStudent,
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
			// Ensure MongoDB connection
			await connectMongoDB();

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
			const student = await Student.findById(visitData.studentId).select('_id').lean();

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
			}

			// Verify nurse exists
			const nurse = await User.findById(visitData.nurseId).select('_id').lean();

			if (!nurse) {
				return fail(400, {
					error: 'Selected nurse not found'
				});
			}

			// Create the visit
			const newVisit = await ClinicVisit.create({
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
			});

			// Redirect to the new visit page
			throw redirect(302, `/visits/${newVisit._id.toString()}`);
		} catch (error) {
			console.error('Error creating visit:', error);
			return fail(500, {
				error: 'Failed to create visit. Please try again.'
			});
		}
	}
};
