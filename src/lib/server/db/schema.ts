import mongoose, { Document, Schema, Types } from 'mongoose';

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

// Interface definitions for TypeScript types
export interface IUser extends Document {
	_id: Types.ObjectId;
	email: string;
	passwordHash: string;
	firstName: string;
	lastName: string;
	role: UserRole;
	phoneNumber?: string;
	profileUrl?: string;
	isActive: boolean;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface ISession extends Document {
	_id: string;
	userId: Types.ObjectId;
	expiresAt: Date;
}

export interface IStudent extends Document {
	_id: Types.ObjectId;
	studentId: string;
	qrCodeId?: string;
	firstName: string;
	lastName: string;
	middleName?: string;
	email?: string;
	dateOfBirth: Date;
	gender: Gender;
	grade: string;
	section?: string;
	address?: string;
	chronicHealthConditions: string[];
	currentMedications: string[];
	doctorId?: Types.ObjectId;
	healthHistory?: string;
	enrollmentDate: Date;
	isActive: boolean;
	profileUrl?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface IEmergencyContact extends Document {
	_id: Types.ObjectId;
	studentId: Types.ObjectId;
	name: string;
	relationship: Relationship;
	phoneNumber: string;
	alternatePhone?: string;
	email?: string;
	address?: string;
	isPrimary: boolean;
	priority: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface IClinicVisit extends Document {
	_id: Types.ObjectId;
	visitNumber: number;
	studentId: Types.ObjectId;
	attendedById: Types.ObjectId;
	visitType: VisitType;
	status: VisitStatus;
	severity: Severity;
	checkInTime: Date;
	checkOutTime?: Date;
	chiefComplaint: string;
	symptoms?: string;
	vitalSigns?: VitalSigns;
	diagnosis?: string;
	treatment?: string;
	medicationGiven?: string;
	instructions?: string;
	followUpRequired: boolean;
	followUpDate?: Date;
	notes?: string;
	isEmergency: boolean;
	parentNotified: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface IVisitAttachment extends Document {
	_id: Types.ObjectId;
	visitId: Types.ObjectId;
	fileName: string;
	fileUrl: string;
	fileType: string;
	fileSize?: number;
	description?: string;
	uploadedById: Types.ObjectId;
	createdAt: Date;
}

export interface INotification extends Document {
	_id: Types.ObjectId;
	visitId?: Types.ObjectId;
	recipientType: string;
	recipientId?: string;
	recipientName: string;
	recipientContact: string;
	notificationType: string;
	subject?: string;
	message: string;
	status: NotificationStatus;
	sentAt?: Date;
	errorMessage?: string;
	retryCount: number;
	createdAt: Date;
}

export interface IQrCodeLog extends Document {
	_id: Types.ObjectId;
	qrCodeId: string;
	studentId?: Types.ObjectId;
	scannedAt: Date;
	scanLocation?: string;
	wasSuccessful: boolean;
	errorMessage?: string;
}

export interface ISystemSetting extends Document {
	_id: Types.ObjectId;
	settingKey: string;
	settingValue?: string;
	description?: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface IAuditLog extends Document {
	_id: Types.ObjectId;
	userId?: Types.ObjectId;
	action: string;
	tableName?: string;
	recordId?: string;
	oldValues?: Record<string, unknown>;
	newValues?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
	createdAt: Date;
}

// Mongoose Schemas
const UserSchema = new Schema<IUser>(
	{
		email: { type: String, required: true, unique: true },
		passwordHash: { type: String, required: true },
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		role: { type: String, enum: USER_ROLES, default: 'nurse', required: true },
		phoneNumber: String,
		profileUrl: String,
		isActive: { type: Boolean, default: true, required: true },
		lastLogin: Date
	},
	{
		timestamps: true
	}
);

const SessionSchema = new Schema<ISession>(
	{
		_id: { type: String, required: true },
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		expiresAt: { type: Date, required: true }
	},
	{
		_id: false
	}
);

SessionSchema.index({ userId: 1 });

const StudentSchema = new Schema<IStudent>(
	{
		studentId: { type: String, required: true, unique: true },
		qrCodeId: { type: String, unique: true, sparse: true },
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		middleName: String,
		email: { type: String, unique: true, sparse: true },
		dateOfBirth: { type: Date, required: true },
		gender: { type: String, enum: GENDERS, required: true },
		grade: { type: String, required: true },
		section: String,
		address: String,
		chronicHealthConditions: { type: [String], default: [] },
		currentMedications: { type: [String], default: [] },
		doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
		healthHistory: String,
		enrollmentDate: { type: Date, required: true },
		isActive: { type: Boolean, default: true, required: true },
		profileUrl: String
	},
	{
		timestamps: true
	}
);

const EmergencyContactSchema = new Schema<IEmergencyContact>(
	{
		studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
		name: { type: String, required: true },
		relationship: { type: String, enum: RELATIONSHIPS, required: true },
		phoneNumber: { type: String, required: true },
		alternatePhone: String,
		email: String,
		address: String,
		isPrimary: { type: Boolean, default: false, required: true },
		priority: { type: Number, default: 1, required: true }
	},
	{
		timestamps: true
	}
);

const ClinicVisitSchema = new Schema<IClinicVisit>(
	{
		visitNumber: { type: Number, unique: true },
		studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
		attendedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		visitType: { type: String, enum: VISIT_TYPES, required: true },
		status: { type: String, enum: VISIT_STATUSES, default: 'active', required: true },
		severity: { type: String, enum: SEVERITIES, default: 'low', required: true },
		checkInTime: { type: Date, default: Date.now, required: true },
		checkOutTime: Date,
		chiefComplaint: { type: String, required: true },
		symptoms: String,
		vitalSigns: Schema.Types.Mixed,
		diagnosis: String,
		treatment: String,
		medicationGiven: String,
		instructions: String,
		followUpRequired: { type: Boolean, default: false, required: true },
		followUpDate: Date,
		notes: String,
		isEmergency: { type: Boolean, default: false, required: true },
		parentNotified: { type: Boolean, default: false, required: true }
	},
	{
		timestamps: true
	}
);

// Auto-increment visitNumber
ClinicVisitSchema.pre('save', async function () {
	if (this.isNew && !this.visitNumber) {
		const lastVisit = await mongoose.model('ClinicVisit').findOne().sort({ visitNumber: -1 });
		this.visitNumber = (lastVisit?.visitNumber || 0) + 1;
	}
});

const VisitAttachmentSchema = new Schema<IVisitAttachment>(
	{
		visitId: { type: Schema.Types.ObjectId, ref: 'ClinicVisit', required: true },
		fileName: { type: String, required: true },
		fileUrl: { type: String, required: true },
		fileType: { type: String, required: true },
		fileSize: Number,
		description: String,
		uploadedById: { type: Schema.Types.ObjectId, ref: 'User', required: true }
	},
	{
		timestamps: { createdAt: true, updatedAt: false }
	}
);

const NotificationSchema = new Schema<INotification>(
	{
		visitId: { type: Schema.Types.ObjectId, ref: 'ClinicVisit' },
		recipientType: { type: String, required: true },
		recipientId: String,
		recipientName: { type: String, required: true },
		recipientContact: { type: String, required: true },
		notificationType: { type: String, required: true },
		subject: String,
		message: { type: String, required: true },
		status: { type: String, enum: NOTIFICATION_STATUSES, default: 'pending', required: true },
		sentAt: Date,
		errorMessage: String,
		retryCount: { type: Number, default: 0, required: true }
	},
	{
		timestamps: { createdAt: true, updatedAt: false }
	}
);

const QrCodeLogSchema = new Schema<IQrCodeLog>(
	{
		qrCodeId: { type: String, required: true },
		studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
		scannedAt: { type: Date, default: Date.now, required: true },
		scanLocation: String,
		wasSuccessful: { type: Boolean, default: true, required: true },
		errorMessage: String
	},
	{
		timestamps: false
	}
);

const SystemSettingSchema = new Schema<ISystemSetting>(
	{
		settingKey: { type: String, required: true, unique: true },
		settingValue: String,
		description: String,
		isActive: { type: Boolean, default: true, required: true }
	},
	{
		timestamps: true
	}
);

const AuditLogSchema = new Schema<IAuditLog>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User' },
		action: { type: String, required: true },
		tableName: String,
		recordId: String,
		oldValues: Schema.Types.Mixed,
		newValues: Schema.Types.Mixed,
		ipAddress: String,
		userAgent: String
	},
	{
		timestamps: { createdAt: true, updatedAt: false }
	}
);

// Create and export models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Session =
	mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export const Student =
	mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export const EmergencyContact =
	mongoose.models.EmergencyContact ||
	mongoose.model<IEmergencyContact>('EmergencyContact', EmergencyContactSchema);
export const ClinicVisit =
	mongoose.models.ClinicVisit || mongoose.model<IClinicVisit>('ClinicVisit', ClinicVisitSchema);
export const VisitAttachment =
	mongoose.models.VisitAttachment ||
	mongoose.model<IVisitAttachment>('VisitAttachment', VisitAttachmentSchema);
export const Notification =
	mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const QrCodeLog =
	mongoose.models.QrCodeLog || mongoose.model<IQrCodeLog>('QrCodeLog', QrCodeLogSchema);
export const SystemSetting =
	mongoose.models.SystemSetting ||
	mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
export const AuditLog =
	mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Export types for compatibility
export type Session = ISession;
export type User = IUser;
