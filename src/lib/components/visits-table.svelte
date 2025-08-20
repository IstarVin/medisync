<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Eye, Stethoscope } from '@lucide/svelte';

	// Types based on the database schema
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

	interface Props {
		visits: Visit[];
		showStudentInfo?: boolean;
		showVisitNumber?: boolean;
		showActions?: boolean;
		maxHeight?: string;
		emptyStateTitle?: string;
		emptyStateDescription?: string;
		onViewVisit?: (visitId: string) => void;
		class?: string;
	}

	let {
		visits,
		showStudentInfo = true,
		showVisitNumber = true,
		showActions = true,
		maxHeight = 'auto',
		emptyStateTitle = 'No visits recorded',
		emptyStateDescription = 'When students visit the clinic, their information will appear here.',
		onViewVisit,
		class: className = ''
	}: Props = $props();

	// Helper functions
	function formatDateTime(date: Date | string): string {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(dateObj);
	}

	function formatDate(date: Date | string): string {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(dateObj);
	}

	function formatTime(date: Date | string): string {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(dateObj);
	}

	function getStatusBadgeVariant(status: Visit['status']) {
		switch (status) {
			case 'active':
				return 'default';
			case 'completed':
				return 'secondary';
			case 'cancelled':
				return 'destructive';
			default:
				return 'outline';
		}
	}

	function getSeverityBadgeVariant(severity: Visit['severity']) {
		switch (severity) {
			case 'critical':
				return 'destructive';
			case 'high':
				return 'destructive';
			case 'medium':
				return 'default';
			case 'low':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function getVisitTypeBadgeVariant(visitType: Visit['visitType']) {
		switch (visitType) {
			case 'emergency':
				return 'destructive';
			case 'illness':
			case 'injury':
				return 'default';
			case 'checkup':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	function handleViewVisit(visitId: string) {
		if (onViewVisit) {
			onViewVisit(visitId);
		} else {
			// Default behavior - navigate to visit details
			window.location.href = `/visits/${visitId}`;
		}
	}
</script>

<div class="visits-table-container {className}" style="max-height: {maxHeight};">
	{#if visits.length === 0}
		<!-- Empty state -->
		<Card.Root class="border-2 border-dashed border-muted-foreground/30">
			<Card.Content class="flex flex-col items-center justify-center px-6 py-12 text-center">
				<div class="mb-4 rounded-full bg-muted/50 p-6">
					<Stethoscope class="size-12 text-muted-foreground/70" />
				</div>
				<h3 class="mb-2 text-lg font-semibold text-foreground">
					{emptyStateTitle}
				</h3>
				<p class="max-w-md text-sm text-muted-foreground">
					{emptyStateDescription}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Visits table -->
		<div class="overflow-hidden rounded-lg border border-border bg-background">
			<div class="overflow-x-auto" style="max-height: {maxHeight === 'auto' ? 'none' : maxHeight};">
				<Table.Root>
					<Table.Header
						class="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
					>
						<Table.Row class="border-b">
							{#if showVisitNumber}
								<Table.Head class="w-[80px] font-medium">Visit #</Table.Head>
							{/if}
							{#if showStudentInfo}
								<Table.Head class="min-w-[200px] font-medium">Patient</Table.Head>
								<Table.Head class="min-w-[120px] font-medium">Section</Table.Head>
							{/if}
							<Table.Head class="min-w-[250px] font-medium">Reason</Table.Head>
							<Table.Head class="min-w-[100px] font-medium">Time</Table.Head>
							<Table.Head class="min-w-[100px] font-medium">Date</Table.Head>
							{#if showActions}
								<Table.Head class="w-[80px] font-medium">Actions</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each visits as visit}
							<Table.Row class="transition-colors hover:bg-muted/50">
								{#if showVisitNumber}
									<Table.Cell class="font-medium text-foreground">
										#{visit.visitNumber || visit.id.slice(-4)}
									</Table.Cell>
								{/if}
								{#if showStudentInfo && visit.student}
									<Table.Cell>
										<div class="flex flex-col gap-1">
											<span class="font-medium text-foreground">
												{visit.student.firstName}
												{visit.student.lastName}
											</span>
											<span class="text-xs text-muted-foreground">
												ID: {visit.student.studentId}
											</span>
										</div>
									</Table.Cell>
									<Table.Cell>
										<div class="flex flex-col gap-1">
											<span class="text-sm font-medium text-foreground">
												{visit.student.grade}
											</span>
											{#if visit.student.section}
												<span class="text-xs text-muted-foreground">
													{visit.student.section}
												</span>
											{/if}
										</div>
									</Table.Cell>
								{:else if showStudentInfo}
									<Table.Cell class="text-muted-foreground">Unknown</Table.Cell>
									<Table.Cell class="text-muted-foreground">—</Table.Cell>
								{/if}
								<Table.Cell>
									<div class="flex flex-col gap-2">
										<span class="text-sm leading-tight font-medium text-foreground">
											{visit.chiefComplaint}
										</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1 text-sm text-foreground">
										<!-- <Clock class="size-3 text-muted-foreground" /> -->
										<span>{formatTime(visit.checkInTime)}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<span class="text-sm text-foreground">
										{formatDate(visit.checkInTime)}
									</span>
								</Table.Cell>
								{#if showActions}
									<Table.Cell>
										<Button
											variant="ghost"
											size="sm"
											onclick={() => handleViewVisit(visit.id)}
											class="h-8 w-8 p-0"
										>
											<Eye class="size-4" />
											<span class="sr-only">View visit details</span>
										</Button>
									</Table.Cell>
								{/if}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</div>
	{/if}
</div>

<style>
	.visits-table-container {
		width: 100%;
	}

	/* Ensure table maintains good spacing on mobile */
	@media (max-width: 768px) {
		:global(.visits-table-container table) {
			min-width: 700px;
		}
	}
</style>
