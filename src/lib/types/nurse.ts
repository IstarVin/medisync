export interface Nurse {
	id: string;
	name: string;
	firstName: string;
	lastName: string;
	role: 'nurse' | 'doctor' | 'admin' | 'staff';
	email: string;
	phoneNumber?: string;
	isActive: boolean;
}

export interface NurseComboboxOption {
	id: string;
	name: string;
}
