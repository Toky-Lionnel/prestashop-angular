import { TestBed } from '@angular/core/testing';

import { ImportFileService } from './import.service';

describe('ImportFileService', () => {
  let service: ImportFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('transformValue', () => {
    it('should convert numbers with comma to point', () => {
      // Utiliser any pour accéder à une méthode private
      const result = (service as any).transformValue('123,45');
      expect(result).toBe(123.45);
    });

    it('should preserve commas in text', () => {
      const result = (service as any).transformValue('Texte avec, virgule');
      expect(result).toBe('Texte avec, virgule');
    });

    it('should convert boolean strings', () => {
      expect((service as any).transformValue('true')).toBe(true);
      expect((service as any).transformValue('false')).toBe(false);
      expect((service as any).transformValue('TRUE')).toBe(true);
      expect((service as any).transformValue('FALSE')).toBe(false);
    });

    it('should handle null values', () => {
      expect((service as any).transformValue('')).toBe(null);
      expect((service as any).transformValue('null')).toBe(null);
      expect((service as any).transformValue('nil')).toBe(null);
    });

    it('should convert integer numbers', () => {
      expect((service as any).transformValue('123')).toBe(123);
      expect((service as any).transformValue('-456')).toBe(-456);
    });

    it('should convert decimal numbers with dot', () => {
      expect((service as any).transformValue('123.45')).toBe(123.45);
      expect((service as any).transformValue('-123.45')).toBe(-123.45);
    });
  });

  describe('parseCSVLines', () => {
    it('should parse simple CSV', () => {
      const csv = 'name,age,city\nJohn,30,Paris\nJane,25,Lyon';
      const result = (service as any).parseCSVLines(csv);

      expect(result.length).toBe(3);
      expect(result[0]).toEqual(['name', 'age', 'city']);
      expect(result[1]).toEqual(['John', '30', 'Paris']);
      expect(result[2]).toEqual(['Jane', '25', 'Lyon']);
    });

    it('should handle quoted fields with commas', () => {
      const csv = 'name,description\nProduct,"A good product, really nice"';
      const result = (service as any).parseCSVLines(csv);

      expect(result[1][1]).toContain('A good product, really nice');
    });

    it('should handle escaped quotes', () => {
      const csv = 'name,quote\nJohn,"He said ""Hello"""';
      const result = (service as any).parseCSVLines(csv);

      expect(result[1][1]).toContain('He said "Hello"');
    });
  });
});
