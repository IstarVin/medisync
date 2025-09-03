import { db } from './index';
import { clinicVisits } from './schema';

export type NewClinicVisit = typeof clinicVisits.$inferInsert;
export type ClinicVisit = typeof clinicVisits.$inferSelect;

/**
 * Create a new clinic visit with auto-incrementing visit number
 * @param visitData - The clinic visit data (without visitNumber, visitNumber will auto-increment)
 * @returns The created clinic visit
 */
export async function createClinicVisit(
	visitData: Omit<NewClinicVisit, 'visitNumber'>
): Promise<ClinicVisit> {
	// The visitNumber will auto-increment as it's the primary key with autoIncrement: true
	const newVisit = {
		id: crypto.randomUUID(),
		...visitData
	};

	const result = await db.insert(clinicVisits).values(newVisit).returning();
	return result[0];
}
