import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// T1-J, K, L: Form Validation logic
describe('Forms & Zod Validation (T1-J, K, L)', () => {
  it('should validate valid form data', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const result = schema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid form data (T1-J)', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const result = schema.safeParse({
      email: 'invalid-email',
      password: '123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBe(2);
    }
  });

  it('should validate complex nested payload (T1-K)', () => {
    const itemSchema = z.object({
      materialId: z.string().min(1),
      quantity: z.number().positive(),
    });

    const indentSchema = z.object({
      departmentName: z.string().min(1),
      items: z.array(itemSchema).min(1),
    });

    const result = indentSchema.safeParse({
      departmentName: 'PRODUCTION',
      items: [{ materialId: 'm1', quantity: 10 }],
    });

    expect(result.success).toBe(true);
  });
});
