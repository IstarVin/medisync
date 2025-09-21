import {
	ClinicVisit,
	connectMongoDB,
	Student,
	User,
	type IClinicVisit,
	type IStudent,
	type IUser
} from '$lib/server/db/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Ensure MongoDB connection
		await connectMongoDB();

		// Fetch all visits with related student and staff information
		const allVisits = await ClinicVisit.find()
			.populate({
				path: 'studentId',
				model: Student,
				select: '_id studentId firstName lastName grade section profileUrl'
			})
			.populate({
				path: 'attendedById',
				model: User,
				select: '_id firstName lastName role'
			})
			.sort({ checkInTime: -1 })
			.lean();

		// Format visits for frontend
		const formattedVisits = allVisits.map((visit) => ({
			id: (visit as unknown as IClinicVisit)._id?.toString() || '',
			visitNumber: (visit as unknown as IClinicVisit).visitNumber || 0,
			checkInTime: (visit as unknown as IClinicVisit).checkInTime.toISOString(),
			checkOutTime: (visit as unknown as IClinicVisit).checkOutTime?.toISOString() || null,
			visitType: (visit as unknown as IClinicVisit).visitType,
			status: (visit as unknown as IClinicVisit).status,
			severity: (visit as unknown as IClinicVisit).severity,
			chiefComplaint: (visit as unknown as IClinicVisit).chiefComplaint || '',
			isEmergency: (visit as unknown as IClinicVisit).isEmergency || false,
			student: (visit as unknown as IClinicVisit & { studentId: IStudent }).studentId
				? {
						id:
							(
								visit as unknown as IClinicVisit & { studentId: IStudent }
							).studentId._id?.toString() || '',
						studentId:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId.studentId ||
							'',
						firstName:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId.firstName ||
							'',
						lastName:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId.lastName || '',
						grade:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId.grade || '',
						section:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId.section ||
							null,
						profileUrl:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId.profileUrl ||
							null
					}
				: null,
			attendedBy: (visit as unknown as IClinicVisit & { attendedById: IUser }).attendedById
				? {
						id:
							(
								visit as unknown as IClinicVisit & { attendedById: IUser }
							).attendedById._id?.toString() || '',
						firstName:
							(visit as unknown as IClinicVisit & { attendedById: IUser }).attendedById.firstName ||
							'',
						lastName:
							(visit as unknown as IClinicVisit & { attendedById: IUser }).attendedById.lastName ||
							'',
						role:
							(visit as unknown as IClinicVisit & { attendedById: IUser }).attendedById.role ||
							'nurse'
					}
				: null
		}));

		// Calculate statistics
		const stats = {
			total: formattedVisits.length,
			active: formattedVisits.filter((v) => v.status === 'active').length,
			completed: formattedVisits.filter((v) => v.status === 'completed').length,
			emergency: formattedVisits.filter((v) => v.isEmergency).length,
			todayVisits: formattedVisits.filter((v) => {
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
		const uniqueVisitTypes = [...new Set(formattedVisits.map((v) => v.visitType))].sort();
		const uniqueStatuses = [...new Set(formattedVisits.map((v) => v.status))].sort();
		const uniqueSeverities = [...new Set(formattedVisits.map((v) => v.severity))].sort();
		const uniqueGrades = [
			...new Set(
				formattedVisits
					.map((v) => v.student?.grade)
					.filter((grade): grade is string => Boolean(grade))
			)
		].sort();

		return {
			visits: formattedVisits,
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
