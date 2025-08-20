import { db } from '$lib/server/db';
import { clinicVisits, students } from '$lib/server/db/schema';
import { and, count, desc, ne, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Base query for non-cancelled visits
	const baseCondition = ne(clinicVisits.status, 'cancelled');

	// Get total visits count
	const [{ count: totalVisits }] = await db
		.select({ count: count() })
		.from(clinicVisits)
		.where(baseCondition);

	// Get visits this month count
	const [{ count: visitsThisMonth }] = await db
		.select({ count: count() })
		.from(clinicVisits)
		.where(
			and(
				baseCondition,
				sql`date_trunc('month', ${clinicVisits.checkOutTime}) = date_trunc('month', current_date)`
			)
		);

	// Get visits today count
	const [{ count: visitsThisDay }] = await db
		.select({ count: count() })
		.from(clinicVisits)
		.where(
			and(
				baseCondition,
				sql`date_trunc('day', ${clinicVisits.checkOutTime}) = date_trunc('day', current_date)`
			)
		);

	// Get recent visits with student information
	const recentVisits = await db
		.select({
			id: clinicVisits.id,
			patientName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
			section: sql<string>`${students.grade} || CASE WHEN ${students.section} IS NOT NULL THEN ' - ' || ${students.section} ELSE '' END`,
			reasonForVisit: clinicVisits.chiefComplaint,
			checkInTime: clinicVisits.checkInTime
		})
		.from(clinicVisits)
		.innerJoin(students, sql`${clinicVisits.studentId} = ${students.id}`)
		.where(baseCondition)
		.orderBy(desc(clinicVisits.checkInTime))
		.limit(10);

	// Format recent visits for the frontend
	const formattedRecentVisits = recentVisits.map((visit) => ({
		id: visit.id,
		patientName: visit.patientName,
		section: visit.section,
		reasonForVisit: visit.reasonForVisit,
		time: visit.checkInTime.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}),
		date: visit.checkInTime.toLocaleDateString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		})
	}));

	return {
		recentVisits: formattedRecentVisits,
		visitsThisDay,
		visitsThisMonth,
		totalVisits
	};
};
