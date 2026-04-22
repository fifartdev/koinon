import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@koinon.app'

export async function sendInviteEmail({
  to,
  clubName,
  inviteUrl,
  inviterName,
}: {
  to: string
  clubName: string
  inviteUrl: string
  inviterName: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're invited to join ${clubName}`,
    html: `
      <h2>Welcome to ${clubName}!</h2>
      <p>${inviterName} has invited you to join <strong>${clubName}</strong> on Koinon.</p>
      <p>Click the button below to accept your invitation and set your password:</p>
      <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
        Accept Invitation
      </a>
      <p style="color:#6b7280;font-size:14px;margin-top:24px;">
        This link expires in 48 hours. If you didn't expect this email, you can safely ignore it.
      </p>
    `,
  })
}

export async function sendPaymentReminderEmail({
  to,
  memberName,
  serviceName,
  clubName,
  dashboardUrl,
}: {
  to: string
  memberName: string
  serviceName: string
  clubName: string
  dashboardUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Payment reminder — ${serviceName} at ${clubName}`,
    html: `
      <h2>Payment Reminder</h2>
      <p>Hi ${memberName},</p>
      <p>Your payment for <strong>${serviceName}</strong> at <strong>${clubName}</strong> is marked as <span style="color:#dc2626;font-weight:600;">Unpaid</span>.</p>
      <p>Please contact your club admin to arrange payment.</p>
      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
        View Member Area
      </a>
    `,
  })
}

export async function sendAnnouncementEmail({
  to,
  memberName,
  announcementTitle,
  clubName,
  memberAreaUrl,
}: {
  to: string
  memberName: string
  announcementTitle: string
  clubName: string
  memberAreaUrl: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `New announcement from ${clubName}`,
    html: `
      <h2>${announcementTitle}</h2>
      <p>Hi ${memberName},</p>
      <p><strong>${clubName}</strong> has posted a new announcement.</p>
      <a href="${memberAreaUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
        Read Announcement
      </a>
    `,
  })
}
