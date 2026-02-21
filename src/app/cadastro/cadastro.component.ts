import { Component } from "@angular/core";

@Component({
  selector: "app-cadastro",
  templateUrl: "./cadastro.component.html",
  styleUrls: ["./cadastro.component.scss"],
})
export class CadastroComponent {
  step = 1;

  nextStep(): void {
    this.step = 2;
  }

  prevStep(): void {
    this.step = 1;
  }
}
