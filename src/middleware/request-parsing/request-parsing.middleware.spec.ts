import { RequestParsingMiddleware } from './request-parsing.middleware';

describe('RequestParsingMiddleware', () => {
  let middleware: RequestParsingMiddleware;

  beforeEach(() => {
    middleware = new RequestParsingMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  const mockResponse = () => {
    const res: any = {};
    res.sendStatus = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('use', () => {
    it('should call next() for valid JSON content type', () => {
      const req: any = {
        is: jest.fn().mockReturnValue('application/json'),
        body: { name: 'Test' },
      };
      const res = mockResponse();
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ name: 'Test' });
    });

    it('should return 400 for invalid JSON payload', () => {
      const req: any = {
        is: jest.fn().mockReturnValue('application/json'),
        body: undefined,
      };
      const res = mockResponse();
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(400);
    });

    it('should return 405 for non-JSON content type', () => {
      const req: any = {
        is: jest.fn().mockReturnValue('text/plain'),
        body: {},
      };
      const res = mockResponse();
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(405);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle XML content type', () => {
      const req: any = {
        is: jest.fn().mockReturnValue('application/xml'),
        body: {},
      };
      const res = mockResponse();
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(405);
    });

    it('should process valid JSON body correctly', () => {
      const req: any = {
        is: jest.fn().mockReturnValue('application/json'),
        body: { user: { name: 'John', email: 'john@test.com' } },
      };
      const res = mockResponse();
      const next = jest.fn();

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(JSON.stringify(req.body)).toBe(
        JSON.stringify({ user: { name: 'John', email: 'john@test.com' } }),
      );
    });
  });
});
