/** The one email this system sends (ADR 0002) — kept inline rather than a templating engine. */
export function buildPasswordResetEmail(resetLink: string): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'Reset your Needle Mobile System password',
    html: `<p>A password reset was requested for your Needle Mobile System account.</p>
<p><a href="${resetLink}">Click here to set a new password</a>. This link expires in 30 minutes.</p>
<p>If you did not request this, you can safely ignore this email.</p>`,
    text: `A password reset was requested for your Needle Mobile System account.

Open this link to set a new password (expires in 30 minutes):
${resetLink}

If you did not request this, you can safely ignore this email.`,
  };
}
