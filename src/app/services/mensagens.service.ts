import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { Observable, firstValueFrom } from "rxjs";
import { map } from "rxjs/operators";
import firebase from "firebase/compat/app";
import { UsuariosService } from "./usuarios.service";

/** Documento da collection Firestore "mensagens" — criadoEm é Timestamp. */
export interface MensagemDoc {
  id?: string;
  caronaId: string;
  remetenteId: string;
  destinatarioId: string;
  mensagem: string;
  criadoEm?: firebase.firestore.Timestamp | firebase.firestore.FieldValue;
}

/** Item da listagem de conversas (sidebar). criadoEm em Date para exibição/ordenação. */
export interface ConversaListItem {
  caronaId: string;
  outroUsuarioId: string;
  outroUsuarioNome?: string;
  outroUsuarioAvatar?: string;
  ultimaMensagem: string;
  criadoEm: Date;
  caronaSubtitle?: string;
  lastMessageSentByMe?: boolean;
}

/** Documento da collection Firestore "caronas" (campos usados no chat). dtPartida é Timestamp ou null. */
export interface CaronaDoc {
  status?: string;
  origem?: { nome?: string; nomeLocal?: string; cidade?: string; [key: string]: unknown };
  destino?: { nome?: string; nomeLocal?: string; cidade?: string; [key: string]: unknown };
  dtPartida?: firebase.firestore.Timestamp | null;
  [key: string]: unknown;
}

@Injectable({
  providedIn: "root",
})
export class MensagensService {
  constructor(
    private ngFirestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private usuariosService: UsuariosService
  ) {}

  /**
   * Retorna lista de conversas do usuário: pelo menos uma mensagem e carona não finalizada.
   */
  async getConversas(uid: string): Promise<ConversaListItem[]> {
    const mensagensRef = this.ngFirestore.collection("mensagens");

    const [snapRemetente, snapDestinatario] = await Promise.all([
      mensagensRef.ref.where("remetenteId", "==", uid).orderBy("criadoEm", "desc").get(),
      mensagensRef.ref.where("destinatarioId", "==", uid).orderBy("criadoEm", "desc").get(),
    ]);

    const allDocs: { id: string; data: MensagemDoc }[] = [];
    snapRemetente.docs.forEach((d) =>
      allDocs.push({ id: d.id, data: d.data() as MensagemDoc })
    );
    snapDestinatario.docs.forEach((d) =>
      allDocs.push({ id: d.id, data: d.data() as MensagemDoc })
    );

    const byCarona = new Map<
      string,
      { id: string; data: MensagemDoc; criadoEm: Date }
    >();
    for (const { id, data } of allDocs) {
      const caronaId = data.caronaId;
      const criadoEm = this.timestampToDate(data.criadoEm);
      const existing = byCarona.get(caronaId);
      if (!existing || criadoEm > existing.criadoEm) {
        byCarona.set(caronaId, { id, data, criadoEm });
      }
    }

    const result: ConversaListItem[] = [];
    for (const [, value] of byCarona) {
      const { data, criadoEm } = value;
      const caronaSnap = await this.ngFirestore.collection("caronas").doc(data.caronaId).ref.get();
      const caronaData = caronaSnap.data() as CaronaDoc | undefined;
      if (caronaData?.status === "FINALIZADA") continue;

      const outroUsuarioId =
        data.remetenteId === uid ? data.destinatarioId : data.remetenteId;
      let outroUsuarioNome: string | undefined;
      let outroUsuarioAvatar: string | undefined;
      try {
        const user = await this.usuariosService.getUser(outroUsuarioId) as { nome?: string; fotoUrl?: string };
        outroUsuarioNome = user.nome ?? "Usuário";
        outroUsuarioAvatar = user.fotoUrl;
      } catch {
        outroUsuarioNome = "Usuário";
      }

      const caronaSubtitle = this.formatCaronaSubtitle(caronaData);

      result.push({
        caronaId: data.caronaId,
        outroUsuarioId,
        outroUsuarioNome,
        outroUsuarioAvatar,
        ultimaMensagem: data.mensagem,
        criadoEm,
        caronaSubtitle,
        lastMessageSentByMe: data.remetenteId === uid,
      });
    }

    result.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
    return result;
  }

  /**
   * Stream de mensagens de uma carona em tempo real.
   */
  getMensagensPorCarona(caronaId: string): Observable<MensagemDoc[]> {
    return this.ngFirestore
      .collection<MensagemDoc>("mensagens", (ref) =>
        ref.where("caronaId", "==", caronaId).orderBy("criadoEm", "asc")
      )
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => {
            const data = c.payload.doc.data();
            return { id: c.payload.doc.id, ...data } as MensagemDoc & { id: string };
          })
        )
      );
  }

  /**
   * Envia uma mensagem. remetenteId = usuário logado.
   */
  async enviarMensagem(
    caronaId: string,
    destinatarioId: string,
    texto: string
  ): Promise<void> {
    const user = await firstValueFrom(this.afAuth.authState);
    if (!user) throw new Error("Usuário não autenticado");

    await this.ngFirestore.collection("mensagens").add({
      caronaId,
      remetenteId: user.uid,
      destinatarioId,
      mensagem: texto.trim(),
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Verifica se a carona está finalizada (status === "FINALIZADA").
   */
  async isCaronaFinalizada(caronaId: string): Promise<boolean> {
    const snap = await this.ngFirestore.collection("caronas").doc(caronaId).ref.get();
    const data = snap.data() as CaronaDoc | undefined;
    return data?.status === "FINALIZADA";
  }

  /**
   * Stream do status da carona em tempo real. Emite true quando status === "FINALIZADA".
   */
  watchCaronaStatus(caronaId: string): Observable<boolean> {
    return this.ngFirestore
      .collection("caronas")
      .doc(caronaId)
      .snapshotChanges()
      .pipe(
        map((action) => {
          const data = action.payload.data() as CaronaDoc | undefined;
          return data?.status === "FINALIZADA";
        })
      );
  }

  /** Converte Timestamp do Firestore em Date. FieldValue (ex.: serverTimestamp) não é convertível na leitura. */
  private timestampToDate(
    v: firebase.firestore.Timestamp | firebase.firestore.FieldValue | undefined
  ): Date {
    if (!v || !(v instanceof firebase.firestore.Timestamp)) return new Date(0);
    return v.toDate();
  }

  private formatCaronaSubtitle(carona: CaronaDoc | undefined): string {
    if (!carona) return "Carona";
    const o = carona.origem;
    const d = carona.destino;
    const origemStr = o?.nome || o?.nomeLocal || o?.cidade || "Origem";
    const destinoStr = d?.nome || d?.nomeLocal || d?.cidade || "Destino";
    let dt = "";
    const raw = carona.dtPartida;
    if (raw instanceof firebase.firestore.Timestamp) {
      dt = raw.toDate().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return dt ? `${origemStr} → ${destinoStr} — ${dt}` : `${origemStr} → ${destinoStr}`;
  }
}
