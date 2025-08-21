<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Camera, CameraOff, X } from '@lucide/svelte';
	import QrScanner from 'qr-scanner';
	import { onDestroy, onMount } from 'svelte';

	interface QrScannerProps {
		onScan: (result: string) => void;
		onClose: () => void;
		isOpen: boolean;
	}

	let { onScan, onClose, isOpen = $bindable() }: QrScannerProps = $props();

	let videoElement = $state<HTMLVideoElement>();
	let qrScanner: QrScanner | null = null;
	let hasCamera = $state(false);
	let isScanning = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (!isOpen || !videoElement) return;

		try {
			// Check if camera is available
			hasCamera = await QrScanner.hasCamera();

			if (!hasCamera) {
				error = 'No camera found on this device';
				return;
			}

			// Initialize QR scanner
			qrScanner = new QrScanner(
				videoElement,
				(result) => {
					// Found QR code
					onScan(result.data);
					stopScanning();
				},
				{
					returnDetailedScanResult: true,
					highlightScanRegion: true,
					highlightCodeOutline: true
					// maxScansPerSecond: 1
				}
			);

			await startScanning();
		} catch (err) {
			console.error('QR Scanner initialization error:', err);
			error = err instanceof Error ? err.message : 'Failed to initialize camera';
		}
	});

	onDestroy(() => {
		stopScanning();
	});

	async function startScanning() {
		if (!qrScanner || !hasCamera) return;

		try {
			error = null;
			await qrScanner.start();
			isScanning = true;
		} catch (err) {
			console.error('Failed to start scanning:', err);
			error = err instanceof Error ? err.message : 'Failed to start camera';
		}
	}

	function stopScanning() {
		if (qrScanner) {
			qrScanner.stop();
			qrScanner.destroy();
			qrScanner = null;
		}
		isScanning = false;
	}

	function handleClose() {
		stopScanning();
		onClose();
	}
</script>

<!-- QR Scanner Modal Overlay -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
	<div class="relative w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
		<!-- Header -->
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<h2 class="text-lg font-semibold">Scan QR Code</h2>
			</div>
			<Button variant="ghost" size="sm" onclick={handleClose}>
				<X class="h-4 w-4" />
			</Button>
		</div>

		<!-- Camera Container -->
		<div class="relative mb-4 aspect-square w-full overflow-hidden rounded-lg border">
			{#if error}
				<div class="flex h-full items-center justify-center bg-muted text-center">
					<div>
						<CameraOff class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
						<p class="text-sm text-muted-foreground">{error}</p>
					</div>
				</div>
			{:else if !hasCamera}
				<div class="flex h-full items-center justify-center bg-muted text-center">
					<div>
						<CameraOff class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
						<p class="text-sm text-muted-foreground">Checking camera availability...</p>
					</div>
				</div>
			{/if}

			<!-- Video element for camera feed -->
			<video
				bind:this={videoElement}
				class="h-full w-full object-cover {error || !hasCamera ? 'hidden' : ''}"
				playsinline
				muted
			></video>

			<!-- Scanning indicator overlay -->
			{#if isScanning}
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="h-48 w-48 border-2 border-primary/50 bg-transparent">
						<div class="absolute inset-2 border border-primary/80"></div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Status and Instructions -->
		<div class="text-center">
			{#if isScanning}
				<div class="mb-2 flex items-center justify-center gap-2">
					<Camera class="h-4 w-4 text-green-500" />
					<span class="text-sm font-medium text-green-500">Camera Active</span>
				</div>
				<p class="text-xs text-muted-foreground">Position the QR code within the frame above</p>
			{:else if hasCamera && !error}
				<p class="text-sm text-muted-foreground">Starting camera...</p>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="mt-6 flex gap-2">
			<Button variant="outline" class="flex-1" onclick={handleClose}>Cancel</Button>
			{#if error && hasCamera}
				<Button class="flex-1" onclick={startScanning}>Try Again</Button>
			{/if}
		</div>
	</div>
</div>
