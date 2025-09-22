import type { LayoutServerLoad } from './$types';

export const ssr = false;

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		theme: locals.theme || 'light',
		user: locals.user
			? {
					id: locals.user._id?.toString(),
					email: locals.user.email,
					firstName: locals.user.firstName,
					lastName: locals.user.lastName,
					role: locals.user.role
				}
			: null
	};
};
