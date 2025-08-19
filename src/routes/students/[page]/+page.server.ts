import { db } from '$lib/server/db/index.js';
import { students } from '$lib/server/db/schema.js';
import { isRedirect, redirect } from '@sveltejs/kit';
import { asc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const page = parseInt(params.page || '1');
	const limit = 50; // Fixed page size
	const offset = (page - 1) * limit;

	try {
		// Simple pagination - get students for current page
		const [studentsResult, totalCountResult] = await Promise.all([
			db
				.select()
				.from(students)
				.orderBy(asc(students.lastName), asc(students.firstName))
				.limit(limit)
				.offset(offset),
			db.select({ count: count() }).from(students)
		]);

		const totalCount = totalCountResult[0]?.count || 0;

		if (studentsResult.length === 0) {
			return redirect(302, '/students/1');
		}
		const totalPages = Math.ceil(totalCount / limit);

		// Get all students for stats and filter options (needed for client-side filtering)
		const allStudents = await db.select().from(students);

		// Calculate statistics
		const stats = {
			total: allStudents.length,
			active: allStudents.filter((s) => s.isActive).length,
			withMedicalConditions: allStudents.filter((s) => s.chronicHealthConditions.length > 0).length,
			recentlyEnrolled: allStudents.filter((s) => {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				return new Date(s.enrollmentDate) > thirtyDaysAgo;
			}).length
		};

		// Get unique values for client-side filters
		const uniqueGrades = [...new Set(allStudents.map((s) => s.grade))].sort();
		const uniqueMedicalConditions = [
			...new Set(
				allStudents
					.flatMap((s) => s.chronicHealthConditions)
					.map((condition) => condition.split('(')[0].trim())
					.filter(Boolean)
			)
		].sort();

		return {
			students: studentsResult,
			allStudents, // For client-side filtering
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1
			},
			stats,
			filterOptions: {
				grades: uniqueGrades,
				medicalConditions: uniqueMedicalConditions
			}
		};
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}

		console.error('Error loading students:', error);

		// Return empty state on error
		return {
			students: [],
			allStudents: [],
			pagination: {
				page: 1,
				limit,
				total: 0,
				totalPages: 0,
				hasNext: false,
				hasPrev: false
			},
			stats: {
				total: 0,
				active: 0,
				withMedicalConditions: 0,
				recentlyEnrolled: 0
			},
			filterOptions: {
				grades: [],
				medicalConditions: []
			}
		};
	}
};
