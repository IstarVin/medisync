import { connectMongoDB } from './index';
import { ClinicVisit, type IClinicVisit } from './schema';

export type NewClinicVisit = Omit<IClinicVisit, '_id' | 'visitNumber' | 'createdAt' | 'updatedAt'>;
export type ClinicVisitDocument = IClinicVisit;

/**
 * Create a new clinic visit with auto-incrementing visit number
 * @param visitData - The clinic visit data (without visitNumber, visitNumber will auto-increment)
 * @returns The created clinic visit
 */
export async function createClinicVisit(visitData: NewClinicVisit): Promise<IClinicVisit> {
	await connectMongoDB();

	const newVisit = new ClinicVisit(visitData);
	const result = await newVisit.save();
	return result;
}
