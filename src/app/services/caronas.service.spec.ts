import { TestBed } from '@angular/core/testing';

import { CaronasService } from './caronas.service';

describe('CaronasService', () => {
  let service: CaronasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaronasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
