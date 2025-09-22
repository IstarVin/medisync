/**
 * Constants and validation rules for the student page
 */

// Valid visit types
export const VALID_VISIT_TYPES = [
	'emergency',
	'illness',
	'injury',
	'medication',
	'checkup',
	'mental_health',
	'other'
] as const;

// Valid severity levels
export const VALID_SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

// Valid recipient types for emails
export const VALID_RECIPIENT_TYPES = ['emergency_contact', 'student', 'doctor'] as const;

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Error messages
export const ERROR_MESSAGES = {
	STUDENT_NOT_FOUND: 'Student not found',
	INVALID_VISIT_TYPE: 'Invalid visit type',
	INVALID_SEVERITY: 'Invalid severity level',
	INVALID_RECIPIENT_TYPE: 'Invalid recipient type',
	INVALID_EMAIL_FORMAT: 'Invalid email address format',
	REASON_REQUIRED: 'Reason for visit is required',
	NURSE_REQUIRED: 'Nurse selection is required',
	NURSE_NOT_FOUND: 'Selected nurse not found',
	SUBJECT_REQUIRED: 'Subject is required',
	MESSAGE_REQUIRED: 'Message is required',
	EMAIL_REQUIRED: 'Email is required',
	CONTACT_NOT_FOUND: 'Emergency contact not found',
	CONTACT_MISMATCH: 'Emergency contact does not belong to this student',
	CONTACT_NO_EMAIL: 'This contact does not have an email address on file',
	EMAIL_MISMATCH: 'Email address does not match record',
	NO_DOCTOR_ASSIGNED: 'No doctor assigned to this student',
	DOCTOR_NOT_FOUND: 'Assigned doctor not found',
	FAILED_TO_LOAD: 'Failed to load student information',
	FAILED_TO_CREATE_VISIT: 'Failed to create visit. Please try again.',
	FAILED_TO_SEND_EMAIL: 'Failed to send email. Please try again.',
	FAILED_TO_SEND_REFERRAL: 'Failed to send referral email. Please try again.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
	VISIT_CREATED: 'Visit created successfully',
	EMAIL_SENT: 'Email sent successfully',
	REFERRAL_SENT: 'Medical referral sent successfully'
} as const;

export type VisitType = (typeof VALID_VISIT_TYPES)[number];
export type SeverityLevel = (typeof VALID_SEVERITY_LEVELS)[number];
export type RecipientType = (typeof VALID_RECIPIENT_TYPES)[number];
