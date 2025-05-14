const nodemailer = require("nodemailer");

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendActivationMail(to, link) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject: "Активация аккаунта на JobTracker",
        text: "",
        html: `
          <table style="width:100%;border-collapse:collapse;background-color:#ffffff;padding:20px;font-family:'Arial',sans-serif;color:#2c2c2c">
            <tbody>
              <tr>
                <td style="padding:20px 20px 10px 20px;background-color:#375e97;color:#eaf2ff;text-align:center">
                  <img src="https://ci3.googleusercontent.com/meips/ADKq_Na1bhH7KScTrv78_nIFqZgeo8NU47YlO8geFzQIgnbth1EpA_OQ55Ly9hcdccUXBX7QEu-u=s0-d-e1-ft#https://i.imgur.com/MM65AN7.png">
                </td>
              </tr>
              <tr>
                <td style="padding:20px">
                  <h2 style="color:#375e97;text-align:center">Подтвердите свой адрес электронной почты</h2>
                  <p>Здравствуйте, <b>${to.split("@")[0]}</b></p>
                  <p>Благодарим за регистрацию на платформе <strong>JobTracker</strong>. Чтобы завершить процесс регистрации, пожалуйста, подтвердите свой адрес электронной почты, нажав на кнопку ниже:</p>
                  <p style="text-align:center">
                    <a href="${link}" style="display:inline-block;padding:10px 20px;background-color:#f85f4b;color:#fff3f1;text-decoration:none;font-size:14px;border-radius:5px">ПОДТВЕРДИТЬ ПОЧТУ</a>
                  </p>
                  <p>После подтверждения вашей электронной почты ваши избранные вакансии сохранятся на сервере и будут доступны с любого устройства. Находите и сохраняйте вакансии, которые вам интересны!</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px;background-color:#f4f4f4;text-align:center;font-size:12px;color:#555d66">
                  <p>Если вы не регистрировались на <strong>JobTracker</strong>, просто проигнорируйте это письмо.</p>
                  <p>С уважением, <strong>cptblackmore</strong>.</p>
                </td>
              </tr>
            </tbody>
          </table>
        `,
      });
    } catch (e) {
      throw new Error(e);
    }
  }
}

module.exports = new MailService();
