const nodemailer = require('nodemailer');

// For MailTrap
// const transporter = nodemailer.createTransport({
//   host: 'sandbox.smtp.mailtrap.io',
//   port: 2525,
//   auth: {
//     user: process.env.MAILTRAP_USER,
//     pass: process.env.MAILTRAP_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false, // Accept self-signed certs (development only)
//   },
// });


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Accept self-signed certs (development only)
    },
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        console.log('Sending to:', to);
        const info = await transporter.sendMail({
            from: '"SmartBuy" <smartbuymarketplace@gmail.com>',
            to,
            subject,
            html,
        });

        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};

module.exports = sendEmail;
