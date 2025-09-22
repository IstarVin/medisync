type DatabaseDocument = Record<string, unknown>;

/**
 * Safe conversion to string for MongoDB ObjectId
 */
function safeToString(value: unknown): string {
	if (value && typeof value === 'object' && 'toString' in value) {
		return (value as { toString(): string }).toString();
	}
	return value?.toString() || '';
}

/**
 * Safe date conversion
 */
function safeToISOString(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (typeof value === 'string') {
		return new Date(value).toISOString();
	}
	return new Date().toISOString();
}

/**
 * Format student data for frontend consumption
 */
export function formatStudent(student: DatabaseDocument) {
	const doctorInfo = student.doctorId as DatabaseDocument | undefined;

	return {
		id: safeToString(student._id),
		studentId: student.studentId?.toString() || '',
		qrCodeId: student.qrCodeId?.toString() || null,
		firstName: student.firstName?.toString() || '',
		lastName: student.lastName?.toString() || '',
		middleName: student.middleName?.toString() || null,
		email: student.email?.toString() || null,
		dateOfBirth: safeToISOString(student.dateOfBirth),
		gender: student.gender?.toString() || 'unknown',
		grade: student.grade?.toString() || '',
		section: student.section?.toString() || null,
		address: student.address?.toString() || null,
		chronicHealthConditions: Array.isArray(student.chronicHealthConditions)
			? (student.chronicHealthConditions as string[])
			: [],
		currentMedications: Array.isArray(student.currentMedications)
			? (student.currentMedications as string[])
			: [],
		healthHistory: student.healthHistory?.toString() || null,
		enrollmentDate: safeToISOString(student.enrollmentDate),
		isActive: Boolean(student.isActive),
		profileUrl: student.profileUrl?.toString() || null,
		createdAt: safeToISOString(student.createdAt),
		updatedAt: safeToISOString(student.updatedAt),
		// Doctor information
		doctorId: safeToString(student.doctorId),
		doctorFirstName: doctorInfo?.firstName?.toString() || null,
		doctorLastName: doctorInfo?.lastName?.toString() || null,
		doctorEmail: doctorInfo?.email?.toString() || null,
		doctorPhone: doctorInfo?.phoneNumber?.toString() || null
	};
}

/**
 * Format emergency contact data for frontend consumption
 */
export function formatEmergencyContact(contact: DatabaseDocument) {
	return {
		id: safeToString(contact._id),
		studentId: safeToString(contact.studentId),
		name: contact.name?.toString() || '',
		relationship: contact.relationship?.toString() || 'other',
		phoneNumber: contact.phoneNumber?.toString() || '',
		alternatePhone: contact.alternatePhone?.toString() || null,
		email: contact.email?.toString() || null,
		address: contact.address?.toString() || null,
		isPrimary: Boolean(contact.isPrimary),
		priority: Number(contact.priority) || 0,
		createdAt: safeToISOString(contact.createdAt),
		updatedAt: safeToISOString(contact.updatedAt)
	};
}

/**
 * Format clinic visit data for frontend consumption
 */
export function formatClinicVisit(visit: DatabaseDocument) {
	const attendedBy = visit.attendedById as DatabaseDocument | undefined;

	// Validate and constrain visit type
	const validVisitTypes = [
		'emergency',
		'illness',
		'injury',
		'medication',
		'checkup',
		'mental_health',
		'other'
	] as const;
	const visitType = visit.visitType?.toString() || 'other';
	const constrainedVisitType = validVisitTypes.includes(
		visitType as (typeof validVisitTypes)[number]
	)
		? (visitType as (typeof validVisitTypes)[number])
		: 'other';

	// Validate and constrain status
	const validStatuses = ['active', 'completed', 'cancelled'] as const;
	const status = visit.status?.toString() || 'active';
	const constrainedStatus = validStatuses.includes(status as (typeof validStatuses)[number])
		? (status as (typeof validStatuses)[number])
		: 'active';

	// Validate and constrain severity
	const validSeverities = ['low', 'medium', 'high', 'critical'] as const;
	const severity = visit.severity?.toString() || 'low';
	const constrainedSeverity = validSeverities.includes(severity as (typeof validSeverities)[number])
		? (severity as (typeof validSeverities)[number])
		: 'low';

	return {
		id: safeToString(visit._id),
		visitNumber: Number(visit.visitNumber) || 0,
		visitType: constrainedVisitType,
		status: constrainedStatus,
		severity: constrainedSeverity,
		checkInTime: safeToISOString(visit.checkInTime),
		checkOutTime: visit.checkOutTime ? safeToISOString(visit.checkOutTime) : null,
		chiefComplaint: visit.chiefComplaint?.toString() || '',
		diagnosis: visit.diagnosis?.toString() || null,
		treatment: visit.treatment?.toString() || null,
		isEmergency: Boolean(visit.isEmergency),
		parentNotified: Boolean(visit.parentNotified),
		// Staff member who attended
		attendedByFirstName: attendedBy?.firstName?.toString() || null,
		attendedByLastName: attendedBy?.lastName?.toString() || null,
		attendedByRole: attendedBy?.role?.toString() || null
	};
}

/**
 * Format user data for frontend consumption
 */
export function formatUser(user: DatabaseDocument) {
	return {
		id: safeToString(user._id),
		name: `${user.firstName?.toString() || ''} ${user.lastName?.toString() || ''}`.trim()
	};
}

/**
 * Calculate visit statistics
 */
export function calculateVisitStats(visits: DatabaseDocument[]) {
	const now = new Date();

	return {
		total: visits.length,
		emergency: visits.filter((v) => Boolean(v.isEmergency)).length,
		thisMonth: visits.filter((v) => {
			if (!v.checkInTime) return false;
			const visitDate = new Date(v.checkInTime as Date);
			return (
				visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear()
			);
		}).length,
		lastVisit: visits[0]?.checkInTime || null
	};
}
