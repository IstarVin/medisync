import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import SMTP2GO from 'smtp2go-nodejs';
import { generateSessionToken } from './auth';
const { ApiClient, MailService } = SMTP2GO;

export const MAIL_VERIFICATION_KEY = env.MAIL_VERIFICATION_KEY || generateSessionToken();

if ((!env.SMTP2GO_API_KEY || !env.SMTP2GO_SENDER_EMAIL) && !building) {
	throw 'SMTP2GO API KEY and SENDER EMAIL needed';
}

const api = new ApiClient(env.SMTP2GO_API_KEY);

export async function sendMailMessage(
	email: string,
	message: string,
	subject: string = 'Important Notification from CareLog'
) {
	const newMail = new MailService()
		.from({ email: env.SMTP2GO_SENDER_EMAIL, name: 'CareLog Health Office' })
		.to({ email })
		.subject(subject).html(`
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
		`);

	await api.consume(newMail);
	console.log('Email sent to', email);
}
