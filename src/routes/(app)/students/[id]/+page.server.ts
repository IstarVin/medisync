import {
	ClinicVisit,
	connectMongoDB,
	EmergencyContact,
	Student,
	User,
	type IClinicVisit,
	type IEmergencyContact,
	type IStudent,
	type IUser
} from '$lib/server/db/index.js';
import { sendMailMessage } from '$lib/server/mail.js';
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
				message: 'Student not found'
			});
		}

		// Fetch all emergency contacts for this student
		const emergencyContactsList = await EmergencyContact.find({
			studentId: (student as unknown as IStudent)._id
		})
			.sort({ priority: 1, createdAt: 1 })
			.lean();

		// Fetch recent clinic visits (last 10 visits)
		const recentVisits = await ClinicVisit.find({ studentId: (student as unknown as IStudent)._id })
			.populate({
				path: 'attendedById',
				model: User,
				select: 'firstName lastName role'
			})
			.sort({ checkInTime: -1 })
			.limit(10)
			.lean();

		// Calculate visit statistics
		const visitStats = {
			total: recentVisits.length,
			emergency: recentVisits.filter((v) => v.isEmergency).length,
			thisMonth: recentVisits.filter((v) => {
				const visitDate = new Date(v.checkInTime);
				const now = new Date();
				return (
					visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
				);
			}).length,
			lastVisit: recentVisits[0]?.checkInTime || null
		};

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
			qrCodeId: (student as unknown as IStudent).qrCodeId || null,
			firstName: (student as unknown as IStudent).firstName || '',
			lastName: (student as unknown as IStudent).lastName || '',
			middleName: (student as unknown as IStudent).middleName || null,
			email: (student as unknown as IStudent).email || null,
			dateOfBirth: (student as unknown as IStudent).dateOfBirth.toISOString(),
			gender: (student as unknown as IStudent).gender,
			grade: (student as unknown as IStudent).grade || '',
			section: (student as unknown as IStudent).section || null,
			address: (student as unknown as IStudent).address || null,
			chronicHealthConditions: (student as unknown as IStudent).chronicHealthConditions || [],
			currentMedications: (student as unknown as IStudent).currentMedications || [],
			healthHistory: (student as unknown as IStudent).healthHistory || null,
			enrollmentDate: (student as unknown as IStudent).enrollmentDate.toISOString(),
			isActive: (student as unknown as IStudent).isActive || false,
			profileUrl: (student as unknown as IStudent).profileUrl || null,
			createdAt: (student as unknown as IStudent).createdAt.toISOString(),
			updatedAt: (student as unknown as IStudent).updatedAt.toISOString(),
			// Doctor information
			doctorId: (student as unknown as IStudent).doctorId?.toString() || null,
			doctorFirstName:
				(student as unknown as IStudent & { doctorId: IUser }).doctorId?.firstName || null,
			doctorLastName:
				(student as unknown as IStudent & { doctorId: IUser }).doctorId?.lastName || null,
			doctorEmail: (student as unknown as IStudent & { doctorId: IUser }).doctorId?.email || null,
			doctorPhone:
				(student as unknown as IStudent & { doctorId: IUser }).doctorId?.phoneNumber || null
		};

		// Format emergency contacts
		const formattedEmergencyContacts = emergencyContactsList.map((contact) => ({
			id: (contact as unknown as IEmergencyContact)._id?.toString() || '',
			studentId: (contact as unknown as IEmergencyContact).studentId?.toString() || '',
			name: (contact as unknown as IEmergencyContact).name || '',
			relationship: (contact as unknown as IEmergencyContact).relationship || 'other',
			phoneNumber: (contact as unknown as IEmergencyContact).phoneNumber || '',
			alternatePhone: (contact as unknown as IEmergencyContact).alternatePhone || null,
			email: (contact as unknown as IEmergencyContact).email || null,
			address: (contact as unknown as IEmergencyContact).address || null,
			isPrimary: (contact as unknown as IEmergencyContact).isPrimary || false,
			priority: (contact as unknown as IEmergencyContact).priority || 0,
			createdAt: (contact as unknown as IEmergencyContact).createdAt.toISOString(),
			updatedAt: (contact as unknown as IEmergencyContact).updatedAt.toISOString()
		}));

		// Format recent visits
		const formattedRecentVisits = recentVisits.map((visit) => ({
			id: (visit as unknown as IClinicVisit)._id?.toString() || '',
			visitNumber: (visit as unknown as IClinicVisit).visitNumber || 0,
			visitType: (visit as unknown as IClinicVisit).visitType,
			status: (visit as unknown as IClinicVisit).status,
			severity: (visit as unknown as IClinicVisit).severity,
			checkInTime: (visit as unknown as IClinicVisit).checkInTime.toISOString(),
			checkOutTime: (visit as unknown as IClinicVisit).checkOutTime?.toISOString() || null,
			chiefComplaint: (visit as unknown as IClinicVisit).chiefComplaint || '',
			diagnosis: (visit as unknown as IClinicVisit).diagnosis || null,
			treatment: (visit as unknown as IClinicVisit).treatment || null,
			isEmergency: (visit as unknown as IClinicVisit).isEmergency || false,
			parentNotified: (visit as unknown as IClinicVisit).parentNotified || false,
			// Staff member who attended
			attendedByFirstName:
				(visit as unknown as IClinicVisit & { attendedById: IUser }).attendedById?.firstName ||
				null,
			attendedByLastName:
				(visit as unknown as IClinicVisit & { attendedById: IUser }).attendedById?.lastName || null,
			attendedByRole:
				(visit as unknown as IClinicVisit & { attendedById: IUser }).attendedById?.role || null
		}));

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
		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = params.id;

			// Extract visit data
			const visitData = {
				nurseId: formData.get('nurseId') as string,
				visitType: formData.get('visitType') as string,
				severity: formData.get('severity') as string,
				isEmergency: formData.get('isEmergency') === 'true',
				reason: formData.get('reason') as string,
				details: formData.get('details') as string,
				medicationsGiven: formData.get('medicationsGiven') as string
			};

			// Validate required fields
			if (!visitData.reason.trim()) {
				return fail(400, {
					error: 'Reason for visit is required'
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
			const student = await Student.findOne({ studentId }).select('_id').lean();

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
				studentId: (student as unknown as IStudent)._id,
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

			return {
				success: true,
				visitId: newVisit._id.toString()
			};
		} catch (error) {
			console.error('Error creating visit:', error);
			return fail(500, {
				error: 'Failed to create visit. Please try again.'
			});
		}
	},

	sendEmergencyContactMail: async ({ request, params }) => {
		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = params.id;

			// Extract form data
			const mailData = {
				contactId: formData.get('contactId') as string,
				contactEmail: formData.get('contactEmail') as string,
				subject: formData.get('subject') as string,
				message: formData.get('message') as string
			};

			// Validate required fields
			if (!mailData.subject.trim()) {
				return fail(400, {
					error: 'Subject is required'
				});
			}

			if (!mailData.message.trim()) {
				return fail(400, {
					error: 'Message is required'
				});
			}

			if (!mailData.contactEmail.trim()) {
				return fail(400, {
					error: 'Contact email is required'
				});
			}

			// Verify student exists
			const student = await Student.findOne({ studentId })
				.select('_id firstName lastName studentId')
				.lean();

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
			}

			// Verify emergency contact exists and belongs to this student
			const contact = await EmergencyContact.findById(mailData.contactId)
				.select('_id name relationship email studentId')
				.lean();

			if (!contact) {
				return fail(400, {
					error: 'Emergency contact not found'
				});
			}

			if (
				(contact as unknown as IEmergencyContact).studentId?.toString() !==
				(student as unknown as IStudent)._id?.toString()
			) {
				return fail(400, {
					error: 'Emergency contact does not belong to this student'
				});
			}

			if (!(contact as unknown as IEmergencyContact).email) {
				return fail(400, {
					error: 'This contact does not have an email address on file'
				});
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
		} catch (error) {
			console.error('Error sending emergency contact mail:', error);
			return fail(500, {
				error: 'Failed to send email. Please try again.'
			});
		}
	},

	sendEmail: async ({ request, params }) => {
		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = params.id;

			// Extract form data
			const emailData = {
				recipientType: formData.get('recipientType') as string,
				recipientId: formData.get('recipientId') as string,
				recipientEmail: formData.get('recipientEmail') as string,
				subject: formData.get('subject') as string,
				message: formData.get('message') as string
			};

			// Validate required fields
			if (!emailData.subject.trim()) {
				return fail(400, {
					error: 'Subject is required'
				});
			}

			if (!emailData.message.trim()) {
				return fail(400, {
					error: 'Message is required'
				});
			}

			if (!emailData.recipientEmail.trim()) {
				return fail(400, {
					error: 'Recipient email is required'
				});
			}

			if (!['emergency_contact', 'student', 'doctor'].includes(emailData.recipientType)) {
				return fail(400, {
					error: 'Invalid recipient type'
				});
			}

			// Verify student exists
			const student = await Student.findOne({ studentId })
				.select('_id firstName lastName studentId email doctorId')
				.lean();

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
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
					return fail(400, {
						error: 'Emergency contact not found or does not belong to this student'
					});
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
					return fail(400, {
						error: 'Email address does not match student record'
					});
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
					return fail(400, {
						error: 'No doctor assigned to this student'
					});
				}

				const doctor = await User.findById((student as unknown as IStudent).doctorId)
					.select('_id firstName lastName email role')
					.lean();

				if (!doctor || (doctor as unknown as IUser).role !== 'doctor') {
					return fail(400, {
						error: 'Assigned doctor not found'
					});
				}

				if (emailData.recipientEmail !== (doctor as unknown as IUser).email) {
					return fail(400, {
						error: 'Email address does not match doctor record'
					});
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
		} catch (error) {
			console.error('Error sending email:', error);
			return fail(500, {
				error: 'Failed to send email. Please try again.'
			});
		}
	},

	sendReferralEmail: async ({ request, params }) => {
		try {
			// Ensure MongoDB connection
			await connectMongoDB();

			const formData = await request.formData();
			const studentId = params.id;

			// Extract form data
			const emailData = {
				studentId: formData.get('studentId') as string,
				recipientEmail: formData.get('recipientEmail') as string,
				subject: formData.get('subject') as string,
				message: formData.get('message') as string,
				// Referral data
				referralTo: formData.get('referralTo') as string,
				referralAddress: formData.get('referralAddress') as string,
				referralDate: formData.get('referralDate') as string,
				chiefComplaint: formData.get('chiefComplaint') as string,
				impression: formData.get('impression') as string,
				remarks: formData.get('remarks') as string,
				referringPersonName: formData.get('referringPersonName') as string,
				referringPersonDesignation: formData.get('referringPersonDesignation') as string
			};

			// Validate required fields
			if (!emailData.recipientEmail || !emailData.subject || !emailData.message) {
				return fail(400, {
					error: 'All email fields are required'
				});
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(emailData.recipientEmail)) {
				return fail(400, {
					error: 'Invalid email address format'
				});
			}

			// Get student information
			const student = await Student.findOne({ studentId })
				.select('_id studentId firstName lastName dateOfBirth gender grade section address')
				.lean();

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
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
		} catch (error) {
			console.error('Error sending referral email:', error);
			return fail(500, {
				error: 'Failed to send referral email. Please try again.'
			});
		}
	}
};
