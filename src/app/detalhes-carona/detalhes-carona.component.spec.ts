import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhesCaronaComponent } from './detalhes-carona.component';

describe('DetalhesCaronaComponent', () => {
  let component: DetalhesCaronaComponent;
  let fixture: ComponentFixture<DetalhesCaronaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetalhesCaronaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalhesCaronaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
