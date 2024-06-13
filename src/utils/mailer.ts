import nodeMailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendEmail = (to: string, subject: string, htmlContent: string) => {
  const transport = nodeMailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });
  const options = {
    from: process.env.MAIL_USERNAME,
    to: to,
    subject: subject,
    html: htmlContent,
  };
  transport.sendMail(options, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Đã gửi thư đến gmail: " + to + ":" + info.response);
    }
  });
};
