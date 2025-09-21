import type { IStudent } from '$lib/server/db';
import { ClinicVisit, db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Ensure DB connection
	await db;

	// Base condition for non-cancelled visits
	const baseCondition = { status: { $ne: 'cancelled' } };

	// Get total visits count
	const totalVisits = await ClinicVisit.countDocuments(baseCondition);

	// Get start and end of current month
	const now = new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

	// Get start and end of today
	const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfNextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

	// Get visits this month count
	const visitsThisMonth = await ClinicVisit.countDocuments({
		...baseCondition,
		checkInTime: {
			$gte: startOfMonth,
			$lt: startOfNextMonth
		}
	});

	// Get visits today count
	const visitsThisDay = await ClinicVisit.countDocuments({
		...baseCondition,
		checkInTime: {
			$gte: startOfDay,
			$lt: startOfNextDay
		}
	});

	// Get severity counts for this month using aggregation
	const severityCountsResult = await ClinicVisit.aggregate([
		{
			$match: {
				...baseCondition,
				checkInTime: {
					$gte: startOfMonth,
					$lt: startOfNextMonth
				}
			}
		},
		{
			$group: {
				_id: '$severity',
				count: { $sum: 1 }
			}
		}
	]);

	// Format severity counts to match expected structure
	const severityCounts = severityCountsResult.map((item) => ({
		severity: item._id,
		count: item.count
	}));

	// Get recent visits with student information
	const recentVisits = await ClinicVisit.find(baseCondition)
		.populate('studentId', 'studentId firstName lastName grade section')
		.sort({ checkInTime: -1 })
		.limit(10);

	// Format recent visits to match expected structure
	const formattedRecentVisits = recentVisits.map((visit) => {
		const student = visit.studentId as IStudent;
		return {
			id: visit._id.toString(),
			visitNumber: visit.visitNumber,
			checkInTime: visit.checkInTime,
			checkOutTime: visit.checkOutTime,
			visitType: visit.visitType,
			status: visit.status,
			severity: visit.severity,
			chiefComplaint: visit.chiefComplaint,
			isEmergency: visit.isEmergency,
			student: student
				? {
						id: student._id.toString(),
						studentId: student.studentId,
						firstName: student.firstName,
						lastName: student.lastName,
						grade: student.grade,
						section: student.section ?? null
					}
				: null
		};
	});

	return {
		recentVisits: formattedRecentVisits,
		visitsThisDay,
		visitsThisMonth,
		totalVisits,
		severityCounts
	};
};
