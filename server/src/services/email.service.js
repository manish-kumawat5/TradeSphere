const nodemailer = require('nodemailer');

// ── Transporter ──────────────────────────────────────────────────────
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('❌ Missing EMAIL_USER or EMAIL_PASS environment variables for Nodemailer.');
  // In development we still create a dummy transporter to avoid crashes
  var transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
} else {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

if (process.env.NODE_ENV !== 'production') {
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠ Email transporter verify warning:', error.message);
    }
  });
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Build the OTP email HTML template
 */
function buildOtpEmailTemplate(otp, name) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0E11;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0B0E11;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#131722;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:linear-gradient(135deg,#00D09C,#00B386);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <span style="color:#fff;font-size:20px;font-weight:700;">T</span>
                </div>
                <span style="color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.5px;">TradeSphere</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#FFFFFF;font-size:22px;font-weight:600;margin:0 0 8px;">
                Verify your email
              </h1>
              <p style="color:#8A8F98;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Hey ${name || 'there'},<br/>
                Use the code below to verify your email address and activate your TradeSphere account.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,rgba(0,208,156,0.1),rgba(0,179,134,0.05));border:1px solid rgba(0,208,156,0.2);border-radius:12px;padding:28px;text-align:center;margin:0 0 32px;">
                <p style="color:#8A8F98;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">
                  Your Verification Code
                </p>
                <div style="font-size:36px;font-weight:700;color:#00D09C;letter-spacing:12px;font-family:'Courier New',monospace;">
                  ${otp}
                </div>
              </div>

              <p style="color:#8A8F98;font-size:13px;line-height:1.6;margin:0 0 8px;">
                ⏱ This code expires in <strong style="color:#FFFFFF;">10 minutes</strong>.
              </p>
              <p style="color:#8A8F98;font-size:13px;line-height:1.6;margin:0;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:#4A4F58;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} TradeSphere. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send OTP email to user
 */
async function sendOtpEmail(email, otp, name) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${otp} — Your TradeSphere Verification Code`,
    html: buildOtpEmailTemplate(otp, name),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email} — Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw error;
  }
}

function sendGenericEmail(to, subject, html) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  generateOTP,
  sendOtpEmail,
  sendGenericEmail,
};
