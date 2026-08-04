import { faker } from '@faker-js/faker';

export class PayloadGenerator {
  public generateUrl(path: string): string {
    // Replace express style params :id or :uuid with fake UUID
    return path.replace(/:[a-zA-Z0-9_]+/g, () => faker.string.uuid());
  }

  public generateMockBody(dtoName?: string): any {
    if (!dtoName) return {};

    // Basic heuristic mocking based on typical DTO naming or string matching
    const mock: any = {};
    
    if (dtoName.toLowerCase().includes('user')) {
      mock.email = faker.internet.email();
      mock.password = 'StrongP@ssw0rd!';
      mock.name = faker.person.fullName();
    }
    
    if (dtoName.toLowerCase().includes('product')) {
      mock.name = faker.commerce.productName();
      mock.price = Number(faker.commerce.price());
      mock.description = faker.commerce.productDescription();
    }

    if (dtoName.toLowerCase().includes('material')) {
      mock.name = faker.commerce.productMaterial();
      mock.quantity = faker.number.int({ min: 1, max: 100 });
    }

    // Fallback: If it's something else and we don't know, provide a generic payload
    if (Object.keys(mock).length === 0) {
      mock.title = faker.lorem.words(3);
      mock.description = faker.lorem.sentence();
      mock.status = 'DRAFT';
    }

    return mock;
  }
}
