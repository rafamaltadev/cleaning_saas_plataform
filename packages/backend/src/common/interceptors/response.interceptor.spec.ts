import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';

const mockExecutionContext = {} as ExecutionContext;

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('wraps object response in { data, meta }', async () => {
    const testData = { id: 1, name: 'test' };
    const mockCallHandler: CallHandler = { handle: () => of(testData) };

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, mockCallHandler),
    );

    expect(result).toEqual({ data: testData, meta: {} });
  });

  it('wraps array response in { data, meta }', async () => {
    const testData = [{ id: 1 }, { id: 2 }];
    const mockCallHandler: CallHandler = { handle: () => of(testData) };

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, mockCallHandler),
    );

    expect(result).toEqual({ data: testData, meta: {} });
  });

  it('wraps null response in { data, meta }', async () => {
    const mockCallHandler: CallHandler = { handle: () => of(null) };

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, mockCallHandler),
    );

    expect(result).toEqual({ data: null, meta: {} });
  });

  it('always includes meta as an empty object', async () => {
    const mockCallHandler: CallHandler = { handle: () => of('string-value') };

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, mockCallHandler),
    );

    expect(result).toHaveProperty('meta');
    expect(result.meta).toEqual({});
  });
});
