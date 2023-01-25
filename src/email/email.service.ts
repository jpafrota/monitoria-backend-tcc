import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendEmailRequestMonitoring(
    email: string,
    subject: string,
    message,
    template: string,
  ) {
    return this.mailerService.sendMail({
      to: email,
      from: process.env.MAIL_AUTH_USER,
      subject: subject,
      text: process.env.REQUEST_MONITORING,
      template: `${template}.hbs`,
      context: {
        student_name: message.student_name,
        subject_name: message.subject_name,
      },
    });
  }

  async sendEmailAcceptMonitoring(
    email: string,
    subject: string,
    template: string,
  ) {
    return this.mailerService.sendMail({
      to: email,
      from: process.env.MAIL_AUTH_USER,
      subject: subject,
      text: process.env.ACCEPT_MONITORING,
      template: `${template}.hbs`,
      context: {},
    });
  }

  async sendEmailRefuseMonitoring(
    email: string,
    subject: string,
    template: string,
  ) {
    return this.mailerService.sendMail({
      to: email,
      from: process.env.MAIL_AUTH_USER,
      subject: subject,
      text: process.env.REFUSE_MONITORING,
      template: `${template}.hbs`,
      context: {},
    });
  }

  async sendEmail(
    email: string,
    subject: string,
    context: string,
    template: string,
  ) {
    return this.mailerService.sendMail({
      to: email,
      from: process.env.MAIL_AUTH_USER,
      subject: subject,
      text: context,
      template: `${template}.hbs`,
      context: {
        code: context,
      },
    });
  }
}
