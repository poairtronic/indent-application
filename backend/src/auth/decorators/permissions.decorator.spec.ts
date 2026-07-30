import { PERMISSIONS_KEY, Permissions } from './permissions.decorator';

describe('@Permissions decorator', () => {
  it('should set permissions metadata on a class', () => {
    @Permissions('users.create', 'users.view')
    class TestClass {}

    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass);
    expect(metadata).toEqual(['users.create', 'users.view']);
  });

  it('should set permissions metadata on a method', () => {
    class TestClass {
      @Permissions('indent.view')
      testMethod() {}
    }

    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass.prototype.testMethod);
    expect(metadata).toEqual(['indent.view']);
  });

  it('should set empty array when no permissions provided', () => {
    @Permissions()
    class TestClass {}

    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass);
    expect(metadata).toEqual([]);
  });
});
