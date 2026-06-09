import { Resend } from 'resend';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.AGENT_EMAIL);
}

export async function sendAgentReport(
  customerQuery: string,
  aiResponse: string,
  customerEmail?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.AGENT_EMAIL;
  if (!apiKey || !to) return false;

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: 'SupportPilot <onboarding@resend.dev>',
      to,
      ...(customerEmail ? { replyTo: customerEmail } : {}),
      subject: `Customer issue: ${customerQuery.slice(0, 60)}`,
      html: `
        ${customerEmail ? `<p><strong>Customer email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>` : ''}
        <p><strong>Customer query:</strong></p>
        <blockquote>${customerQuery}</blockquote>
        <p><strong>AI response:</strong></p>
        <p>${aiResponse.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Reported via SupportPilot AI</em></p>
      `,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Email] sendAgentReport failed:', err);
    return false;
  }
}
