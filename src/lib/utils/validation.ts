import { fail } from '@sveltejs/kit';
import {
	EMAIL_REGEX,
	ERROR_MESSAGES,
	VALID_RECIPIENT_TYPES,
	VALID_SEVERITY_LEVELS,
	VALID_VISIT_TYPES,
	type RecipientType,
	type SeverityLevel,
	type VisitType
} from './student-constants.js';

/**
 * Validation result type
 */
export type ValidationResult = {
	isValid: boolean;
	error?: string;
};

/**
 * Sanitize and validate visit data
 */
export function validateVisitData(formData: FormData): ValidationResult & {
	data?: {
		nurseId: string;
		visitType: VisitType;
		severity: SeverityLevel;
		isEmergency: boolean;
		reason: string;
		details: string;
		medicationsGiven: string;
	};
} {
	const visitData = {
		nurseId: formData.get('nurseId')?.toString().trim() || '',
		visitType: formData.get('visitType')?.toString().trim() || '',
		severity: formData.get('severity')?.toString().trim() || '',
		isEmergency: formData.get('isEmergency') === 'true',
		reason: formData.get('reason')?.toString().trim() || '',
		details: formData.get('details')?.toString().trim() || '',
		medicationsGiven: formData.get('medicationsGiven')?.toString().trim() || ''
	};

	// Validate required fields
	if (!visitData.reason) {
		return { isValid: false, error: ERROR_MESSAGES.REASON_REQUIRED };
	}

	if (!visitData.nurseId) {
		return { isValid: false, error: ERROR_MESSAGES.NURSE_REQUIRED };
	}

	// Validate visit type
	if (!VALID_VISIT_TYPES.includes(visitData.visitType as VisitType)) {
		return { isValid: false, error: ERROR_MESSAGES.INVALID_VISIT_TYPE };
	}

	// Validate severity
	if (!VALID_SEVERITY_LEVELS.includes(visitData.severity as SeverityLevel)) {
		return { isValid: false, error: ERROR_MESSAGES.INVALID_SEVERITY };
	}

	return {
		isValid: true,
		data: {
			...visitData,
			visitType: visitData.visitType as VisitType,
			severity: visitData.severity as SeverityLevel
		}
	};
}

/**
 * Validate email data
 */
export function validateEmailData(formData: FormData): ValidationResult & {
	data?: {
		recipientType: RecipientType;
		recipientId: string;
		recipientEmail: string;
		subject: string;
		message: string;
	};
} {
	const emailData = {
		recipientType: formData.get('recipientType')?.toString().trim() || '',
		recipientId: formData.get('recipientId')?.toString().trim() || '',
		recipientEmail: formData.get('recipientEmail')?.toString().trim() || '',
		subject: formData.get('subject')?.toString().trim() || '',
		message: formData.get('message')?.toString().trim() || ''
	};

	// Validate required fields
	if (!emailData.subject) {
		return { isValid: false, error: ERROR_MESSAGES.SUBJECT_REQUIRED };
	}

	if (!emailData.message) {
		return { isValid: false, error: ERROR_MESSAGES.MESSAGE_REQUIRED };
	}

	if (!emailData.recipientEmail) {
		return { isValid: false, error: ERROR_MESSAGES.EMAIL_REQUIRED };
	}

	// Validate email format
	if (!EMAIL_REGEX.test(emailData.recipientEmail)) {
		return { isValid: false, error: ERROR_MESSAGES.INVALID_EMAIL_FORMAT };
	}

	// Validate recipient type
	if (!VALID_RECIPIENT_TYPES.includes(emailData.recipientType as RecipientType)) {
		return { isValid: false, error: ERROR_MESSAGES.INVALID_RECIPIENT_TYPE };
	}

	return {
		isValid: true,
		data: {
			...emailData,
			recipientType: emailData.recipientType as RecipientType
		}
	};
}

/**
 * Validate emergency contact email data
 */
export function validateEmergencyContactEmailData(formData: FormData): ValidationResult & {
	data?: {
		contactId: string;
		contactEmail: string;
		subject: string;
		message: string;
	};
} {
	const emailData = {
		contactId: formData.get('contactId')?.toString().trim() || '',
		contactEmail: formData.get('contactEmail')?.toString().trim() || '',
		subject: formData.get('subject')?.toString().trim() || '',
		message: formData.get('message')?.toString().trim() || ''
	};

	// Validate required fields
	if (!emailData.subject) {
		return { isValid: false, error: ERROR_MESSAGES.SUBJECT_REQUIRED };
	}

	if (!emailData.message) {
		return { isValid: false, error: ERROR_MESSAGES.MESSAGE_REQUIRED };
	}

	if (!emailData.contactEmail) {
		return { isValid: false, error: ERROR_MESSAGES.EMAIL_REQUIRED };
	}

	return { isValid: true, data: emailData };
}

/**
 * Validate referral email data
 */
export function validateReferralEmailData(formData: FormData): ValidationResult & {
	data?: {
		studentId: string;
		recipientEmail: string;
		subject: string;
		message: string;
		referralTo: string;
		referralAddress: string;
		referralDate: string;
		chiefComplaint: string;
		impression: string;
		remarks: string;
		referringPersonName: string;
		referringPersonDesignation: string;
	};
} {
	const emailData = {
		studentId: formData.get('studentId')?.toString().trim() || '',
		recipientEmail: formData.get('recipientEmail')?.toString().trim() || '',
		subject: formData.get('subject')?.toString().trim() || '',
		message: formData.get('message')?.toString().trim() || '',
		referralTo: formData.get('referralTo')?.toString().trim() || '',
		referralAddress: formData.get('referralAddress')?.toString().trim() || '',
		referralDate: formData.get('referralDate')?.toString().trim() || '',
		chiefComplaint: formData.get('chiefComplaint')?.toString().trim() || '',
		impression: formData.get('impression')?.toString().trim() || '',
		remarks: formData.get('remarks')?.toString().trim() || '',
		referringPersonName: formData.get('referringPersonName')?.toString().trim() || '',
		referringPersonDesignation: formData.get('referringPersonDesignation')?.toString().trim() || ''
	};

	// Validate required fields
	if (!emailData.recipientEmail || !emailData.subject || !emailData.message) {
		return { isValid: false, error: 'All email fields are required' };
	}

	// Validate email format
	if (!EMAIL_REGEX.test(emailData.recipientEmail)) {
		return { isValid: false, error: ERROR_MESSAGES.INVALID_EMAIL_FORMAT };
	}

	return { isValid: true, data: emailData };
}

/**
 * Handle validation error by returning fail response
 */
export function handleValidationError(error: string) {
	return fail(400, { error });
}
