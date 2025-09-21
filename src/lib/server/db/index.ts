import { env } from '$env/dynamic/private';
import mongoose from 'mongoose';

// MongoDB connection function
export async function connectMongoDB() {
	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	try {
		await mongoose.connect(env.MONGODB_URI);
		console.log('✅ Connected to MongoDB');

		return mongoose.connection;
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
		throw error;
	}
}

// Initialize connection
export const db = connectMongoDB();

// Export all models for convenience
export * from './schema';
