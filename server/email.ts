import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface QuoteRequestData {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
  productName?: string;
  productCode?: string;
}

export async function sendQuoteRequestEmail(data: QuoteRequestData): Promise<void> {
  const toEmail = process.env.SMTP_TO_EMAIL || process.env.SMTP_USER;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px 40px; text-align: center;">
              <img src="https://agorarockdrill.shop/assets/AgoraRockDrillLogo_1766156134401.png" alt="Agora Rock Drill" style="max-width: 280px; height: auto; margin-bottom: 15px;" />
              <p style="color: #f59e0b; margin: 10px 0 0 0; font-size: 18px; font-weight: 600;">New Quote Request</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1e3a5f; margin: 0 0 25px 0; font-size: 22px; border-bottom: 3px solid #f59e0b; padding-bottom: 10px;">Customer Information</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 15px; background-color: #f8fafc; border-left: 4px solid #1e3a5f; margin-bottom: 10px;">
                    <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Full Name</strong>
                    <p style="color: #1e293b; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">${data.name}</p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                
                ${data.company ? `
                <tr>
                  <td style="padding: 12px 15px; background-color: #f8fafc; border-left: 4px solid #1e3a5f;">
                    <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Company</strong>
                    <p style="color: #1e293b; margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">${data.company}</p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                ` : ''}
                
                <tr>
                  <td style="padding: 12px 15px; background-color: #f8fafc; border-left: 4px solid #1e3a5f;">
                    <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email Address</strong>
                    <p style="color: #1e293b; margin: 5px 0 0 0; font-size: 16px;">
                      <a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none;">${data.email}</a>
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                
                ${data.phone ? `
                <tr>
                  <td style="padding: 12px 15px; background-color: #f8fafc; border-left: 4px solid #1e3a5f;">
                    <strong style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Phone Number</strong>
                    <p style="color: #1e293b; margin: 5px 0 0 0; font-size: 16px;">
                      <a href="tel:${data.phone}" style="color: #2563eb; text-decoration: none;">${data.phone}</a>
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                ` : ''}
              </table>
              
              ${data.productName || data.productCode ? `
              <h2 style="color: #1e3a5f; margin: 0 0 25px 0; font-size: 22px; border-bottom: 3px solid #f59e0b; padding-bottom: 10px;">Product Information</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #fef3c7; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    ${data.productName ? `
                    <p style="margin: 0 0 10px 0;">
                      <strong style="color: #92400e;">Product:</strong>
                      <span style="color: #1e293b; font-weight: 600;"> ${data.productName}</span>
                    </p>
                    ` : ''}
                    ${data.productCode ? `
                    <p style="margin: 0;">
                      <strong style="color: #92400e;">Product Code:</strong>
                      <span style="color: #1e293b; font-weight: 600;"> ${data.productCode}</span>
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <h2 style="color: #1e3a5f; margin: 0 0 25px 0; font-size: 22px; border-bottom: 3px solid #f59e0b; padding-bottom: 10px;">Message</h2>
              
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;">
                <p style="color: #334155; margin: 0; line-height: 1.7; font-size: 15px; white-space: pre-wrap;">${data.message}</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e3a5f; padding: 25px 40px; text-align: center;">
              <p style="color: #94a3b8; margin: 0; font-size: 13px;">This email was sent from the quote request form at</p>
              <p style="color: #f59e0b; margin: 8px 0 0 0; font-size: 14px; font-weight: 600;">www.agorarockdrill.shop</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const subject = data.productName 
    ? `Quote Request: ${data.productName} - ${data.name}`
    : `New Quote Request from ${data.name}`;

  await transporter.sendMail({
    from: `"Agora Rock Drill" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
    replyTo: data.email,
  });
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP connection error:", error);
    return false;
  }
}
