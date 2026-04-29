import { EmailAdapter } from './email.adapter';

describe('EmailAdapter', () => {
  let adapter: EmailAdapter;

  beforeEach(() => {
    adapter = new EmailAdapter();
  });

  it('sends without throwing (stub)', async () => {
    await expect(
      adapter.send('user@example.com', 'quote.sent', { quoteId: 'q-123' }),
    ).resolves.toBeUndefined();
  });

  it('interpolates {{variable}} patterns in template name', async () => {
    const logSpy = jest.spyOn((adapter as any).logger, 'log').mockImplementation(() => {});

    await adapter.send('test@test.com', 'quote.{{status}}', { status: 'sent' });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[template:quote.sent]'),
    );
  });
});
