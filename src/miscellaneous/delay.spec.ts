import { delay } from './delay';

describe('delay', () => {
  it('should be a function', () => {
    expect(typeof delay).toBe('function');
  });

  it('should return a Promise', () => {
    const result = delay(100, 'test');
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve with the given value', async () => {
    const result = delay(10, 'test-value');
    const value = await result;
    expect(value).toBe('test-value');
  });

  it('should resolve with numeric value', async () => {
    const result = delay(10, 42);
    const value = await result;
    expect(value).toBe(42);
  });

  it('should resolve with object value', async () => {
    const testObj = { key: 'value' };
    const result = delay(10, testObj);
    const value = await result;
    expect(value).toEqual(testObj);
  });

  it('should resolve with null value', async () => {
    const result = delay(10, null);
    const value = await result;
    expect(value).toBeNull();
  });

  it('should resolve with undefined value', async () => {
    const result = delay(10, undefined);
    const value = await result;
    expect(value).toBeUndefined();
  });
});
