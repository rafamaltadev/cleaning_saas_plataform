import { SmsAdapter } from './sms.adapter';

describe('SmsAdapter', () => {
  let adapter: SmsAdapter;

  beforeEach(() => {
    adapter = new SmsAdapter();
  });

  it('sends without throwing (stub)', async () => {
    await expect(
      adapter.send('+5511999999999', 'booking.confirmed', { bookingId: 'b-123' }),
    ).resolves.toBeUndefined();
  });

  it('interpolates {{variable}} patterns in template name', async () => {
    const logSpy = jest.spyOn((adapter as any).logger, 'log').mockImplementation(() => {});

    await adapter.send('+5511999999999', 'booking.{{status}}', { status: 'confirmed' });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[template:booking.confirmed]'),
    );
  });
});
