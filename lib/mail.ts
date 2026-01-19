import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) => {
    // Support both naming conventions (User's preferred vs Standard SMTP)
    const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const smtpFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || `"Attendify Support" <${smtpUser}>`;

    // Optional: Support service preset (e.g. 'gmail')
    const service = process.env.EMAIL_SERVICE;

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');

    if (!smtpUser || !smtpPass) {
        console.error('SMTP credentials missing. Please set EMAIL_USER/SMTP_USER and EMAIL_PASS/SMTP_PASS environment variables.');
        throw new Error('SMTP credentials configuration missing');
    }

    const transporterConfig: any = {
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    };

    if (service) {
        transporterConfig.service = service;
    } else {
        transporterConfig.host = smtpHost;
        transporterConfig.port = smtpPort;
        transporterConfig.secure = smtpPort === 465;
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const mailOptions = {
        from: smtpFrom,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
