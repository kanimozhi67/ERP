import nodemailer from "nodemailer";
import dotenv from "dotenv";

// ✅ Load environment variables
dotenv.config();

// ✅ Create reusable transporter object using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email notification
 */
export const sendEmailNotification = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Fleet Management" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };
   // console.log(mailOptions)
    await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error: error.message };
  }
};
