"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadGenerator = void 0;
const faker_1 = require("@faker-js/faker");
class PayloadGenerator {
    generateUrl(path) {
        // Replace express style params :id or :uuid with fake UUID
        return path.replace(/:[a-zA-Z0-9_]+/g, () => faker_1.faker.string.uuid());
    }
    generateMockBody(dtoName) {
        if (!dtoName)
            return {};
        // Basic heuristic mocking based on typical DTO naming or string matching
        const mock = {};
        if (dtoName.toLowerCase().includes('user')) {
            mock.email = faker_1.faker.internet.email();
            mock.password = 'StrongP@ssw0rd!';
            mock.name = faker_1.faker.person.fullName();
        }
        if (dtoName.toLowerCase().includes('product')) {
            mock.name = faker_1.faker.commerce.productName();
            mock.price = Number(faker_1.faker.commerce.price());
            mock.description = faker_1.faker.commerce.productDescription();
        }
        if (dtoName.toLowerCase().includes('material')) {
            mock.name = faker_1.faker.commerce.productMaterial();
            mock.quantity = faker_1.faker.number.int({ min: 1, max: 100 });
        }
        // Fallback: If it's something else and we don't know, provide a generic payload
        if (Object.keys(mock).length === 0) {
            mock.title = faker_1.faker.lorem.words(3);
            mock.description = faker_1.faker.lorem.sentence();
            mock.status = 'DRAFT';
        }
        return mock;
    }
}
exports.PayloadGenerator = PayloadGenerator;
