import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { CadastroComponent } from "./cadastro/cadastro.component";
import { CaronasComponent } from "./caronas/caronas.component";
import { UserProfileComponent } from "./user-profile/user-profile.component";
import { RecuperarSenhaComponent } from './recuperar-senha/recuperar-senha.component'; /*Nova página recuperar senha*/
import { MinhasCaronasComponent } from "./minhas-caronas/minhas-caronas.component";

const routes: Routes = [
  { path: "login", component: LoginComponent },
  { path: "cadastro", component: CadastroComponent },
  { path: "caronas", component: CaronasComponent },
  { path: "perfil", component: UserProfileComponent },
  { path: "", redirectTo: "/login", pathMatch: "full" },
  { path: 'recuperar-senha', component: RecuperarSenhaComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: "minhas-caronas", component: MinhasCaronasComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
