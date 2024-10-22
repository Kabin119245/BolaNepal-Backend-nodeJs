import nodemailer from 'nodemailer';

export const sendEmail = async (email, subject, message) => {
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // Your Gmail password or App-specific password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: subject,
    text: message,
  };

  await transporter.sendMail(mailOptions);
};
