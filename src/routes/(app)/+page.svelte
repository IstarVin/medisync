<script lang="ts">
	import { goto } from '$app/navigation';
	import QrScanner from '$lib/components/qr-scanner.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import VisitSummaryCards from '$lib/components/visit-summary-cards.svelte';
	import VisitsTable from '$lib/components/visits-table.svelte';
	import { app } from '$lib/states/app.svelte.js';
	import { AlertTriangle, Circle, QrCode } from '@lucide/svelte';

	let { data } = $props();

	let showQrScanner = $state(false);

	$inspect(data.severityCounts);

	// Process severity counts for display
	const severityStats = $derived.by(() => {
		const stats = { low: 0, medium: 0, high: 0, critical: 0 };
		data.severityCounts.forEach((item: { severity: string; count: number }) => {
			if (item.severity in stats) {
				stats[item.severity as keyof typeof stats] = item.count;
			}
		});
		return stats;
	});

	const visitSummaries = [
		{
			title: "Today's Visits",
			count: data.visitsThisDay,
			actionText: 'View Records',
			actionHref: '/visits?filter=today'
		},
		{
			title: "This Month's Visits",
			count: data.visitsThisMonth,
			actionText: 'View Records',
			actionHref: '/visits?filter=month'
		},
		{
			title: 'All Visits',
			count: data.totalVisits,
			actionText: 'View Records',
			actionHref: '/visits'
		}
	];

	function scanQR() {
		showQrScanner = true;
	}

	async function handleQrScan(qrData: string) {
		showQrScanner = false;

		try {
			// Extract student ID from QR code data
			// QR code might contain just the student ID or a URL with student ID
			let studentId = qrData;

			// If it's a URL, try to extract student ID from it
			if (qrData.includes('student') || qrData.includes('id=')) {
				const urlParams = new URLSearchParams(qrData.split('?')[1] || '');
				studentId = urlParams.get('id') || urlParams.get('studentId') || qrData;
			}

			// Send QR scan data to the server
			const response = await fetch('/api/qr', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ studentId })
			});

			if (response.ok) {
				if (app.qrEnabled) {
					// Navigate to student profile
					await goto(`/students/${studentId}`);
				}
			} else {
				console.error('Failed to process QR code');
				alert('Failed to process QR code. Please try again.');
			}
		} catch (error) {
			console.error('Error processing QR scan:', error);
			alert('Error processing QR code. Please try again.');
		}
	}

	function closeQrScanner() {
		showQrScanner = false;
	}
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<!-- Modern responsive dashboard layout -->
<main class="mx-5 flex w-full flex-1 flex-col">
	<!-- Dashboard header -->
	<header class="border-b border-border bg-background px-4 py-6 md:px-6">
		<div class="flex items-center justify-between">
			<div class="flex min-w-0 flex-1 flex-col gap-2">
				<h1 class="medical-typography-heading text-2xl text-foreground md:text-3xl lg:text-4xl">
					Dashboard
				</h1>
			</div>
			<div class="flex items-center gap-3">
				<Switch id="qrEnabled" bind:checked={app.qrEnabled} />
				<Label for="qrEnabled">Enable QR</Label>
			</div>
		</div>
	</header>

	<!-- Dashboard Stats Section -->
	<section class="px-4 py-4 md:px-6">
		<div class="rounded-lg border border-border bg-card p-4">
			<h2 class="medical-typography-heading mb-3 text-sm font-medium text-foreground">
				This Month's Cases by Severity
			</h2>
			<div class="flex flex-wrap gap-4 text-sm">
				<!-- Medium Cases -->
				{#if severityStats.medium > 0}
					<div class="flex items-center gap-2">
						<Circle class="h-3 w-3 fill-yellow-500 text-yellow-500" />
						<span class="text-foreground">
							<strong>{severityStats.medium}</strong> Medium case{severityStats.medium !== 1
								? 's'
								: ''}
						</span>
					</div>
				{/if}

				<!-- High Cases -->
				{#if severityStats.high > 0}
					<div class="flex items-center gap-2">
						<AlertTriangle class="h-3 w-3 fill-orange-500 text-orange-500" />
						<span class="text-foreground">
							<strong>{severityStats.high}</strong> High case{severityStats.high !== 1 ? 's' : ''}
						</span>
					</div>
				{/if}

				<!-- Critical Cases -->
				{#if severityStats.critical > 0}
					<div class="flex items-center gap-2">
						<AlertTriangle class="h-3 w-3 fill-red-500 text-red-500" />
						<span class="text-foreground">
							<strong>{severityStats.critical}</strong> Critical case{severityStats.critical !== 1
								? 's'
								: ''}
						</span>
					</div>
				{/if}

				<!-- No urgent cases message -->
				{#if severityStats.medium === 0 && severityStats.high === 0 && severityStats.critical === 0}
					<div class="flex items-center gap-2 text-muted-foreground">
						<Circle class="h-3 w-3 fill-green-500 text-green-500" />
						<span>No medium, high, or critical cases this month</span>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Visit summaries section with responsive spacing -->
	<section class="py-6 md:py-8">
		<div class="flex items-center justify-between px-4 md:px-6">
			<h2 class="medical-typography-heading text-lg text-foreground md:text-xl lg:text-2xl">
				Visit Summaries
			</h2>
			<Button variant="outline" class="flex items-center gap-2" onclick={scanQR}>
				<QrCode />
				<span>Scan QR</span>
			</Button>
		</div>

		<VisitSummaryCards summaries={visitSummaries} />
	</section>

	<!-- Recent visits section with responsive layout -->
	<section class=" pb-6 md:pb-8">
		<div class="mb-4 flex items-center justify-between px-4 md:px-6">
			<h2 class="medical-typography-heading text-lg text-foreground md:text-xl lg:text-2xl">
				Recent Student Visits
			</h2>
			<Button variant="outline" href="/visits">View All</Button>
		</div>

		<div class="px-4 md:px-6">
			<VisitsTable
				visits={data.recentVisits}
				showVisitNumber={false}
				showSeverity={true}
				showVisitType={true}
				maxHeight="500px"
				emptyStateTitle="No recent visits"
				emptyStateDescription="When students visit the clinic, their information will appear here. The most recent visits are displayed for quick access."
			/>
		</div>
	</section>
</main>

{#if showQrScanner}
	<QrScanner bind:isOpen={showQrScanner} onScan={handleQrScan} onClose={closeQrScanner} />
{/if}
<!-- QR Scanner Modal -->
