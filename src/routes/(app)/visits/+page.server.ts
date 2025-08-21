import { db } from '$lib/server/db/index.js';
import { clinicVisits } from '$lib/server/db/schema.js';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all visits with related student and staff information
		const allVisits = await db.query.clinicVisits.findMany({
			with: {
				student: {
					columns: {
						id: true,
						studentId: true,
						firstName: true,
						lastName: true,
						grade: true,
						section: true,
						profilePicture: true
					}
				},
				attendedBy: {
					columns: {
						id: true,
						firstName: true,
						lastName: true,
						role: true
					}
				}
			},
			orderBy: [desc(clinicVisits.checkInTime)]
		});

		// Calculate statistics
		const stats = {
			total: allVisits.length,
			active: allVisits.filter((v) => v.status === 'active').length,
			completed: allVisits.filter((v) => v.status === 'completed').length,
			emergency: allVisits.filter((v) => v.isEmergency).length,
			todayVisits: allVisits.filter((v) => {
				const today = new Date();
				const visitDate = new Date(v.checkInTime);
				return (
					visitDate.getDate() === today.getDate() &&
					visitDate.getMonth() === today.getMonth() &&
					visitDate.getFullYear() === today.getFullYear()
				);
			}).length
		};

		// Get unique values for client-side filters
		const uniqueVisitTypes = [...new Set(allVisits.map((v) => v.visitType))].sort();
		const uniqueStatuses = [...new Set(allVisits.map((v) => v.status))].sort();
		const uniqueSeverities = [...new Set(allVisits.map((v) => v.severity))].sort();
		const uniqueGrades = [...new Set(allVisits.map((v) => v.student?.grade).filter(Boolean))].sort();

		return {
			visits: allVisits,
			stats,
			filterOptions: {
				visitTypes: uniqueVisitTypes,
				statuses: uniqueStatuses,
				severities: uniqueSeverities,
				grades: uniqueGrades
			}
		};
	} catch (error) {
		console.error('Error loading visits:', error);

		// Return empty state on error
		return {
			visits: [],
			stats: {
				total: 0,
				active: 0,
				completed: 0,
				emergency: 0,
				todayVisits: 0
			},
			filterOptions: {
				visitTypes: [],
				statuses: [],
				severities: [],
				grades: []
			}
		};
	}
};