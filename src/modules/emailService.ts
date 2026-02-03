import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import logger from "./logger";

// Validate email environment variables
const requiredEmailVars = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "EMAIL_FROM",
];
const missingEmailVars = requiredEmailVars.filter(
  (varName) => !process.env[varName]
);

if (missingEmailVars.length > 0) {
  console.error(
    `[FATAL] Missing required email environment variables: ${missingEmailVars.join(", ")}`
  );
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST!,
  port: parseInt(process.env.EMAIL_PORT!, 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!,
  },
});

// Send verification email
export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  try {
    // Read HTML template
    const templatePath = path.join(
      __dirname,
      "../templates/emailVerification.html"
    );
    let htmlTemplate = fs.readFileSync(templatePath, "utf-8");

    // Build verification URL (you may need to adjust this based on your frontend URL)
    const verificationUrl = `http://localhost:${process.env.PORT}/users/verify?token=${token}`;

    // Replace placeholders in template
    htmlTemplate = htmlTemplate.replace("{{verificationUrl}}", verificationUrl);

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Verify your Mantrify account",
      html: htmlTemplate,
    });

    logger.info(`Verification email sent to ${email}`);
  } catch (error: any) {
    logger.error(`Failed to send verification email to ${email}: ${error.message}`);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};
