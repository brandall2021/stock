import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

function isConfigured(): boolean {
  return process.env.MAIL_ENABLED === "true" && Boolean(process.env.SMTP_HOST);
}

export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  if (!isConfigured()) {
    console.log(
      `[mail] SMTP no configurado (MAIL_ENABLED o SMTP_HOST) — se omite envío a ${to}: ${subject}`
    );
    return;
  }
  try {
    await getTransporter().sendMail({
      from:
        process.env.SMTP_FROM ??
        (process.env.SMTP_USER
          ? `Stock <${process.env.SMTP_USER}>`
          : "Stock <no-reply@localhost>"),
      to,
      subject,
      text,
    });
  } catch (e) {
    console.error("[mail] error al enviar:", e);
  }
}
