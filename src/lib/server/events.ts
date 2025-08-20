import type { Unsafe } from 'sveltekit-sse';

export type Emitter = (eventName: string, data: string) => Unsafe<void, Error>;

type EmitterObj = Record<string, Emitter>;

export class ServerEvents {
	emitters: EmitterObj;
	name: string;
	constructor(name: string) {
		this.name = name;
		this.emitters = {};
	}

	setEventEmitter(id: string, emitter: Emitter) {
		this.emitters[id] = emitter;
	}

	removeEventEmitter(id: string) {
		delete this.emitters[id];
	}

	emitEvent(event: string, data: object) {
		Object.values(this.emitters).forEach((emit) => {
			emit(event, JSON.stringify(data));
		});
	}
}

export const mainEvents = new ServerEvents('main');
