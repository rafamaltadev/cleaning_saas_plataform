import { AllExceptionsFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = jest.fn().mockReturnValue({ method: 'GET', url: '/test' });
const mockSwitchToHttp = jest.fn().mockReturnValue({
  getResponse: mockGetResponse,
  getRequest: mockGetRequest,
});

const mockHost = {
  switchToHttp: mockSwitchToHttp,
} as unknown as ArgumentsHost;

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jest.clearAllMocks();
    mockStatus.mockReturnValue({ json: mockJson });
    mockGetResponse.mockReturnValue({ status: mockStatus });
    mockGetRequest.mockReturnValue({ method: 'GET', url: '/test' });
    mockSwitchToHttp.mockReturnValue({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    });
  });

  it('returns { error: { code, message } } for HttpException', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
        }),
      }),
    );
  });

  it('returns 500 for unknown (non-HttpException) errors', () => {
    const exception = new Error('Unknown error');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    });
  });

  it('includes code and message in error envelope', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    filter.catch(exception, mockHost);

    const callArg = mockJson.mock.calls[0][0];
    expect(callArg).toHaveProperty('error');
    expect(callArg.error).toHaveProperty('code');
    expect(callArg.error).toHaveProperty('message');
  });

  it('joins array messages into a single string', () => {
    const exception = new HttpException(
      { message: ['field is required', 'field must be string'] },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockHost);

    const callArg = mockJson.mock.calls[0][0];
    expect(callArg.error.message).toBe('field is required, field must be string');
  });

  it('uses correct HTTP status from HttpException', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
  });
});
