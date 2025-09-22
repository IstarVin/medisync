import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import SMTP2GO from 'smtp2go-nodejs';
import { generateSessionToken } from './auth';

export const MAIL_VERIFICATION_KEY = env.MAIL_VERIFICATION_KEY || generateSessionToken();

if ((!env.SMTP2GO_API_KEY || !env.SMTP2GO_SENDER_EMAIL) && !building) {
	throw 'SMTP2GO API KEY and SENDER EMAIL needed';
}

const api = new SMTP2GO.ApiClient(env.SMTP2GO_API_KEY);

export async function sendMailMessage(
	email: string,
	message: string,
	subject: string = 'Important Notification from CareLog'
) {
	const newMail = new SMTP2GO.MailService()
		.from({ email: env.SMTP2GO_SENDER_EMAIL, name: 'CareLog Health Office' })
		.to({ email })
		.subject(subject)
		.html(
			`
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #dee2e6;">
					<h2 style="color: #2c3e50; margin: 0;">CareLog Health Office</h2>
				</div>
				<div style="padding: 30px 20px;">
					<div style="white-space: pre-wrap; line-height: 1.6; color: #333;">${message}</div>
				</div>
				<div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
					<p style="margin: 0;">This message was sent from CareLog School Health Management System.</p>
					<p style="margin: 5px 0 0 0;">Please contact the school if you have any questions or concerns.</p>
				</div>
			</div>
		`
		);

	await api.consume(newMail);
	console.log('Email sent to', email);
}

export async function sendStaffCredentials(
	email: string,
	firstName: string,
	lastName: string,
	role: string,
	temporaryPassword: string
) {
	const subject = 'Welcome to CareLog - Your Account Credentials';

	const newMail = new SMTP2GO.MailService()
		.from({ email: env.SMTP2GO_SENDER_EMAIL, name: 'CareLog Health Office' })
		.to({ email })
		.subject(subject)
		.html(
			`
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				<div style="background-color: #2563eb; padding: 20px; text-align: center;">
					<h2 style="color: #ffffff; margin: 0;">Welcome to CareLog</h2>
					<p style="color: #e5e7eb; margin: 5px 0 0 0;">School Health Management System</p>
				</div>
				<div style="padding: 30px 20px;">
					<p style="color: #333; margin-bottom: 20px;">Dear <strong>${firstName} ${lastName}</strong>,</p>
					
					<p style="color: #333; line-height: 1.6;">Welcome to the CareLog School Health Management System! Your account has been created with the following details:</p>
					
					<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #1f2937; margin-top: 0;">Account Information:</h3>
						<ul style="color: #374151; line-height: 1.8;">
							<li><strong>Email:</strong> ${email}</li>
							<li><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</li>
							<li><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${temporaryPassword}</code></li>
						</ul>
					</div>
					
					<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
						<h4 style="color: #92400e; margin-top: 0; display: flex; align-items: center;">
							⚠️ IMPORTANT SECURITY NOTICE
						</h4>
						<p style="color: #92400e; margin-bottom: 10px;">This is a temporary password that must be changed upon your first login. Please:</p>
						<ol style="color: #92400e; line-height: 1.6;">
							<li>Log in to CareLog using the credentials above</li>
							<li>Change your password immediately to something secure and memorable</li>
							<li>Do not share these credentials with anyone</li>
						</ol>
					</div>
					
					<p style="color: #333; line-height: 1.6;">You can access the system at your school's CareLog portal. If you need assistance or have any questions, please contact your system administrator.</p>
					
					<p style="color: #333; margin-top: 30px;">Best regards,<br><strong>CareLog Administration</strong></p>
				</div>
				<div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
					<p style="margin: 0;">This message was sent from CareLog School Health Management System.</p>
					<p style="margin: 5px 0 0 0;">Please contact the school if you have any questions or concerns.</p>
				</div>
			</div>
		`
		);

	await api.consume(newMail);
	console.log('Staff credentials email sent to', email);
}

// export async function sendEmailReferral(
// 	email: string,
// 	subject: string,
// 	message: string,
// 	attachments: AttachmentCollection
// ) {
// 	const newEmail = new MailService()
// 		.from({
// 			email: env.SMTP2GO_SENDER_EMAIL,
// 			name: 'CareLog Health Office'
// 		})
// 		.to({ email }).attach({filename: ""});
// }
