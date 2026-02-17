import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastrarCaronaComponent } from './cadastrar-carona.component';

describe('CadastrarCaronaComponent', () => {
  let component: CadastrarCaronaComponent;
  let fixture: ComponentFixture<CadastrarCaronaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CadastrarCaronaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastrarCaronaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
