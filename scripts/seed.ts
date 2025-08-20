import { db } from '../src/lib/server/db/index';
import {
	auditLogs,
	clinicVisits,
	emergencyContacts,
	notifications,
	qrCodeLogs,
	students,
	systemSettings,
	users
} from '../src/lib/server/db/schema';

async function main() {
	// 1. Create sample users (staff)
	const [admin, nurse, doctor] = await db
		.insert(users)
		.values([
			{
				email: 'admin@school.edu',
				passwordHash: 'hashedpassword1',
				firstName: 'Alice',
				lastName: 'Admin',
				role: 'admin',
				phoneNumber: '1234567890'
			},
			{
				email: 'nurse@school.edu',
				passwordHash: 'hashedpassword2',
				firstName: 'Nancy',
				lastName: 'Nurse',
				role: 'nurse',
				phoneNumber: '2345678901'
			},
			{
				email: 'doctor@school.edu',
				passwordHash: 'hashedpassword3',
				firstName: 'David',
				lastName: 'Doctor',
				role: 'doctor',
				phoneNumber: '3456789012'
			}
		])
		.returning();

	// 2. Create sample students - expanded with more realistic data
	const sampleStudents = await db
		.insert(students)
		.values([
			{
				studentId: '2023001',
				qrCodeId: 'QR2023001',
				firstName: 'Ethan',
				lastName: 'Carter',
				email: 'ethan.carter@school.edu',
				dateOfBirth: new Date('2008-03-15'),
				gender: 'male',
				grade: '10th',
				section: 'A',
				address: '123 Oak Street, Springfield',
				chronicHealthConditions: [],
				currentMedications: [],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023002',
				qrCodeId: 'QR2023002',
				firstName: 'Olivia',
				lastName: 'Bennett',
				email: 'olivia.bennett@school.edu',
				dateOfBirth: new Date('2007-09-22'),
				gender: 'female',
				grade: '11th',
				section: 'B',
				address: '456 Pine Avenue, Springfield',
				chronicHealthConditions: ['Allergies (Peanuts)'],
				currentMedications: ['EpiPen'],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023003',
				qrCodeId: 'QR2023003',
				firstName: 'Noah',
				lastName: 'Thompson',
				email: 'noah.thompson@school.edu',
				dateOfBirth: new Date('2009-01-10'),
				gender: 'male',
				grade: '9th',
				section: 'A',
				address: '789 Maple Drive, Springfield',
				chronicHealthConditions: ['Asthma'],
				currentMedications: ['Albuterol Inhaler'],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023004',
				qrCodeId: 'QR2023004',
				firstName: 'Sophia',
				lastName: 'Ramirez',
				email: 'sophia.ramirez@school.edu',
				dateOfBirth: new Date('2006-11-30'),
				gender: 'female',
				grade: '12th',
				section: 'A',
				address: '321 Elm Street, Springfield',
				chronicHealthConditions: ['Type 1 Diabetes'],
				currentMedications: ['Insulin'],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023005',
				qrCodeId: 'QR2023005',
				firstName: 'Liam',
				lastName: 'Foster',
				email: 'liam.foster@school.edu',
				dateOfBirth: new Date('2008-07-14'),
				gender: 'male',
				grade: '10th',
				section: 'B',
				address: '654 Cedar Lane, Springfield',
				chronicHealthConditions: [],
				currentMedications: [],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023006',
				qrCodeId: 'QR2023006',
				firstName: 'Ava',
				lastName: 'Mitchell',
				email: 'ava.mitchell@school.edu',
				dateOfBirth: new Date('2007-05-18'),
				gender: 'female',
				grade: '11th',
				section: 'A',
				address: '987 Birch Road, Springfield',
				chronicHealthConditions: ['Allergies (Dairy)'],
				currentMedications: [],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023007',
				qrCodeId: 'QR2023007',
				firstName: 'Jackson',
				lastName: 'Hayes',
				email: 'jackson.hayes@school.edu',
				dateOfBirth: new Date('2009-02-25'),
				gender: 'male',
				grade: '9th',
				section: 'C',
				address: '147 Willow Street, Springfield',
				chronicHealthConditions: ['Epilepsy'],
				currentMedications: ['Seizure medication'],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023008',
				qrCodeId: 'QR2023008',
				firstName: 'Isabella',
				lastName: 'Coleman',
				email: 'isabella.coleman@school.edu',
				dateOfBirth: new Date('2006-12-03'),
				gender: 'female',
				grade: '12th',
				section: 'B',
				address: '258 Spruce Circle, Springfield',
				chronicHealthConditions: [],
				currentMedications: [],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023009',
				qrCodeId: 'QR2023009',
				firstName: 'Lucas',
				lastName: 'Harper',
				email: 'lucas.harper@school.edu',
				dateOfBirth: new Date('2008-08-17'),
				gender: 'male',
				grade: '10th',
				section: 'A',
				address: '369 Fir Avenue, Springfield',
				chronicHealthConditions: ['Allergies (Gluten)'],
				currentMedications: [],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023010',
				qrCodeId: 'QR2023010',
				firstName: 'Mia',
				lastName: 'Powell',
				email: 'mia.powell@school.edu',
				dateOfBirth: new Date('2007-04-12'),
				gender: 'female',
				grade: '11th',
				section: 'C',
				address: '741 Poplar Drive, Springfield',
				chronicHealthConditions: [],
				currentMedications: [],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			// Additional students for better testing
			{
				studentId: '2023011',
				qrCodeId: 'QR2023011',
				firstName: 'Alexander',
				lastName: 'Johnson',
				email: 'alexander.johnson@school.edu',
				dateOfBirth: new Date('2009-06-08'),
				gender: 'male',
				grade: '9th',
				section: 'B',
				address: '852 Magnolia Street, Springfield',
				chronicHealthConditions: ['ADHD'],
				currentMedications: ['Ritalin'],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2023012',
				qrCodeId: 'QR2023012',
				firstName: 'Emma',
				lastName: 'Williams',
				email: 'emma.williams@school.edu',
				dateOfBirth: new Date('2006-10-14'),
				gender: 'female',
				grade: '12th',
				section: 'C',
				address: '963 Sycamore Lane, Springfield',
				chronicHealthConditions: ['Anxiety', 'Allergies (Shellfish)'],
				currentMedications: ['Anxiety medication'],
				doctorId: doctor.id,
				enrollmentDate: new Date('2023-08-15'),
				isActive: true
			},
			{
				studentId: '2022001',
				qrCodeId: 'QR2022001',
				firstName: 'James',
				lastName: 'Brown',
				email: 'james.brown@school.edu',
				dateOfBirth: new Date('2007-01-20'),
				gender: 'male',
				grade: '11th',
				section: 'A',
				address: '159 Hickory Road, Springfield',
				chronicHealthConditions: [],
				currentMedications: [],
				doctorId: doctor.id,
				enrollmentDate: new Date('2022-08-15'),
				isActive: false // Graduated or transferred
			}
		])
		.returning();

	// 3. Emergency contacts for each student
	const emergencyContactsData = [];
	for (let i = 0; i < sampleStudents.length; i++) {
		const student = sampleStudents[i];
		emergencyContactsData.push({
			studentId: student.id,
			name: `Parent of ${student.firstName}`,
			relationship: 'parent' as const,
			phoneNumber: `555-${String(i + 1).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
			email: `parent.${student.firstName.toLowerCase()}@email.com`,
			isPrimary: true,
			priority: 1
		});
	}
	await db.insert(emergencyContacts).values(emergencyContactsData);

	// 4. Sample clinic visits for some students
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const lastWeek = new Date(today);
	lastWeek.setDate(today.getDate() - 7);
	const twoHoursAgo = new Date(today);
	twoHoursAgo.setHours(today.getHours() - 2);
	const oneHourAgo = new Date(today);
	oneHourAgo.setHours(today.getHours() - 1);

	const clinicVisitsData = [
		{
			studentId: sampleStudents[2].id, // Noah with Asthma
			attendedById: nurse.id,
			visitType: 'emergency' as const,
			status: 'completed' as const,
			severity: 'high' as const,
			checkInTime: twoHoursAgo,
			checkOutTime: oneHourAgo,
			chiefComplaint: 'Difficulty breathing during PE class',
			symptoms: 'Wheezing, shortness of breath, chest tightness',
			vitalSigns: { temperature: 37.2, pulse: 115, respiratoryRate: 28 },
			diagnosis: 'Asthma exacerbation',
			treatment: 'Albuterol inhaler administered, rest, monitoring',
			medicationGiven: 'Albuterol 2 puffs',
			instructions: 'Rest for remainder of day, avoid strenuous activity',
			followUpRequired: true,
			isEmergency: true,
			parentNotified: true
		},
		{
			studentId: sampleStudents[3].id, // Sophia with Diabetes
			attendedById: nurse.id,
			visitType: 'medication' as const,
			status: 'completed' as const,
			severity: 'medium' as const,
			checkInTime: yesterday,
			checkOutTime: yesterday,
			chiefComplaint: 'Blood sugar check and insulin administration',
			symptoms: 'Feeling dizzy, low energy',
			vitalSigns: { temperature: 36.8, pulse: 82, bloodSugar: 65 },
			diagnosis: 'Hypoglycemia',
			treatment: 'Glucose tablets, insulin adjustment',
			medicationGiven: 'Glucose tablets',
			instructions: 'Monitor blood sugar, return if symptoms persist',
			followUpRequired: false,
			isEmergency: false,
			parentNotified: true
		},
		{
			studentId: sampleStudents[0].id, // Ethan Carter
			attendedById: doctor.id,
			visitType: 'injury' as const,
			status: 'active' as const,
			severity: 'low' as const,
			checkInTime: new Date(),
			chiefComplaint: 'Scraped knee from playground fall',
			symptoms: 'Minor abrasion on right knee, slight bleeding',
			vitalSigns: { temperature: 36.5, pulse: 88 },
			diagnosis: 'Minor abrasion',
			treatment: 'Cleaned wound, applied bandage',
			medicationGiven: 'Antiseptic solution',
			instructions: 'Keep wound clean and dry',
			followUpRequired: false,
			isEmergency: false,
			parentNotified: false
		},
		{
			studentId: sampleStudents[1].id, // Olivia Bennett
			attendedById: nurse.id,
			visitType: 'illness' as const,
			status: 'completed' as const,
			severity: 'low' as const,
			checkInTime: lastWeek,
			checkOutTime: lastWeek,
			chiefComplaint: 'Headache and mild fever',
			symptoms: 'Headache, low-grade fever, fatigue',
			vitalSigns: { temperature: 37.8, pulse: 92 },
			diagnosis: 'Viral infection',
			treatment: 'Rest, hydration, acetaminophen',
			medicationGiven: 'Acetaminophen 500mg',
			instructions: 'Rest at home, return if symptoms worsen',
			followUpRequired: false,
			isEmergency: false,
			parentNotified: true
		},
		{
			studentId: sampleStudents[4].id, // Liam Foster
			attendedById: nurse.id,
			visitType: 'checkup' as const,
			status: 'completed' as const,
			severity: 'low' as const,
			checkInTime: lastWeek,
			checkOutTime: lastWeek,
			chiefComplaint: 'Routine health screening',
			symptoms: 'None',
			vitalSigns: { temperature: 36.7, pulse: 75, heightCm: 165, weightKg: 58 },
			diagnosis: 'Healthy',
			treatment: 'None required',
			medicationGiven: 'None',
			instructions: 'Continue healthy lifestyle',
			followUpRequired: false,
			isEmergency: false,
			parentNotified: false
		},
		{
			studentId: sampleStudents[6].id, // Jackson Hayes
			attendedById: doctor.id,
			visitType: 'emergency' as const,
			status: 'completed' as const,
			severity: 'critical' as const,
			checkInTime: lastWeek,
			checkOutTime: lastWeek,
			chiefComplaint: 'Seizure in classroom',
			symptoms: 'Generalized tonic-clonic seizure, confusion post-ictal',
			vitalSigns: { temperature: 37.0, pulse: 110, respiratoryRate: 22 },
			diagnosis: 'Epileptic seizure',
			treatment: 'Positioning, monitoring, medication adjustment',
			medicationGiven: 'Emergency seizure medication',
			instructions: 'Follow up with neurologist, medication review',
			followUpRequired: true,
			isEmergency: true,
			parentNotified: true
		},
		{
			studentId: sampleStudents[5].id, // Ava Mitchell
			attendedById: nurse.id,
			visitType: 'other' as const,
			status: 'completed' as const,
			severity: 'low' as const,
			checkInTime: yesterday,
			checkOutTime: yesterday,
			chiefComplaint: 'Stomach ache after lunch',
			symptoms: 'Mild abdominal pain, nausea',
			vitalSigns: { temperature: 36.9, pulse: 85 },
			diagnosis: 'Mild gastric upset',
			treatment: 'Rest, light diet',
			medicationGiven: 'Antacid',
			instructions: 'Avoid dairy products today',
			followUpRequired: false,
			isEmergency: false,
			parentNotified: false
		},
		{
			studentId: sampleStudents[8].id, // Lucas Harper
			attendedById: nurse.id,
			visitType: 'mental_health' as const,
			status: 'completed' as const,
			severity: 'medium' as const,
			checkInTime: lastWeek,
			checkOutTime: lastWeek,
			chiefComplaint: 'Anxiety about upcoming exams',
			symptoms: 'Nervousness, difficulty concentrating, mild tremor',
			vitalSigns: { temperature: 36.6, pulse: 95 },
			diagnosis: 'Exam anxiety',
			treatment: 'Counseling, relaxation techniques',
			medicationGiven: 'None',
			instructions: 'Practice stress management, follow up with counselor',
			followUpRequired: true,
			isEmergency: false,
			parentNotified: false
		}
	];

	const insertedVisits = await db.insert(clinicVisits).values(clinicVisitsData).returning();

	// 5. Sample notifications
	await db.insert(notifications).values([
		{
			visitId: insertedVisits[0].id,
			recipientType: 'parent',
			recipientName: `Parent of ${sampleStudents[2].firstName}`,
			recipientContact: '555-003-1234',
			notificationType: 'sms',
			subject: 'Clinic Visit Notification',
			message: `${sampleStudents[2].firstName} ${sampleStudents[2].lastName} visited the clinic for difficulty breathing. Asthma treatment provided. Stable condition.`,
			status: 'sent'
		}
	]);

	// 6. QR code scan logs
	const qrLogsData = sampleStudents.slice(0, 5).map((student) => ({
		qrCodeId: student.qrCodeId!,
		studentId: student.id,
		scanLocation: 'Clinic Entrance',
		wasSuccessful: true
	}));
	await db.insert(qrCodeLogs).values(qrLogsData);

	// 7. System settings
	await db.insert(systemSettings).values([
		{
			settingKey: 'clinic_open',
			settingValue: 'true',
			description: 'Is the clinic open?',
			isActive: true
		},
		{
			settingKey: 'emergency_contact_required',
			settingValue: 'true',
			description: 'Emergency contact required for all students',
			isActive: true
		}
	]);

	// 8. Audit logs
	await db.insert(auditLogs).values([
		{
			userId: admin.id,
			action: 'SEED',
			tableName: 'students',
			recordId: sampleStudents[0].id,
			newValues: { count: sampleStudents.length },
			ipAddress: '127.0.0.1',
			userAgent: 'seed-script'
		}
	]);

	console.log(`Sample data inserted successfully!`);
	console.log(`Created ${sampleStudents.length} students`);
	console.log(`Created ${emergencyContactsData.length} emergency contacts`);
	console.log(`Created ${clinicVisitsData.length} clinic visits`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
