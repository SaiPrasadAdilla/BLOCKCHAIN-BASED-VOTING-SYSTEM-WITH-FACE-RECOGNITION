import { IsRoleValidConstraint, IsRoleValid } from './role-validator.decorator';

describe('IsRoleValidConstraint', () => {
  let constraint: IsRoleValidConstraint;

  beforeEach(() => {
    constraint = new IsRoleValidConstraint();
  });

  it('should be defined', () => {
    expect(constraint).toBeDefined();
  });

  describe('validate', () => {
    it('should return true for valid role "super-admin"', () => {
      expect(constraint.validate('super-admin')).toBe(true);
    });

    it('should return true for valid role "admin"', () => {
      expect(constraint.validate('admin')).toBe(true);
    });

    it('should return true for valid role "owner"', () => {
      expect(constraint.validate('owner')).toBe(true);
    });

    it('should return true for valid role "write"', () => {
      expect(constraint.validate('write')).toBe(true);
    });

    it('should return true for valid role "read"', () => {
      expect(constraint.validate('read')).toBe(true);
    });

    it('should return false for invalid role', () => {
      expect(constraint.validate('invalid-role')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(constraint.validate('')).toBe(false);
    });

    it('should return false for random string', () => {
      expect(constraint.validate('randomString123')).toBe(false);
    });

    it('should return false for mixed case role', () => {
      expect(constraint.validate('Super-Admin')).toBe(false);
    });
  });
});

describe('IsRoleValid', () => {
  it('should be a function', () => {
    expect(typeof IsRoleValid).toBe('function');
  });

  it('should return a decorator function', () => {
    const decorator = IsRoleValid();
    expect(typeof decorator).toBe('function');
  });

  it('should accept validation options', () => {
    const decorator = IsRoleValid({ message: 'Invalid role' });
    expect(typeof decorator).toBe('function');
  });
});
