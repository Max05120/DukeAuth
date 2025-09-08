import { Resend } from 'resend';
import { Env } from './env';

const resend = new Resend(Env.RESEND_API_KEY());
const from = Env.FROM_EMAIL();

export async function sendWelcomeEmail(to: string, orgName: string) {
  if (!Env.RESEND_API_KEY()) return; // no-op if not configured
  await resend.emails.send({
    from,
    to,
    subject: `Welcome to ${orgName}!`,
    text: `Welcome to ${orgName}! Your account has been created successfully.`,
  });
}

export async function sendResetPasswordEmail(to: string, resetUrl: string) {
  if (!Env.RESEND_API_KEY()) return;
  await resend.emails.send({
    from,
    to,
    subject: 'Reset your password',
    text: `Click the link to reset your password: ${resetUrl}`,
  });
}

export async function sendNewOrderEmail(to: string, orderId: string) {
  if (!Env.RESEND_API_KEY()) return;
  await resend.emails.send({
    from,
    to,
    subject: 'New order received',
    text: `You received a new order: ${orderId}`,
  });
}

