import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config } from '@config/environment';
import { sesClient as defaultSesClient } from '@shared/clients/ses.client';
import { Player } from '@shared/types';

export interface EmailSendResult {
  messageId: string;
}

export class EmailService {
  private readonly client: SESClient;
  private readonly senderEmail: string;

  constructor(client: SESClient = defaultSesClient, senderEmail: string = config.senderEmail) {
    this.client = client;
    this.senderEmail = senderEmail;
  }

  async sendWelcomeEmail(player: Player): Promise<EmailSendResult> {
    if (!this.senderEmail) {
      throw new Error('SENDER_EMAIL environment variable is not set.');
    }

    const { teamId, playerId, name, email, position, eventId } = player;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 30px; text-align: center; }
          .content { padding: 30px; color: #334155; line-height: 1.6; }
          .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
          .footer { padding: 20px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>Welcome Package 🏆</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name || 'Player'}</strong>,</p>
            <p>Congratulations! You have been successfully added to team <strong>${teamId}</strong> as <strong>${position || 'Player'}</strong>.</p>
            <p>Your digital onboarding materials and player guidelines are ready. Click below to access your dashboard:</p>
            <p style="text-align: center;">
              <a href="https://example.com/onboarding?player=${playerId}" class="button">Access Player Portal</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Event ID: <code>${eventId || 'N/A'}</code> | Player ID: <code>${playerId}</code></p>
          </div>
          <div class="footer">
            Automated System Delivery • Amazon SES & SQS Decoupled Engine
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `Welcome to the Platform, ${name || 'Player'}!\n\nTeam: ${teamId}\nPlayer ID: ${playerId}\nPosition: ${position || 'Unassigned'}\nEvent ID: ${eventId || 'N/A'}`;

    const command = new SendEmailCommand({
      Source: this.senderEmail,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `🚀 Welcome to the Platform, ${name || 'Player'}!`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: { Data: htmlBody, Charset: 'UTF-8' },
          Text: { Data: textBody, Charset: 'UTF-8' },
        },
      },
    });

    const result = await this.client.send(command);
    return { messageId: result.MessageId || 'N/A' };
  }
}
