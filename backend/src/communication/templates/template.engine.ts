import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { CommunicationConfig } from '../config/communication.config';
import {
  TemplateNotFoundException,
  EmailRenderException,
} from '../exceptions/communication.exceptions';

// ──────────────────────────────────────────────────────────────
// INLINE FALLBACK TEMPLATES (Guarantees zero-crash file read safety)
// ──────────────────────────────────────────────────────────────

const INLINE_LAYOUT = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background-color: #0f172a; color: #cbd5e1; font-family: sans-serif; padding: 20px; }
    .btn { display: inline-block; padding: 10px 20px; background: #4f46e5; color: #fff !important; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div>{{> header}}</div>
  <hr style="border-color: #334155;"/>
  <div>{{{body}}}</div>
  <hr style="border-color: #334155;"/>
  <div>{{> footer}}</div>
</body>
</html>
`;

const INLINE_HEADER = `<h2>{{appName}} Notification</h2>`;
const INLINE_FOOTER = `<p>&copy; {{currentYear}} {{appName}}. Support: {{supportEmail}}</p>`;

const INLINE_TEMPLATES: Record<string, string> = {
  welcome: `<h2>Welcome, {{name}}!</h2><p>Employee Code: {{employeeCode}}</p><a href="{{loginUrl}}" class="btn">Get Started</a>`,
  verify_email: `<h2>Verify Email</h2><p>Hello {{name}}, verify by clicking below:</p><a href="{{verificationUrl}}" class="btn">Verify</a>`,
  password_reset: `<h2>Reset Password</h2><p>Click below to reset:</p><a href="{{resetUrl}}" class="btn">Reset</a>`,
  password_changed: `<h2>Password Changed</h2><p>Your password was changed on {{changeDate}}.</p>`,
  account_activated: `<h2>Account Activated</h2><p>Your account is unlocked. Role: {{role}}</p>`,
  account_disabled: `<h2>Account Suspended</h2><p>Suspended due to: {{reason}}</p>`,
  indent_submitted: `<h2>Indent Submitted</h2><p>Indent #{{indentNumber}} for {{productName}} has been submitted.</p>`,
  design_completed: `<h2>Design Completed</h2><p>Design completed for Indent #{{indentNumber}}.</p>`,
  stores_pending: `<h2>Stores Pending</h2><p>Indent #{{indentNumber}} is pending stock verification.</p>`,
  material_issued: `<h2>Materials Issued</h2><p>Materials issued for Indent #{{indentNumber}}.</p>`,
  production_started: `<h2>Production Started</h2><p>Production started for Indent #{{indentNumber}}.</p>`,
  production_completed: `<h2>Production Completed</h2><p>Production completed for Indent #{{indentNumber}}.</p>`,
  customer_delivered: `<h2>Customer Delivered</h2><p>Indent #{{indentNumber}} delivered to customer.</p>`,
  cost_verification: `<h2>Cost Verification</h2><p>Indent #{{indentNumber}} awaiting cost verification.</p>`,
  financial_closure: `<h2>Financial Closure</h2><p>Financial closure completed for Indent #{{indentNumber}}.</p>`,
  daily_summary: `<h2>Daily Summary</h2><p>Daily report summary. New indents: {{newIndentsCount}}</p>`,
  weekly_summary: `<h2>Weekly Summary</h2><p>Weekly report summary. Handled: {{totalIndents}}</p>`,
  monthly_summary: `<h2>Monthly Summary</h2><p>Monthly report summary. Net variance: {{netVariance}}</p>`,
  smtp_failure: `<h2>SMTP Failure</h2><p>Failure at: {{host}}:{{port}}. Error: {{errorMessage}}</p>`,
  queue_failure: `<h2>Queue Failure</h2><p>Job ID: {{jobId}}. Detail: {{errorDetail}}</p>`,
  template_failure: `<h2>Template Failure</h2><p>Template: {{templateName}}. Error: {{parserError}}</p>`,
};

@Injectable()
export class TemplateEngine {
  private readonly logger = new Logger(TemplateEngine.name);
  private templatesDir = '';

  constructor() {
    this.resolveTemplatesDirectory();
    this.registerPartials();
  }

  private resolveTemplatesDirectory(): void {
    // Try multiple possible paths to accommodate NestJS runtime compile layouts
    const paths = [
      path.join(__dirname, '..', 'templates'), // dist/communication/templates
      path.join(__dirname, 'templates'), // src/communication/templates (dev mode)
      path.join(process.cwd(), 'src', 'communication', 'templates'),
      path.join(process.cwd(), 'dist', 'communication', 'templates'),
    ];

    for (const p of paths) {
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        this.templatesDir = p;
        this.logger.log(`Resolved email templates directory to: ${p}`);
        return;
      }
    }
    this.logger.warn(
      'Could not locate templates directory on disk. Using built-in inline fallback templates.',
    );
  }

  private registerPartials(): void {
    let headerSource = INLINE_HEADER;
    let footerSource = INLINE_FOOTER;

    if (this.templatesDir) {
      const headerPath = path.join(this.templatesDir, 'partials', 'header.hbs');
      const footerPath = path.join(this.templatesDir, 'partials', 'footer.hbs');

      try {
        if (fs.existsSync(headerPath)) headerSource = fs.readFileSync(headerPath, 'utf8');
        if (fs.existsSync(footerPath)) footerSource = fs.readFileSync(footerPath, 'utf8');
      } catch (err) {
        this.logger.warn(
          'Failed to read partial files from disk. Falling back to inline defaults.',
          err,
        );
      }
    }

    Handlebars.registerPartial('header', headerSource);
    Handlebars.registerPartial('footer', footerSource);

    // Helpers
    Handlebars.registerHelper('currentYear', () => new Date().getFullYear());
  }

  public render(templateName: string, context: Record<string, any> = {}): string {
    const appConfig = CommunicationConfig.getAppMailConfig();
    const fullContext = {
      ...appConfig,
      currentYear: new Date().getFullYear(),
      ...context,
    };

    let layoutSource = INLINE_LAYOUT;
    let templateSource = INLINE_TEMPLATES[templateName] || '';

    // If template is missing entirely, check fallback map or throw
    if (
      !templateSource &&
      (!this.templatesDir ||
        !fs.existsSync(path.join(this.templatesDir, 'items', `${templateName}.hbs`)))
    ) {
      throw new TemplateNotFoundException(templateName);
    }

    if (this.templatesDir) {
      const layoutPath = path.join(this.templatesDir, 'layouts', 'main.hbs');
      const templatePath = path.join(this.templatesDir, 'items', `${templateName}.hbs`);

      try {
        if (fs.existsSync(layoutPath)) {
          layoutSource = fs.readFileSync(layoutPath, 'utf8');
        }
        if (fs.existsSync(templatePath)) {
          templateSource = fs.readFileSync(templatePath, 'utf8');
        }
      } catch (err) {
        this.logger.warn(
          `Failed reading file template '${templateName}' from disk. Falling back to inline.`,
          err,
        );
      }
    }

    try {
      // Compile template and render inner body
      const templateDelegate = Handlebars.compile(templateSource);
      const bodyHtml = templateDelegate(fullContext);

      // Wrap inside layout
      const layoutDelegate = Handlebars.compile(layoutSource);
      return layoutDelegate({
        ...fullContext,
        body: bodyHtml,
      });
    } catch (error) {
      this.logger.error(
        `Handlebars template render error on: ${templateName}`,
        error?.stack || error,
      );
      throw new EmailRenderException(templateName, error);
    }
  }
}
