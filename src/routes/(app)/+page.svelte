<script lang="ts">
	import { goto } from '$app/navigation';
	import QrScanner from '$lib/components/qr-scanner.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Switch from '$lib/components/ui/switch/switch.svelte';
	import VisitSummaryCards from '$lib/components/visit-summary-cards.svelte';
	import VisitsTable from '$lib/components/visits-table.svelte';
	import { app } from '$lib/states/app.svelte.js';
	import { QrCode } from '@lucide/svelte';

	let { data } = $props();

	let showQrScanner = $state(false);

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

<!-- Modern responsive dashboard layout -->
<main class="mx-5 flex w-full flex-1 flex-col">
	<!-- Dashboard header -->
	<header class="border-b border-border bg-background px-4 py-6 md:px-6">
		<div class="flex items-center justify-between">
			<div class="flex min-w-0 flex-1 flex-col gap-2">
				<h1 class="medical-typography-heading text-2xl text-foreground md:text-3xl lg:text-4xl">
					Dashboard
				</h1>
				<!-- <p
					class="medical-typography-body text-sm text-muted-foreground md:text-base lg:text-lg"
				></p> -->
			</div>
			<div class="flex items-center gap-3">
				<Switch id="qrEnabled" bind:checked={app.qrEnabled} />
				<Label for="qrEnabled">Enable QR</Label>
			</div>
		</div>
	</header>

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
