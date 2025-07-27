export interface EmailData {
  to: string;
  subject: string;
  message: string;
  clientName: string;
  clientEmail: string;
}

export const sendProposalEmail = async (emailData: EmailData): Promise<void> => {
  try {
    const response = await fetch('/api/proposals/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailData.clientEmail,
        subject: emailData.subject,
        message: emailData.message,
        clientName: emailData.clientName,
        clientEmail: emailData.clientEmail
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 