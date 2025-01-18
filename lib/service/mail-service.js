const nodemailer = require('nodemailer');

class MailService {
  constructor () {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    })
  }

  async sendActivationMail(to, link) {
    this.transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject: 'Account activation on ' + process.env.API_URL,
      text: '',
      html: `
        <div>
          <h1>For activation go to link below</h1>
          <a href="${link}">${link}</a>
        </div>
      `
    });
  }
}

module.exports = new MailService();
