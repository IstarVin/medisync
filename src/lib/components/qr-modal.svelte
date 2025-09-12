<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Download, QrCode, X } from '@lucide/svelte';
	import QRCode from 'qrcode';

	interface QrModalProps {
		isOpen: boolean;
		onClose: () => void;
		studentId: string;
		studentName: string;
	}

	let { isOpen = $bindable(), onClose, studentId, studentName }: QrModalProps = $props();

	let qrCodeDataUrl = $state<string>('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Generate QR code when modal opens
	$effect(() => {
		if (isOpen && studentId) {
			generateQRCode();
		}
	});

	async function generateQRCode() {
		try {
			isLoading = true;
			error = null;

			// QR code data is just the student ID
			const qrData = studentId;

			// Generate QR code as data URL
			const dataUrl = await QRCode.toDataURL(qrData, {
				errorCorrectionLevel: 'M',
				type: 'image/png',
				margin: 1,
				color: {
					dark: '#000000',
					light: '#FFFFFF'
				},
				width: 256
			});

			qrCodeDataUrl = dataUrl;
		} catch (err) {
			console.error('Error generating QR code:', err);
			error = 'Failed to generate QR code';
		} finally {
			isLoading = false;
		}
	}

	async function downloadQRCode() {
		if (!qrCodeDataUrl) return;

		try {
			// QR code data is just the student ID
			const qrData = studentId;

			// Create temporary canvas for QR code generation
			const tempCanvas = document.createElement('canvas');
			await QRCode.toCanvas(tempCanvas, qrData, {
				errorCorrectionLevel: 'M',
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF'
				},
				width: 300
			});

			// Create main canvas for final image with text
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) return;

			// Set canvas size (larger for download with space for text)
			canvas.width = 350;
			canvas.height = 420;

			// Fill white background
			ctx.fillStyle = '#FFFFFF';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Draw QR code centered at the top
			const qrSize = 300;
			const qrX = (canvas.width - qrSize) / 2;
			const qrY = 20; // 20px from top
			ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize);

			// Add student information text below QR code
			const textStartY = 2 * qrY + qrSize; // 30px below QR code

			ctx.fillStyle = '#000000';
			ctx.font = 'bold 16px Arial';
			ctx.textAlign = 'center';

			// Student name
			ctx.fillText(studentName, canvas.width / 2, textStartY);

			// Student ID
			ctx.font = '14px Arial';
			ctx.fillText(`Student ID: ${studentId}`, canvas.width / 2, textStartY + 25);

			// CareLog label
			ctx.font = '12px Arial';
			ctx.fillStyle = '#666666';
			ctx.fillText('CareLog - School Clinic Management', canvas.width / 2, textStartY + 45);

			// Convert to blob and download
			canvas.toBlob((blob) => {
				if (!blob) return;

				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.download = `${studentName.replace(/\s+/g, '_')}_QR_Code.png`;
				link.href = url;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
			}, 'image/png');
		} catch (err) {
			console.error('Error downloading QR code:', err);
		}
	}

	function handleClose() {
		isOpen = false;
		onClose();
	}
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={handleClose}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<QrCode class="size-5" />
				Student QR Code
			</Dialog.Title>
			<Dialog.Description>
				QR code for {studentName} (ID: {studentId})
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col items-center gap-4">
			{#if isLoading}
				<div
					class="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300"
				>
					<div class="text-center">
						<QrCode class="mx-auto size-8 text-gray-400" />
						<p class="mt-2 text-sm text-gray-500">Generating QR code...</p>
					</div>
				</div>
			{:else if error}
				<div
					class="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-red-300 bg-red-50"
				>
					<div class="text-center">
						<X class="mx-auto size-8 text-red-400" />
						<p class="mt-2 text-sm text-red-600">{error}</p>
						<Button variant="outline" size="sm" class="mt-2" onclick={() => generateQRCode()}>
							Try Again
						</Button>
					</div>
				</div>
			{:else if qrCodeDataUrl}
				<div class="flex flex-col items-center gap-4">
					<!-- QR Code Display -->
					<div class="rounded-lg border-2 border-gray-200 p-4">
						<img src={qrCodeDataUrl} alt="QR Code for {studentName}" class="size-64" />
					</div>

					<!-- Student Info -->
					<div class="text-center">
						<p class="font-medium text-gray-900">{studentName}</p>
						<p class="text-sm text-gray-500">Student ID: {studentId}</p>
					</div>

					<!-- Download Button -->
					<Button onclick={downloadQRCode} class="w-full">
						<Download class="mr-2 size-4" />
						Download QR Code
					</Button>

					<!-- Instructions -->
					<div class="rounded-lg bg-blue-50 p-3 text-center">
						<p class="text-xs text-blue-700">
							Scan this QR code to quickly access this student's profile in emergency situations.
							Print and attach to student ID card for fastest clinic access.
						</p>
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer class="flex justify-end gap-2">
			<Button variant="outline" onclick={handleClose}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
