import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

// Enums for better type safety (as constants since SQLite doesn't have native enums)
export const USER_ROLES = ['admin', 'nurse', 'doctor', 'staff'] as const;
export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const;
export const VISIT_TYPES = [
	'emergency',
	'illness',
	'injury',
	'medication',
	'checkup',
	'mental_health',
	'other'
] as const;
export const VISIT_STATUSES = ['active', 'completed', 'cancelled'] as const;
export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export const RELATIONSHIPS = [
	'parent',
	'guardian',
	'sibling',
	'grandparent',
	'other',
	'adviser'
] as const;
export const NOTIFICATION_STATUSES = ['pending', 'sent', 'failed'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type Gender = (typeof GENDERS)[number];
export type BloodType = (typeof BLOOD_TYPES)[number];
export type VisitType = (typeof VISIT_TYPES)[number];
export type VisitStatus = (typeof VISIT_STATUSES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type Relationship = (typeof RELATIONSHIPS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

// Users table (for staff - nurses, doctors, admins)
export const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	role: text('role').$type<UserRole>().notNull().default('nurse'),
	phoneNumber: text('phone_number'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	lastLogin: integer('last_login', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const session = sqliteTable(
	'user_session',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
	},
	(t) => [index('idx_usersession_user_id').on(t.userId)]
);

// Students table
export const students = sqliteTable('students', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	studentId: text('student_id').notNull().unique(), // School ID number
	qrCodeId: text('qr_code_id').unique(), // QR code identifier
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	middleName: text('middle_name'),
	email: text('email').unique(),
	dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }).notNull(),
	gender: text('gender').$type<Gender>().notNull(),
	grade: text('grade').notNull(),
	section: text('section'),
	address: text('address'),

	// Simple medical information (as shown in the image)
	chronicHealthConditions: text('chronic_health_conditions', { mode: 'json' })
		.$type<string[]>()
		.notNull()
		.default([]),
	currentMedications: text('current_medications', { mode: 'json' })
		.$type<string[]>()
		.notNull()
		.default([]),
	doctorId: text('doctor_id').references(() => users.id), // Reference to assigned doctor in users table
	healthHistory: text('health_history'), // e.g., "I have allergies to pollen, dust, and pet fur..."

	enrollmentDate: integer('enrollment_date', { mode: 'timestamp' }).notNull(),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	profilePicture: text('profile_picture'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Emergency contacts
export const emergencyContacts = sqliteTable('emergency_contacts', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	studentId: text('student_id')
		.references(() => students.id, { onDelete: 'cascade' })
		.notNull(),
	name: text('name').notNull(),
	relationship: text('relationship').$type<Relationship>().notNull(),
	phoneNumber: text('phone_number').notNull(),
	alternatePhone: text('alternate_phone'),
	email: text('email'),
	address: text('address'),
	isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
	priority: integer('priority').notNull().default(1), // 1 = highest priority
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Clinic visits
// Clinic visits with proper auto-increment
export const clinicVisits = sqliteTable('clinic_visits', {
	visitNumber: integer('visit_number').primaryKey({ autoIncrement: true }), // Auto-incrementing visit number
	id: text('id')
		.notNull()
		.unique()
		.$defaultFn(() => crypto.randomUUID()),
	studentId: text('student_id')
		.references(() => students.id, { onDelete: 'cascade' })
		.notNull(),
	attendedById: text('attended_by_id')
		.references(() => users.id)
		.notNull(),
	visitType: text('visit_type').$type<VisitType>().notNull(),
	status: text('status').$type<VisitStatus>().notNull().default('active'),
	severity: text('severity').$type<Severity>().notNull().default('low'),
	checkInTime: integer('check_in_time', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	checkOutTime: integer('check_out_time', { mode: 'timestamp' }),
	chiefComplaint: text('chief_complaint').notNull(), // Main reason for visit
	symptoms: text('symptoms'),
	vitalSigns: text('vital_signs', { mode: 'json' }).$type<VitalSigns>(), // Store as JSON: temperature, blood pressure, pulse, etc.
	diagnosis: text('diagnosis'),
	treatment: text('treatment'),
	medicationGiven: text('medication_given'),
	instructions: text('instructions'),
	followUpRequired: integer('follow_up_required', { mode: 'boolean' }).notNull().default(false),
	followUpDate: integer('follow_up_date', { mode: 'timestamp' }),
	notes: text('notes'),
	isEmergency: integer('is_emergency', { mode: 'boolean' }).notNull().default(false),
	parentNotified: integer('parent_notified', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Visit attachments (photos, documents, etc.)
export const visitAttachments = sqliteTable('visit_attachments', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	visitId: text('visit_id')
		.references(() => clinicVisits.id, { onDelete: 'cascade' })
		.notNull(),
	fileName: text('file_name').notNull(),
	fileUrl: text('file_url').notNull(),
	fileType: text('file_type').notNull(), // image/jpeg, application/pdf, etc.
	fileSize: integer('file_size'), // in bytes
	description: text('description'),
	uploadedById: text('uploaded_by_id')
		.references(() => users.id)
		.notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Notifications (SMS/Email logs)
export const notifications = sqliteTable('notifications', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	visitId: text('visit_id').references(() => clinicVisits.id, { onDelete: 'cascade' }),
	recipientType: text('recipient_type').notNull(), // 'student', 'parent', 'emergency_contact'
	recipientId: text('recipient_id'), // Could reference different tables based on type
	recipientName: text('recipient_name').notNull(),
	recipientContact: text('recipient_contact').notNull(), // phone or email
	notificationType: text('notification_type').notNull(), // 'sms', 'email'
	subject: text('subject'),
	message: text('message').notNull(),
	status: text('status').$type<NotificationStatus>().notNull().default('pending'),
	sentAt: integer('sent_at', { mode: 'timestamp' }),
	errorMessage: text('error_message'),
	retryCount: integer('retry_count').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// QR code scan logs for security and tracking
export const qrCodeLogs = sqliteTable('qr_code_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	qrCodeId: text('qr_code_id').notNull(),
	studentId: text('student_id').references(() => students.id),
	scannedAt: integer('scanned_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	scanLocation: text('scan_location'), // e.g., "Clinic Entrance"
	wasSuccessful: integer('was_successful', { mode: 'boolean' }).notNull().default(true),
	errorMessage: text('error_message')
});

// System settings
export const systemSettings = sqliteTable('system_settings', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	settingKey: text('setting_key').notNull().unique(),
	settingValue: text('setting_value'),
	description: text('description'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Audit logs for security and compliance
export const auditLogs = sqliteTable('audit_logs', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id),
	action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
	tableName: text('table_name'),
	recordId: text('record_id'),
	oldValues: text('old_values', { mode: 'json' }),
	newValues: text('new_values', { mode: 'json' }),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
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

export type Session = typeof session.$inferSelect;
export type User = typeof users.$inferSelect;
