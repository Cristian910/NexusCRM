/**
 * Minimal but production-quality HTML email templates.
 * Using string interpolation keeps zero extra runtime dependencies.
 * In a larger system swap this for Handlebars or MJML.
 */

function baseLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #1e40af; padding: 24px 32px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 600; }
    .body { padding: 32px; color: #374151; line-height: 1.6; }
    .body h2 { margin-top: 0; font-size: 18px; color: #111827; }
    .highlight { background: #eff6ff; border-left: 4px solid #1e40af; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
    .highlight p { margin: 0; font-weight: 500; color: #1e3a8a; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 2px; }
    .value { font-size: 15px; color: #111827; font-weight: 500; }
    .footer { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>CRM System</h1>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      This is an automated message from your CRM system. Please do not reply to this email.
    </div>
  </div>
</body>
</html>`;
}

export function dealAssignedTemplate(ctx: {
  recipientName: string;
  dealTitle: string;
  dealValue: string;
  assignedBy: string;
}): string {
  const content = `
    <h2>You've been assigned a deal</h2>
    <p>Hi ${ctx.recipientName},</p>
    <p>A deal has been assigned to you in the CRM system.</p>
    <div class="highlight">
      <p>📊 ${ctx.dealTitle}</p>
    </div>
    <p><span class="label">Deal value</span><br/><span class="value">${ctx.dealValue}</span></p>
    <p><span class="label">Assigned by</span><br/><span class="value">${ctx.assignedBy}</span></p>
    <p>Log in to your CRM to view the full deal details and take action.</p>
  `;
  return baseLayout(content, `Deal assigned: ${ctx.dealTitle}`);
}

export function taskAssignedTemplate(ctx: {
  recipientName: string;
  taskTitle: string;
  dueDate: string;
  dealTitle?: string;
  description?: string;
}): string {
  const dealSection = ctx.dealTitle
    ? `<p><span class="label">Related deal</span><br/><span class="value">${ctx.dealTitle}</span></p>`
    : '';

  const descSection = ctx.description
    ? `<p><span class="label">Description</span><br/><span class="value">${ctx.description}</span></p>`
    : '';

  const content = `
    <h2>New task assigned to you</h2>
    <p>Hi ${ctx.recipientName},</p>
    <p>A task has been assigned to you.</p>
    <div class="highlight">
      <p>✅ ${ctx.taskTitle}</p>
    </div>
    <p><span class="label">Due date</span><br/><span class="value">${ctx.dueDate}</span></p>
    ${dealSection}
    ${descSection}
    <p>Log in to your CRM to view the task and mark it as complete when done.</p>
  `;
  return baseLayout(content, `Task assigned: ${ctx.taskTitle}`);
}

export function passwordResetTemplate(ctx: {
  recipientName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  const content = `
    <h2>Reset your password</h2>
    <p>Hi ${ctx.recipientName},</p>
    <p>We received a request to reset the password for your CRM account. Click the button below to choose a new one.</p>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${ctx.resetUrl}" style="background: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
        Reset password
      </a>
    </p>
    <p>This link expires in ${ctx.expiresInMinutes} minutes. If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
    <p style="font-size: 12px; color: #9ca3af;">If the button above doesn't work, copy and paste this URL into your browser:<br/>${ctx.resetUrl}</p>
  `;
  return baseLayout(content, 'Reset your CRM password');
}

export function taskReminderTemplate(ctx: {
  recipientName: string;
  taskTitle: string;
  dueDate: string;
  dealTitle?: string;
  hoursUntilDue: number;
}): string {
  const urgency = ctx.hoursUntilDue <= 4 ? '🔴 Urgent' : '⚠️ Reminder';
  const dealSection = ctx.dealTitle
    ? `<p><span class="label">Related deal</span><br/><span class="value">${ctx.dealTitle}</span></p>`
    : '';

  const content = `
    <h2>${urgency}: Task due soon</h2>
    <p>Hi ${ctx.recipientName},</p>
    <p>This is a reminder that the following task is due in approximately <strong>${ctx.hoursUntilDue} hour(s)</strong>.</p>
    <div class="highlight">
      <p>⏰ ${ctx.taskTitle}</p>
    </div>
    <p><span class="label">Due date</span><br/><span class="value">${ctx.dueDate}</span></p>
    ${dealSection}
    <p>Please complete this task or update its status in your CRM.</p>
  `;
  return baseLayout(content, `Reminder: ${ctx.taskTitle}`);
}
