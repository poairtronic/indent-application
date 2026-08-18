import { ReportsService } from '../services/reports.service';

describe('Report Currency Localization (BUG-CALC-001)', () => {
  let service: ReportsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {};
    service = new ReportsService(mockPrisma);
  });

  afterEach(() => {
    delete process.env.DEFAULT_CURRENCY;
    delete process.env.SYSTEM_CURRENCY;
  });

  it('should default to INR (₹) when no environment currency is set', () => {
    delete process.env.DEFAULT_CURRENCY;
    const currency = service.getSystemCurrency();
    expect(currency.code).toBe('INR');
    expect(currency.symbol).toBe('₹');
    expect(currency.numFmt).toBe('[$₹-439] #,##0.00');
  });

  it('should return USD ($) when configured to USD', () => {
    process.env.DEFAULT_CURRENCY = 'USD';
    const currency = service.getSystemCurrency();
    expect(currency.code).toBe('USD');
    expect(currency.symbol).toBe('$');
    expect(currency.numFmt).toBe('$#,##0.00');
  });

  it('should return EUR (€) when configured to EUR', () => {
    process.env.DEFAULT_CURRENCY = 'EUR';
    const currency = service.getSystemCurrency();
    expect(currency.code).toBe('EUR');
    expect(currency.symbol).toBe('€');
    expect(currency.numFmt).toBe('€#,##0.00');
  });
});
