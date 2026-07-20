import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from '../processors/email.processor';
import { EmailService } from '@/common/email/email.service';
import { JOB } from '../queue.constants';
import { Job } from 'bullmq';
import { SendEmailJobPayload } from '../dto/job-payloads.dto';

const mockEmailService = { send: jest.fn() };

function makeJob(name: string, data: SendEmailJobPayload): Partial<Job<SendEmailJobPayload>> {
  return { id: 'job-1', name, data };
}

describe('EmailProcessor', () => {
  let processor: EmailProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailProcessor, { provide: EmailService, useValue: mockEmailService }],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  it('should call emailService.send for a valid send-email job', async () => {
    const payload: SendEmailJobPayload = {
      to: 'recipient@test.com',
      toName: 'Alice',
      subject: 'Deal assigned',
      template: 'deal-assigned',
      context: {
        recipientName: 'Alice',
        dealTitle: 'Big Deal',
        dealValue: '$5,000',
        assignedBy: 'Bob',
      },
    };

    mockEmailService.send.mockResolvedValue(undefined);

    await processor.process(makeJob(JOB.SEND_EMAIL, payload) as Job<SendEmailJobPayload>);

    expect(mockEmailService.send).toHaveBeenCalledWith(payload);
  });

  it('should skip unknown job names', async () => {
    await processor.process(
      makeJob('unknown-job', {} as SendEmailJobPayload) as Job<SendEmailJobPayload>,
    );

    expect(mockEmailService.send).not.toHaveBeenCalled();
  });

  it('should re-throw when emailService.send fails (allows BullMQ retry)', async () => {
    const payload: SendEmailJobPayload = {
      to: 'fail@test.com',
      toName: 'Bob',
      subject: 'Test',
      template: 'task-assigned',
      context: { recipientName: 'Bob', taskTitle: 'Task', dueDate: '2026-06-25' },
    };

    mockEmailService.send.mockRejectedValue(new Error('SMTP timeout'));

    await expect(
      processor.process(makeJob(JOB.SEND_EMAIL, payload) as Job<SendEmailJobPayload>),
    ).rejects.toThrow('SMTP timeout');
  });
});
