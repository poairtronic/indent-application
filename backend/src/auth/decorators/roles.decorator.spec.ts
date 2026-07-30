import { ROLES_KEY, Roles } from './roles.decorator';

describe('@Roles decorator', () => {
  it('should set roles metadata on a class', () => {
    @Roles('ADMIN', 'MANAGER')
    class TestClass {}

    const metadata = Reflect.getMetadata(ROLES_KEY, TestClass);
    expect(metadata).toEqual(['ADMIN', 'MANAGER']);
  });

  it('should set roles metadata on a method', () => {
    class TestClass {
      @Roles('ADMIN')
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(ROLES_KEY, TestClass.prototype.testMethod);
    expect(metadata).toEqual(['ADMIN']);
  });

  it('should set empty array when no roles provided', () => {
    @Roles()
    class TestClass {}

    const metadata = Reflect.getMetadata(ROLES_KEY, TestClass);
    expect(metadata).toEqual([]);
  });
});
