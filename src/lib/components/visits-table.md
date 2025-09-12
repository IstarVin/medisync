# Visits Table Component

A reusable component for displaying clinic visit records with consistent styling and functionality across the CareLog application.

## Usage

```svelte
<script>
	import VisitsTable from '$lib/components/visits-table.svelte';
</script>

<VisitsTable
	visits={visitData}
	showStudentInfo={true}
	showVisitNumber={true}
	showSeverity={true}
	showVisitType={true}
	showActions={true}
	maxHeight="500px"
	emptyStateTitle="No visits found"
	emptyStateDescription="Custom empty state message"
	onViewVisit={(visitId) => console.log('View visit:', visitId)}
/>
```

## Props

| Prop                    | Type                        | Default                    | Description                                    |
| ----------------------- | --------------------------- | -------------------------- | ---------------------------------------------- |
| `visits`                | `Visit[]`                   | **Required**               | Array of visit objects                         |
| `showStudentInfo`       | `boolean`                   | `true`                     | Show patient and section columns               |
| `showVisitNumber`       | `boolean`                   | `true`                     | Show visit number column                       |
| `showSeverity`          | `boolean`                   | `true`                     | Show severity column with color-coded badges   |
| `showVisitType`         | `boolean`                   | `true`                     | Show visit type column with color-coded badges |
| `showActions`           | `boolean`                   | `true`                     | Show actions column with view button           |
| `maxHeight`             | `string`                    | `'auto'`                   | Maximum height of the table container          |
| `emptyStateTitle`       | `string`                    | `'No visits recorded'`     | Title for empty state                          |
| `emptyStateDescription` | `string`                    | `'When students visit...'` | Description for empty state                    |
| `onViewVisit`           | `(visitId: string) => void` | `undefined`                | Custom handler for view action                 |
| `class`                 | `string`                    | `''`                       | Additional CSS classes                         |

## Visit Object Type

```typescript
type Visit = {
	id: string;
	visitNumber?: number;
	checkInTime: Date | string;
	checkOutTime?: Date | string | null;
	visitType:
		| 'emergency'
		| 'illness'
		| 'injury'
		| 'medication'
		| 'checkup'
		| 'mental_health'
		| 'other';
	status: 'active' | 'completed' | 'cancelled';
	severity: 'low' | 'medium' | 'high' | 'critical';
	chiefComplaint: string;
	isEmergency?: boolean;
	parentNotified?: boolean;
	student?: {
		id: string;
		studentId: string;
		firstName: string;
		lastName: string;
		grade: string;
		section: string | null;
		profilePicture?: string | null;
	} | null;
	attendedBy?: {
		id: string;
		firstName: string;
		lastName: string;
		role: 'admin' | 'nurse' | 'doctor' | 'staff';
	} | null;
};
```

## Examples

### Dashboard (Recent Visits)

```svelte
<VisitsTable
	visits={data.recentVisits}
	showVisitNumber={false}
	showSeverity={true}
	showVisitType={true}
	maxHeight="500px"
	emptyStateTitle="No recent visits"
	emptyStateDescription="When students visit the clinic, their information will appear here."
/>
```

### Full Visits Page

```svelte
<VisitsTable
	visits={paginatedVisits}
	showSeverity={true}
	showVisitType={true}
	onViewVisit={(visitId) => (window.location.href = `/visits/${visitId}`)}
/>
```

### Student Profile (Hide Student Info)

```svelte
<VisitsTable
	visits={studentVisits}
	showStudentInfo={false}
	showVisitNumber={false}
	showSeverity={true}
	showVisitType={true}
	maxHeight="600px"
	emptyStateTitle="No clinic visits recorded"
	emptyStateDescription="This student hasn't visited the clinic yet."
	onViewVisit={handleViewVisit}
/>
```

## Features

- **Responsive Design**: Works on mobile and desktop
- **Consistent Styling**: Matches the CareLog design system
- **Flexible Configuration**: Show/hide columns as needed
- **Empty States**: Customizable empty state messages
- **Badge Indicators**: Color-coded badges for visit type, severity, and status
- **Sticky Headers**: For tables with scroll
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Styling

The component uses Tailwind CSS classes and follows the established design patterns:

- Proper color coding for visit types, severity levels, and status
- Consistent spacing and typography
- Hover effects and transitions
- Mobile-responsive layout

## Dependencies

- `@lucide/svelte` for icons
- Badge, Button, Card, and Table components from the UI library
- `$lib/utils` for the `toTitleCase` function
