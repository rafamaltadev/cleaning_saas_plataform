export interface NotificationAdapter {
  send(to: string, template: string, payload: Record<string, unknown>): Promise<void>;
}

export const EMAIL_ADAPTER = 'EMAIL_ADAPTER';
export const SMS_ADAPTER = 'SMS_ADAPTER';

function interpolate(text: string, payload: Record<string, unknown>): string {
  return Object.entries(payload).reduce(
    (s, [k, v]) => s.split(`{{${k}}}`).join(String(v)),
    text,
  );
}

export { interpolate };
