import {
	ClinicVisit,
	connectMongoDB,
	EmergencyContact,
	Student,
	User,
	type IClinicVisit,
	type IEmergencyContact,
	type IStudent,
	type IUser
} from '$lib/server/db/index.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Ensure MongoDB connection
		await connectMongoDB();

		const visitId = params.id;

		// Fetch the specific visit with related student and staff information
		const visit = await ClinicVisit.findById(visitId)
			.populate({
				path: 'studentId',
				model: Student,
				select:
					'_id studentId firstName lastName grade section profileUrl dateOfBirth chronicHealthConditions currentMedications healthHistory'
			})
			.populate({
				path: 'attendedById',
				model: User,
				select: '_id firstName lastName role'
			})
			.lean();

		if (!visit) {
			throw error(404, 'Visit not found');
		}

		// Fetch emergency contacts for the student
		const emergencyContacts = await EmergencyContact.find({
			studentId: (visit as unknown as IClinicVisit & { studentId: IStudent }).studentId?._id
		})
			.sort({ priority: 1, createdAt: 1 })
			.lean();

		// Format the visit data for frontend
		const formattedVisit = {
			id: (visit as unknown as IClinicVisit)._id?.toString() || '',
			visitNumber: (visit as unknown as IClinicVisit).visitNumber || 0,
			checkInTime: (visit as unknown as IClinicVisit).checkInTime.toISOString(),
			checkOutTime: (visit as unknown as IClinicVisit).checkOutTime?.toISOString() || null,
			visitType: (visit as unknown as IClinicVisit).visitType,
			status: (visit as unknown as IClinicVisit).status,
			severity: (visit as unknown as IClinicVisit).severity,
			chiefComplaint: (visit as unknown as IClinicVisit).chiefComplaint || '',
			symptoms: (visit as unknown as IClinicVisit).symptoms || null,
			vitalSigns: (visit as unknown as IClinicVisit).vitalSigns || null,
			diagnosis: (visit as unknown as IClinicVisit).diagnosis || null,
			treatment: (visit as unknown as IClinicVisit).treatment || null,
			medicationGiven: (visit as unknown as IClinicVisit).medicationGiven || null,
			instructions: (visit as unknown as IClinicVisit).instructions || null,
			followUpRequired: (visit as unknown as IClinicVisit).followUpRequired || false,
			followUpDate: (visit as unknown as IClinicVisit).followUpDate?.toISOString() || null,
			notes: (visit as unknown as IClinicVisit).notes || null,
			isEmergency: (visit as unknown as IClinicVisit).isEmergency || false,
			parentNotified: (visit as unknown as IClinicVisit).parentNotified || false,
			createdAt: (visit as unknown as IClinicVisit).createdAt.toISOString(),
			updatedAt: (visit as unknown as IClinicVisit).updatedAt.toISOString(),
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
							null,
						dateOfBirth: (
							visit as unknown as IClinicVisit & { studentId: IStudent }
						).studentId.dateOfBirth.toISOString(),
						chronicHealthConditions:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId
								.chronicHealthConditions || [],
						currentMedications:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId
								.currentMedications || [],
						healthHistory:
							(visit as unknown as IClinicVisit & { studentId: IStudent }).studentId
								.healthHistory || null,
						emergencyContacts: emergencyContacts.map((contact) => ({
							id: (contact as unknown as IEmergencyContact)._id?.toString() || '',
							studentId: (contact as unknown as IEmergencyContact).studentId?.toString() || '',
							name: (contact as unknown as IEmergencyContact).name || '',
							relationship: (contact as unknown as IEmergencyContact).relationship || 'other',
							phoneNumber: (contact as unknown as IEmergencyContact).phoneNumber || '',
							alternatePhone: (contact as unknown as IEmergencyContact).alternatePhone || null,
							email: (contact as unknown as IEmergencyContact).email || null,
							address: (contact as unknown as IEmergencyContact).address || null,
							isPrimary: (contact as unknown as IEmergencyContact).isPrimary || false,
							priority: (contact as unknown as IEmergencyContact).priority || 0,
							createdAt: (contact as unknown as IEmergencyContact).createdAt.toISOString(),
							updatedAt: (contact as unknown as IEmergencyContact).updatedAt.toISOString()
						}))
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
		};

		return {
			visit: formattedVisit
		};
	} catch (err) {
		console.error('Error loading visit:', err);
		throw error(500, 'Failed to load visit details');
	}
};
