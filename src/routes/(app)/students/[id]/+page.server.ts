import { db } from '$lib/server/db/index.js';
import { clinicVisits, emergencyContacts, students, users } from '$lib/server/db/schema.js';
import { sendMailMessage } from '$lib/server/mail.js';
import { error, fail, isHttpError } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const studentId = params.id;

	try {
		// Fetch student with all related data
		const [student] = await db
			.select({
				id: students.id,
				studentId: students.studentId,
				qrCodeId: students.qrCodeId,
				firstName: students.firstName,
				lastName: students.lastName,
				middleName: students.middleName,
				email: students.email,
				dateOfBirth: students.dateOfBirth,
				gender: students.gender,
				grade: students.grade,
				section: students.section,
				address: students.address,
				chronicHealthConditions: students.chronicHealthConditions,
				currentMedications: students.currentMedications,
				healthHistory: students.healthHistory,
				enrollmentDate: students.enrollmentDate,
				isActive: students.isActive,
				profileUrl: students.profileUrl,
				createdAt: students.createdAt,
				updatedAt: students.updatedAt,
				// Doctor information
				doctorId: students.doctorId,
				doctorFirstName: users.firstName,
				doctorLastName: users.lastName,
				doctorEmail: users.email,
				doctorPhone: users.phoneNumber
			})
			.from(students)
			.leftJoin(users, eq(students.doctorId, users.id))
			.where(eq(students.studentId, studentId));

		if (!student) {
			throw error(404, {
				message: 'Student not found'
			});
		}

		// Fetch all emergency contacts for this student
		const emergencyContactsList = await db
			.select()
			.from(emergencyContacts)
			.where(eq(emergencyContacts.studentId, student.id))
			.orderBy(emergencyContacts.priority);

		// Fetch recent clinic visits (last 10 visits)
		const recentVisits = await db
			.select({
				id: clinicVisits.id,
				visitNumber: clinicVisits.visitNumber,
				visitType: clinicVisits.visitType,
				status: clinicVisits.status,
				severity: clinicVisits.severity,
				checkInTime: clinicVisits.checkInTime,
				checkOutTime: clinicVisits.checkOutTime,
				chiefComplaint: clinicVisits.chiefComplaint,
				diagnosis: clinicVisits.diagnosis,
				treatment: clinicVisits.treatment,
				isEmergency: clinicVisits.isEmergency,
				parentNotified: clinicVisits.parentNotified,
				// Staff member who attended
				attendedByFirstName: users.firstName,
				attendedByLastName: users.lastName,
				attendedByRole: users.role
			})
			.from(clinicVisits)
			.leftJoin(users, eq(clinicVisits.attendedById, users.id))
			.where(eq(clinicVisits.studentId, student.id))
			.orderBy(desc(clinicVisits.checkInTime))
			.limit(10);

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
			student: {
				...student,
				dateOfBirth: student.dateOfBirth.toISOString(),
				enrollmentDate: student.enrollmentDate.toISOString(),
				createdAt: student.createdAt.toISOString(),
				updatedAt: student.updatedAt.toISOString()
			},
			emergencyContacts: emergencyContactsList.map((contact) => ({
				...contact,
				createdAt: contact.createdAt.toISOString(),
				updatedAt: contact.updatedAt.toISOString()
			})),
			recentVisits: recentVisits.map((visit) => ({
				...visit,
				checkInTime: visit.checkInTime.toISOString(),
				checkOutTime: visit.checkOutTime?.toISOString() || null
			})),
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
			const [student] = await db
				.select({ id: students.id })
				.from(students)
				.where(eq(students.studentId, studentId))
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
					studentId: student.id,
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

			return {
				success: true,
				visitId: newVisit.id
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
			const [student] = await db
				.select({
					id: students.id,
					firstName: students.firstName,
					lastName: students.lastName,
					studentId: students.studentId
				})
				.from(students)
				.where(eq(students.studentId, studentId))
				.limit(1);

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
			}

			// Verify emergency contact exists and belongs to this student
			const [contact] = await db
				.select({
					id: emergencyContacts.id,
					name: emergencyContacts.name,
					relationship: emergencyContacts.relationship,
					email: emergencyContacts.email
				})
				.from(emergencyContacts)
				.where(eq(emergencyContacts.id, mailData.contactId))
				.limit(1);

			if (!contact) {
				return fail(400, {
					error: 'Emergency contact not found'
				});
			}

			if (!contact.email) {
				return fail(400, {
					error: 'This contact does not have an email address on file'
				});
			}

			// Create the email message with context
			const emailContent = `
Dear ${contact.name},

This is an important message regarding ${student.firstName} ${student.lastName} (Student ID: ${student.studentId}).

${mailData.message}

---
This message was sent from CareLog School Health Management System.
Please contact the school if you have any questions or concerns.

Best regards,
School Health Office
			`.trim();

			// Send the email
			await sendMailMessage(contact.email, emailContent, mailData.subject);

			return {
				success: true,
				message: `Email sent successfully to ${contact.name} (${contact.email})`
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
			const [student] = await db
				.select({
					id: students.id,
					firstName: students.firstName,
					lastName: students.lastName,
					studentId: students.studentId,
					email: students.email,
					doctorId: students.doctorId
				})
				.from(students)
				.where(eq(students.studentId, studentId))
				.limit(1);

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
				const [contact] = await db
					.select({
						id: emergencyContacts.id,
						name: emergencyContacts.name,
						relationship: emergencyContacts.relationship,
						email: emergencyContacts.email,
						studentId: emergencyContacts.studentId
					})
					.from(emergencyContacts)
					.where(eq(emergencyContacts.id, emailData.recipientId))
					.limit(1);

				if (!contact || contact.studentId !== student.id) {
					return fail(400, {
						error: 'Emergency contact not found or does not belong to this student'
					});
				}

				recipientName = contact.name;
				emailContent = `
Dear ${contact.name},

This is an important message regarding ${student.firstName} ${student.lastName} (Student ID: ${student.studentId}).

${emailData.message}

---
This message was sent from CareLog School Health Management System.
Please contact the school if you have any questions or concerns.

Best regards,
School Health Office
				`.trim();
			} else if (emailData.recipientType === 'student') {
				// Verify email matches student
				if (emailData.recipientEmail !== student.email) {
					return fail(400, {
						error: 'Email address does not match student record'
					});
				}

				recipientName = `${student.firstName} ${student.lastName}`;
				emailContent = `
Dear ${student.firstName},

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
				if (!student.doctorId) {
					return fail(400, {
						error: 'No doctor assigned to this student'
					});
				}

				const [doctor] = await db
					.select({
						id: users.id,
						firstName: users.firstName,
						lastName: users.lastName,
						email: users.email,
						role: users.role
					})
					.from(users)
					.where(eq(users.id, student.doctorId))
					.limit(1);

				if (!doctor || doctor.role !== 'doctor') {
					return fail(400, {
						error: 'Assigned doctor not found'
					});
				}

				if (emailData.recipientEmail !== doctor.email) {
					return fail(400, {
						error: 'Email address does not match doctor record'
					});
				}

				recipientName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
				emailContent = `
Dear Dr. ${doctor.lastName},

This is an important message regarding your patient ${student.firstName} ${student.lastName} (Student ID: ${student.studentId}).

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
			const [student] = await db
				.select({
					id: students.id,
					studentId: students.studentId,
					firstName: students.firstName,
					lastName: students.lastName,
					dateOfBirth: students.dateOfBirth,
					gender: students.gender,
					grade: students.grade,
					section: students.section,
					address: students.address
				})
				.from(students)
				.where(eq(students.studentId, studentId))
				.limit(1);

			if (!student) {
				return fail(400, {
					error: 'Student not found'
				});
			}

			// Calculate student age
			const today = new Date();
			const birthDate = new Date(student.dateOfBirth);
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
Name: ${student.firstName} ${student.lastName}
Age: ${age} years old
Student ID: ${student.studentId}
Grade/Section: ${student.grade}${student.section ? ` (${student.section})` : ''}
Gender: ${student.gender}
${student.address ? `Address: ${student.address}` : ''}

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
