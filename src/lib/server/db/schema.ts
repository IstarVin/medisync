import { relations } from 'drizzle-orm';
import {
	boolean,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

export type VitalSigns = {
	temperature: number;
	bloodPressureSystolic?: number;
	bloodPressureDiastolic?: number;
	pulse?: number;
	respiratoryRate?: number;
	oxygenSaturation?: number;
	heightCm?: number;
	weightKg?: number;
	bmi?: number;
	bloodSugar?: number;
	notes?: string;
};

// Enums for better type safety
export const userRoleEnum = pgEnum('user_role', ['admin', 'nurse', 'doctor', 'staff']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other', 'prefer_not_to_say']);
export const bloodTypeEnum = pgEnum('blood_type', [
	'A+',
	'A-',
	'B+',
	'B-',
	'AB+',
	'AB-',
	'O+',
	'O-',
	'unknown'
]);
export const visitTypeEnum = pgEnum('visit_type', [
	'emergency',
	'illness',
	'injury',
	'medication',
	'checkup',
	'mental_health',
	'other'
]);
export const visitStatusEnum = pgEnum('visit_status', ['active', 'completed', 'cancelled']);
export const severityEnum = pgEnum('severity', ['low', 'medium', 'high', 'critical']);
export const relationshipEnum = pgEnum('relationship', [
	'parent',
	'guardian',
	'sibling',
	'grandparent',
	'other'
]);
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'failed']);

// Users table (for staff - nurses, doctors, admins)
export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	firstName: varchar('first_name', { length: 100 }).notNull(),
	lastName: varchar('last_name', { length: 100 }).notNull(),
	role: userRoleEnum('role').notNull().default('nurse'),
	phoneNumber: varchar('phone_number', { length: 20 }),
	isActive: boolean('is_active').notNull().default(true),
	lastLogin: timestamp('last_login'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Students table
export const students = pgTable('students', {
	id: uuid('id').defaultRandom().primaryKey(),
	studentId: varchar('student_id', { length: 50 }).notNull().unique(), // School ID number
	qrCodeId: varchar('qr_code_id', { length: 100 }).unique(), // QR code identifier
	firstName: varchar('first_name', { length: 100 }).notNull(),
	lastName: varchar('last_name', { length: 100 }).notNull(),
	middleName: varchar('middle_name', { length: 100 }),
	email: varchar('email', { length: 255 }).unique(),
	dateOfBirth: timestamp('date_of_birth').notNull(),
	gender: genderEnum('gender').notNull(),
	grade: varchar('grade', { length: 20 }).notNull(),
	section: varchar('section', { length: 50 }),
	address: text('address'),

	// Simple medical information (as shown in the image)
	chronicHealthConditions: text('chronic_health_conditions').array().notNull().default([]),
	currentMedications: text('current_medications').array().notNull().default([]),
	doctorId: uuid('doctor_id').references(() => users.id), // Reference to assigned doctor in users table
	healthHistory: text('health_history'), // e.g., "I have allergies to pollen, dust, and pet fur..."

	enrollmentDate: timestamp('enrollment_date').notNull(),
	isActive: boolean('is_active').notNull().default(true),
	profilePicture: varchar('profile_picture', { length: 500 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Emergency contacts
export const emergencyContacts = pgTable('emergency_contacts', {
	id: uuid('id').defaultRandom().primaryKey(),
	studentId: uuid('student_id')
		.references(() => students.id, { onDelete: 'cascade' })
		.notNull(),
	name: varchar('name', { length: 200 }).notNull(),
	relationship: relationshipEnum('relationship').notNull(),
	phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
	alternatePhone: varchar('alternate_phone', { length: 20 }),
	email: varchar('email', { length: 255 }),
	address: text('address'),
	isPrimary: boolean('is_primary').notNull().default(false),
	priority: integer('priority').notNull().default(1), // 1 = highest priority
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Clinic visits
export const clinicVisits = pgTable('clinic_visits', {
	id: uuid('id').defaultRandom().primaryKey(),
	visitNumber: serial('visit_number').notNull().unique(), // Auto-incrementing visit number
	studentId: uuid('student_id')
		.references(() => students.id, { onDelete: 'cascade' })
		.notNull(),
	attendedById: uuid('attended_by_id')
		.references(() => users.id)
		.notNull(),
	visitType: visitTypeEnum('visit_type').notNull(),
	status: visitStatusEnum('status').notNull().default('active'),
	severity: severityEnum('severity').notNull().default('low'),
	checkInTime: timestamp('check_in_time').defaultNow().notNull(),
	checkOutTime: timestamp('check_out_time'),
	chiefComplaint: text('chief_complaint').notNull(), // Main reason for visit
	symptoms: text('symptoms'),
	vitalSigns: jsonb('vital_signs').$type<VitalSigns>(), // Store as JSON: temperature, blood pressure, pulse, etc.
	diagnosis: text('diagnosis'),
	treatment: text('treatment'),
	medicationGiven: text('medication_given'),
	instructions: text('instructions'),
	followUpRequired: boolean('follow_up_required').notNull().default(false),
	followUpDate: timestamp('follow_up_date'),
	notes: text('notes'),
	isEmergency: boolean('is_emergency').notNull().default(false),
	parentNotified: boolean('parent_notified').notNull().default(false),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Visit attachments (photos, documents, etc.)
export const visitAttachments = pgTable('visit_attachments', {
	id: uuid('id').defaultRandom().primaryKey(),
	visitId: uuid('visit_id')
		.references(() => clinicVisits.id, { onDelete: 'cascade' })
		.notNull(),
	fileName: varchar('file_name', { length: 255 }).notNull(),
	fileUrl: varchar('file_url', { length: 500 }).notNull(),
	fileType: varchar('file_type', { length: 50 }).notNull(), // image/jpeg, application/pdf, etc.
	fileSize: integer('file_size'), // in bytes
	description: text('description'),
	uploadedById: uuid('uploaded_by_id')
		.references(() => users.id)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Notifications (SMS/Email logs)
export const notifications = pgTable('notifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	visitId: uuid('visit_id').references(() => clinicVisits.id, { onDelete: 'cascade' }),
	recipientType: varchar('recipient_type', { length: 20 }).notNull(), // 'student', 'parent', 'emergency_contact'
	recipientId: uuid('recipient_id'), // Could reference different tables based on type
	recipientName: varchar('recipient_name', { length: 200 }).notNull(),
	recipientContact: varchar('recipient_contact', { length: 255 }).notNull(), // phone or email
	notificationType: varchar('notification_type', { length: 20 }).notNull(), // 'sms', 'email'
	subject: varchar('subject', { length: 255 }),
	message: text('message').notNull(),
	status: notificationStatusEnum('status').notNull().default('pending'),
	sentAt: timestamp('sent_at'),
	errorMessage: text('error_message'),
	retryCount: integer('retry_count').notNull().default(0),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// QR code scan logs for security and tracking
export const qrCodeLogs = pgTable('qr_code_logs', {
	id: uuid('id').defaultRandom().primaryKey(),
	qrCodeId: varchar('qr_code_id', { length: 100 }).notNull(),
	studentId: uuid('student_id').references(() => students.id),
	scannedAt: timestamp('scanned_at').defaultNow().notNull(),
	scanLocation: varchar('scan_location', { length: 100 }), // e.g., "Clinic Entrance"
	wasSuccessful: boolean('was_successful').notNull().default(true),
	errorMessage: text('error_message')
});

// System settings
export const systemSettings = pgTable('system_settings', {
	id: uuid('id').defaultRandom().primaryKey(),
	settingKey: varchar('setting_key', { length: 100 }).notNull().unique(),
	settingValue: text('setting_value'),
	description: text('description'),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Audit logs for security and compliance
export const auditLogs = pgTable('audit_logs', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').references(() => users.id),
	action: varchar('action', { length: 100 }).notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
	tableName: varchar('table_name', { length: 100 }),
	recordId: uuid('record_id'),
	oldValues: jsonb('old_values'),
	newValues: jsonb('new_values'),
	ipAddress: varchar('ip_address', { length: 45 }),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Define relationships
export const studentsRelations = relations(students, ({ one, many }) => ({
	doctor: one(users, {
		fields: [students.doctorId],
		references: [users.id]
	}),
	emergencyContacts: many(emergencyContacts),
	clinicVisits: many(clinicVisits),
	qrCodeLogs: many(qrCodeLogs)
}));

export const usersRelations = relations(users, ({ many }) => ({
	assignedStudents: many(students), // Students assigned to this doctor
	clinicVisits: many(clinicVisits),
	visitAttachments: many(visitAttachments),
	auditLogs: many(auditLogs)
}));

export const clinicVisitsRelations = relations(clinicVisits, ({ one, many }) => ({
	student: one(students, {
		fields: [clinicVisits.studentId],
		references: [students.id]
	}),
	attendedBy: one(users, {
		fields: [clinicVisits.attendedById],
		references: [users.id]
	}),
	attachments: many(visitAttachments),
	notifications: many(notifications)
}));

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
	student: one(students, {
		fields: [emergencyContacts.studentId],
		references: [students.id]
	})
}));

export const visitAttachmentsRelations = relations(visitAttachments, ({ one }) => ({
	visit: one(clinicVisits, {
		fields: [visitAttachments.visitId],
		references: [clinicVisits.id]
	}),
	uploadedBy: one(users, {
		fields: [visitAttachments.uploadedById],
		references: [users.id]
	})
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	visit: one(clinicVisits, {
		fields: [notifications.visitId],
		references: [clinicVisits.id]
	})
}));

export const qrCodeLogsRelations = relations(qrCodeLogs, ({ one }) => ({
	student: one(students, {
		fields: [qrCodeLogs.studentId],
		references: [students.id]
	})
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	})
}));
