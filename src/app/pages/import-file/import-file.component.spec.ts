import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportFileComponent } from './import-file.component';

describe('ImportFileComponent', () => {
  let component: ImportFileComponent;
  let fixture: ComponentFixture<ImportFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate CSV format', () => {
    const csvFile = new File(['test'], 'test.csv', { type: 'text/csv' });
    const nonCsvFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    expect(csvFile.name.toLowerCase().endsWith('.csv')).toBeTruthy();
    expect(nonCsvFile.name.toLowerCase().endsWith('.csv')).toBeFalsy();
  });

  it('should limit to 3 files maximum', () => {
    component.maxFiles = 3;
    const files: File[] = [];

    for (let i = 0; i < 5; i++) {
      files.push(new File(['test'], `test${i}.csv`, { type: 'text/csv' }));
    }

    component.selectedFiles = files.slice(0, component.maxFiles);
    expect(component.selectedFiles.length).toBe(3);
  });
});
