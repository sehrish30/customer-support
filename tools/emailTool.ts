import { Resend } from 'resend';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.AGENT_EMAIL);
}

export async function sendAgentReport(
  customerQuery: string,
  aiResponse: string,
  customerEmail?: string,
  imageBase64?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.AGENT_EMAIL;
  if (!apiKey || !to) return false;

  const resend = new Resend(apiKey);

  // Strip the data URL prefix (e.g. "data:image/png;base64,") to get raw base64
  let attachment: { filename: string; content: string } | undefined;
  if (imageBase64) {
    const match = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/s);
    if (match) {
      attachment = { filename: `screenshot.${match[1]!}`, content: match[2]! };
    }
  }

  try {
    const { error } = await resend.emails.send({
      from: 'SupportPilot <onboarding@resend.dev>',
      to,
      ...(customerEmail ? { replyTo: customerEmail } : {}),
      subject: `Customer issue: ${customerQuery.replace(/\s+/g, ' ').trim().slice(0, 60)}`,
      html: `
        ${customerEmail ? `<p><strong>Customer email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>` : ''}
        <p><strong>Customer query:</strong></p>
        <blockquote>${customerQuery}</blockquote>
        ${attachment ? `<p><strong>Attached screenshot:</strong> see attachment below.</p>` : ''}
        <p><strong>AI response:</strong></p>
        <p>${aiResponse.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Reported via SupportPilot AI</em></p>
      `,
      ...(attachment ? { attachments: [attachment] } : {}),
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
