import {
	ClinicVisit,
	connectMongoDB,
	EmergencyContact,
	Student,
	User,
	type IEmergencyContact,
	type IStudent,
	type IUser
} from '$lib/server/db/index.js';
import { sendMailMessage } from '$lib/server/mail.js';
import {
	calculateVisitStats,
	formatClinicVisit,
	formatEmergencyContact,
	formatStudent,
	formatUser
} from '$lib/utils/formatters.js';
import { logInfo, logWarn, withPerformanceLogging } from '$lib/utils/logger.js';
import { ERROR_MESSAGES } from '$lib/utils/student-constants.js';
import {
	handleValidationError,
	validateEmailData,
	validateEmergencyContactEmailData,
	validateReferralEmailData,
	validateVisitData
} from '$lib/utils/validation.js';
import { error, fail, isHttpError } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const studentId = params.id;

	try {
		// Ensure MongoDB connection
		await connectMongoDB();

		// Fetch student with doctor information
		const student = await Student.findOne({ studentId })
			.populate({
				path: 'doctorId',
				model: User,
				select: 'firstName lastName email phoneNumber'
			})
			.lean();

		if (!student) {
			throw error(404, {
				message: ERROR_MESSAGES.STUDENT_NOT_FOUND
			});
		}

		// Handle case where student might be an array (shouldn't happen with findOne but just in case)
		const studentDoc = Array.isArray(student) ? student[0] : student;

		if (!studentDoc) {
			throw error(404, {
				message: ERROR_MESSAGES.STUDENT_NOT_FOUND
			});
		}

		// Fetch all emergency contacts for this student
		const emergencyContactsList = await EmergencyContact.find({
			studentId: (studentDoc as unknown as IStudent)._id
		})
			.sort({ priority: 1, createdAt: 1 })
			.lean();

		// Fetch recent clinic visits (last 10 visits)
		const recentVisits = await ClinicVisit.find({
			studentId: (studentDoc as unknown as IStudent)._id
		})
			.populate({
				path: 'attendedById',
				model: User,
				select: 'firstName lastName role'
			})
			.sort({ checkInTime: -1 })
			.limit(10)
			.lean();

		// Calculate visit statistics
		const visitStats = calculateVisitStats(recentVisits);

		// Fetch available nurses for the form
		const availableNurses = await User.find({ role: 'nurse' })
			.select('_id firstName lastName role')
			.sort({ firstName: 1, lastName: 1 })
			.lean();

		// Format data using utility functions
		const formattedStudent = formatStudent(studentDoc as Record<string, unknown>);
		const formattedEmergencyContacts = emergencyContactsList.map((contact) =>
			formatEmergencyContact(contact as Record<string, unknown>)
		);
		const formattedRecentVisits = recentVisits.map((visit) =>
			formatClinicVisit(visit as Record<string, unknown>)
		);
		const formattedNurses = availableNurses.map((nurse) =>
			formatUser(nurse as Record<string, unknown>)
		);

		return {
			student: formattedStudent,
			emergencyContacts: formattedEmergencyContacts,
			recentVisits: formattedRecentVisits,
			visitStats,
			availableNurses: formattedNurses
		};
	} catch (err) {
		console.error('Error loading student:', err);

		if (isHttpError(err)) {
			throw err; // Re-throw SvelteKit errors
		}

		throw error(500, {
			message: 'Failed to load student information'
		});
	}
};

export const actions: Actions = {
	createVisit: async ({ request, params }) => {
		const studentId = params.id;

		return await withPerformanceLogging(
			'create_visit',
			async () => {
				// Ensure MongoDB connection
				await connectMongoDB();

				const formData = await request.formData();

				// Validate input data
				const validation = validateVisitData(formData);
				if (!validation.isValid) {
					logWarn('Visit validation failed', { studentId, error: validation.error });
					return handleValidationError(validation.error!);
				}

				const visitData = validation.data!;

				// Verify student exists
				const student = await Student.findOne({ studentId }).select('_id').lean();
				if (!student) {
					logWarn('Student not found for visit creation', { studentId });
					return handleValidationError(ERROR_MESSAGES.STUDENT_NOT_FOUND);
				}

				// Verify nurse exists
				const nurse = await User.findById(visitData.nurseId).select('_id').lean();
				if (!nurse) {
					logWarn('Nurse not found for visit creation', { studentId, nurseId: visitData.nurseId });
					return handleValidationError(ERROR_MESSAGES.NURSE_NOT_FOUND);
				}

				// Create the visit
				const newVisit = await ClinicVisit.create({
					studentId: (student as unknown as IStudent)._id,
					attendedById: visitData.nurseId,
					visitType: visitData.visitType,
					severity: visitData.severity,
					isEmergency: visitData.isEmergency,
					chiefComplaint: visitData.reason,
					symptoms: visitData.details || null,
					medicationGiven: visitData.medicationsGiven || null,
					status: 'active',
					parentNotified: visitData.isEmergency // Auto-notify parents for emergency visits
				});

				logInfo('Visit created successfully', {
					studentId,
					visitId: newVisit._id.toString(),
					visitType: visitData.visitType,
					isEmergency: visitData.isEmergency
				});

				return {
					success: true,
					visitId: newVisit._id.toString()
				};
			},
			{ studentId, action: 'create_visit' }
		);
	},

	sendEmergencyContactMail: async ({ request, params }) => {
		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = params.id;

			// Validate input data
			const validation = validateEmergencyContactEmailData(formData);
			if (!validation.isValid) {
				return handleValidationError(validation.error!);
			}

			const mailData = validation.data!;

			// Verify student exists
			const student = await Student.findOne({ studentId })
				.select('_id firstName lastName studentId')
				.lean();

			if (!student) {
				return handleValidationError(ERROR_MESSAGES.STUDENT_NOT_FOUND);
			}

			// Verify emergency contact exists and belongs to this student
			const contact = await EmergencyContact.findById(mailData.contactId)
				.select('_id name relationship email studentId')
				.lean();

			if (!contact) {
				return handleValidationError(ERROR_MESSAGES.CONTACT_NOT_FOUND);
			}

			if (
				(contact as unknown as IEmergencyContact).studentId?.toString() !==
				(student as unknown as IStudent)._id?.toString()
			) {
				return handleValidationError(ERROR_MESSAGES.CONTACT_MISMATCH);
			}

			if (!(contact as unknown as IEmergencyContact).email) {
				return handleValidationError(ERROR_MESSAGES.CONTACT_NO_EMAIL);
			}

			// Create the email message with context
			const emailContent = `
Dear ${(contact as unknown as IEmergencyContact).name},

This is an important message regarding ${(student as unknown as IStudent).firstName} ${(student as unknown as IStudent).lastName} (Student ID: ${(student as unknown as IStudent).studentId}).

${mailData.message}

---
This message was sent from CareLog School Health Management System.
Please contact the school if you have any questions or concerns.

Best regards,
School Health Office
			`.trim();

			// Send the email
			await sendMailMessage(
				(contact as unknown as IEmergencyContact).email!,
				emailContent,
				mailData.subject
			);

			return {
				success: true,
				message: `Email sent successfully to ${(contact as unknown as IEmergencyContact).name} (${(contact as unknown as IEmergencyContact).email})`
			};
		} catch (err) {
			console.error('Error sending emergency contact mail:', err);

			if (isHttpError(err)) {
				throw err;
			}

			return fail(500, {
				error: ERROR_MESSAGES.FAILED_TO_SEND_EMAIL
			});
		}
	},

	sendEmail: async ({ request, params }) => {
		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = params.id;

			// Validate input data
			const validation = validateEmailData(formData);
			if (!validation.isValid) {
				return handleValidationError(validation.error!);
			}

			const emailData = validation.data!;

			// Verify student exists
			const student = await Student.findOne({ studentId })
				.select('_id firstName lastName studentId email doctorId')
				.lean();

			if (!student) {
				return handleValidationError(ERROR_MESSAGES.STUDENT_NOT_FOUND);
			}

			let recipientName = '';
			let emailContent = '';

			// Handle different recipient types
			if (emailData.recipientType === 'emergency_contact') {
				// Verify emergency contact exists and belongs to this student
				const contact = await EmergencyContact.findById(emailData.recipientId)
					.select('_id name relationship email studentId')
					.lean();

				if (
					!contact ||
					(contact as unknown as IEmergencyContact).studentId?.toString() !==
						(student as unknown as IStudent)._id?.toString()
				) {
					return handleValidationError(ERROR_MESSAGES.CONTACT_MISMATCH);
				}

				recipientName = (contact as unknown as IEmergencyContact).name;
				emailContent = `
Dear ${(contact as unknown as IEmergencyContact).name},

This is an important message regarding ${(student as unknown as IStudent).firstName} ${(student as unknown as IStudent).lastName} (Student ID: ${(student as unknown as IStudent).studentId}).

${emailData.message}

---
This message was sent from CareLog School Health Management System.
Please contact the school if you have any questions or concerns.

Best regards,
School Health Office
				`.trim();
			} else if (emailData.recipientType === 'student') {
				// Verify email matches student
				if (emailData.recipientEmail !== (student as unknown as IStudent).email) {
					return handleValidationError(ERROR_MESSAGES.EMAIL_MISMATCH);
				}

				recipientName = `${(student as unknown as IStudent).firstName} ${(student as unknown as IStudent).lastName}`;
				emailContent = `
Dear ${(student as unknown as IStudent).firstName},

This is an important message from the school health office.

${emailData.message}

---
This message was sent from CareLog School Health Management System.
If you have any questions or concerns, please contact the school health office.

Best regards,
School Health Office
				`.trim();
			} else if (emailData.recipientType === 'doctor') {
				// Verify doctor is assigned to this student
				if (!(student as unknown as IStudent).doctorId) {
					return handleValidationError(ERROR_MESSAGES.NO_DOCTOR_ASSIGNED);
				}

				const doctor = await User.findById((student as unknown as IStudent).doctorId)
					.select('_id firstName lastName email role')
					.lean();

				if (!doctor || (doctor as unknown as IUser).role !== 'doctor') {
					return handleValidationError(ERROR_MESSAGES.DOCTOR_NOT_FOUND);
				}

				if (emailData.recipientEmail !== (doctor as unknown as IUser).email) {
					return handleValidationError(ERROR_MESSAGES.EMAIL_MISMATCH);
				}

				recipientName = `Dr. ${(doctor as unknown as IUser).firstName} ${(doctor as unknown as IUser).lastName}`;
				emailContent = `
Dear Dr. ${(doctor as unknown as IUser).lastName},

This is an important message regarding your patient ${(student as unknown as IStudent).firstName} ${(student as unknown as IStudent).lastName} (Student ID: ${(student as unknown as IStudent).studentId}).

${emailData.message}

---
This message was sent from CareLog School Health Management System.
Please contact the school if you need additional information.

Best regards,
School Health Office
				`.trim();
			}

			// Send the email
			await sendMailMessage(emailData.recipientEmail, emailContent, emailData.subject);

			return {
				success: true,
				message: `Email sent successfully to ${recipientName} (${emailData.recipientEmail})`
			};
		} catch (err) {
			console.error('Error sending email:', err);

			if (isHttpError(err)) {
				throw err;
			}

			return fail(500, {
				error: ERROR_MESSAGES.FAILED_TO_SEND_EMAIL
			});
		}
	},

	sendReferralEmail: async ({ request, params }) => {
		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = params.id;

			// Validate input data
			const validation = validateReferralEmailData(formData);
			if (!validation.isValid) {
				return handleValidationError(validation.error!);
			}

			const emailData = validation.data!;

			// Get student information
			const student = await Student.findOne({ studentId })
				.select('_id studentId firstName lastName dateOfBirth gender grade section address')
				.lean();

			if (!student) {
				return handleValidationError(ERROR_MESSAGES.STUDENT_NOT_FOUND);
			}

			// Calculate student age
			const today = new Date();
			const birthDate = new Date((student as unknown as IStudent).dateOfBirth);
			let age = today.getFullYear() - birthDate.getFullYear();
			const monthDiff = today.getMonth() - birthDate.getMonth();
			if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
				age--;
			}

			// Create email content with referral information
			// In a production environment, you would generate an actual PDF attachment
			const emailContent = `
${emailData.message}

---

MEDICAL REFERRAL FORM (SHD Form 3A)
=====================================

To: ${emailData.referralTo}
Address/Agency: ${emailData.referralAddress}
Date: ${emailData.referralDate}

PATIENT INFORMATION
-------------------
Name: ${(student as unknown as IStudent).firstName} ${(student as unknown as IStudent).lastName}
Age: ${age} years old
Student ID: ${(student as unknown as IStudent).studentId}
Grade/Section: ${(student as unknown as IStudent).grade}${(student as unknown as IStudent).section ? ` (${(student as unknown as IStudent).section})` : ''}
Gender: ${(student as unknown as IStudent).gender}
${(student as unknown as IStudent).address ? `Address: ${(student as unknown as IStudent).address}` : ''}

CHIEF COMPLAINT/HISTORY
-----------------------
${emailData.chiefComplaint}

IMPRESSION/DIAGNOSIS
--------------------
${emailData.impression}

REMARKS
-------
${emailData.remarks}

REFERRING PERSON
----------------
Name: ${emailData.referringPersonName}
Designation: ${emailData.referringPersonDesignation}

---
This medical referral was sent from CareLog School Health Management System.
			`.trim();

			// Send the email with referral content
			await sendMailMessage(emailData.recipientEmail, emailContent, emailData.subject);

			return {
				success: true,
				message: `Medical referral sent successfully to ${emailData.recipientEmail}`
			};
		} catch (err) {
			console.error('Error sending referral email:', err);

			if (isHttpError(err)) {
				throw err;
			}

			return fail(500, {
				error: ERROR_MESSAGES.FAILED_TO_SEND_REFERRAL
			});
		}
	}
};
