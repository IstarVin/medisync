import { client } from '$lib/client/event/main';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	client.connect();
};
