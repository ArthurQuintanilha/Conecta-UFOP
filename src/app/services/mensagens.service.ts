import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { Observable, firstValueFrom, combineLatest } from "rxjs";
import { map, distinctUntilChanged, debounceTime, tap } from "rxjs/operators";
import firebase from "firebase/compat/app";
import { UsuariosService } from "./usuarios.service";

/** ID do remetente para mensagens automáticas do sistema (aceite/recusa de solicitação). */
export const REMETENTE_SISTEMA = "SISTEMA";

/** Documento da collection Firestore "mensagens" — criadoEm é Timestamp, visualizado obrigatório. */
export interface MensagemDoc {
  id?: string;
  caronaId: string;
  remetenteId: string;
  destinatarioId: string;
  mensagem: string;
  criadoEm?: firebase.firestore.Timestamp | firebase.firestore.FieldValue;
  visualizado: boolean;
}

/** Item da listagem de conversas (sidebar). criadoEm em Date para exibição/ordenação. Sistema usa caronaId null. */
export interface ConversaListItem {
  caronaId: string | null;
  outroUsuarioId: string;
  outroUsuarioNome?: string;
  outroUsuarioAvatar?: string;
  ultimaMensagem: string;
  criadoEm: Date;
  caronaSubtitle?: string;
  lastMessageSentByMe?: boolean;
  /** Se a última mensagem foi enviada por mim e já foi vista pelo destinatário. */
  lastMessageVisualizado?: boolean;
}

/** Documento da collection Firestore "caronas" (campos usados no chat). dtPartida é Timestamp ou null. */
export interface CaronaDoc {
  status?: string;
  motoristaId?: string;
  recusados?: string[];
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

    /** Chave: para SISTEMA usamos só "SISTEMA" (caronaId null na lista); demais: caronaId + outroUsuarioId. */
    const byCaronaEOutro = new Map<
      string,
      { id: string; data: MensagemDoc; criadoEm: Date }
    >();
    for (const { id, data } of allDocs) {
      const outroUsuarioId =
        data.remetenteId === uid ? data.destinatarioId : data.remetenteId;
      const key =
        outroUsuarioId === REMETENTE_SISTEMA
          ? REMETENTE_SISTEMA
          : `${data.caronaId}\0${outroUsuarioId}`;
      const criadoEm = this.timestampToDate(data.criadoEm);
      const existing = byCaronaEOutro.get(key);
      if (!existing || criadoEm > existing.criadoEm) {
        byCaronaEOutro.set(key, { id, data, criadoEm });
      }
    }

    const result: ConversaListItem[] = [];
    for (const [, value] of byCaronaEOutro) {
      const { data, criadoEm } = value;
      const outroUsuarioId =
        data.remetenteId === uid ? data.destinatarioId : data.remetenteId;
      const isSistema = outroUsuarioId === REMETENTE_SISTEMA;

      let caronaData: CaronaDoc | undefined;
      if (!isSistema) {
        const caronaSnap = await this.ngFirestore.collection("caronas").doc(data.caronaId).ref.get();
        caronaData = caronaSnap.data() as CaronaDoc | undefined;
        if (caronaData?.status === "FINALIZADA") continue;
        const recusados = caronaData?.recusados ?? [];
        if (recusados.includes(uid)) continue;
        if (caronaData?.motoristaId === uid && recusados.includes(outroUsuarioId)) continue;
      }

      let outroUsuarioNome: string | undefined;
      let outroUsuarioAvatar: string | undefined;
      if (isSistema) {
        outroUsuarioNome = "Sistema";
        outroUsuarioAvatar = undefined;
      } else {
        try {
          const user = await this.usuariosService.getUser(outroUsuarioId) as { nome?: string; fotoUrl?: string };
          outroUsuarioNome = user.nome ?? "Usuário";
          outroUsuarioAvatar = user.fotoUrl;
        } catch {
          outroUsuarioNome = "Usuário";
        }
      }

      const caronaSubtitle = isSistema
        ? "Notificações de aceite/recusa"
        : this.formatCaronaSubtitle(caronaData);

      result.push({
        caronaId: isSistema ? null : data.caronaId,
        outroUsuarioId,
        outroUsuarioNome,
        outroUsuarioAvatar,
        ultimaMensagem: data.mensagem,
        criadoEm,
        caronaSubtitle,
        lastMessageSentByMe: data.remetenteId === uid,
        lastMessageVisualizado: data.remetenteId === uid ? data.visualizado === true : undefined,
      });
    }

    result.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
    return result;
  }

  /**
   * Stream de mensagens: por carona e interlocutor, ou só conversa com SISTEMA (caronaId null).
   * Para conversa Sistema (caronaId null, outroUsuarioId SISTEMA) não filtra por carona.
   */
  getMensagensPorCarona(
    caronaId: string | null,
    uid: string,
    outroUsuarioId?: string
  ): Observable<(MensagemDoc & { id: string })[]> {
    const asMensagem = (c: { payload: { doc: { id: string; data: () => MensagemDoc } } }) => {
      const data = c.payload.doc.data();
      return { id: c.payload.doc.id, ...data } as MensagemDoc & { id: string };
    };

    const isConversaSistema = caronaId === null && outroUsuarioId === REMETENTE_SISTEMA;

    if (isConversaSistema) {
      const sistema$ = this.ngFirestore
        .collection<MensagemDoc>("mensagens", (ref) =>
          ref
            .where("remetenteId", "==", REMETENTE_SISTEMA)
            .where("destinatarioId", "==", uid)
            .orderBy("criadoEm", "asc")
        )
        .snapshotChanges()
        .pipe(
          map((changes) => changes.map(asMensagem)),
          map((docs) =>
            docs.sort((x, y) => {
              const tx = this.timestampToDate(x.criadoEm).getTime();
              const ty = this.timestampToDate(y.criadoEm).getTime();
              const txs = tx <= 0 ? Number.MAX_SAFE_INTEGER : tx;
              const tys = ty <= 0 ? Number.MAX_SAFE_INTEGER : ty;
              return txs - tys;
            })
          ),
          debounceTime(50),
          distinctUntilChanged((prev, curr) => {
            if (prev.length !== curr.length) return false;
            return prev.every((p, i) => p.id === curr[i]?.id);
          })
        );
      return sistema$;
    }

    const remetenteRef = (ref: firebase.firestore.CollectionReference | firebase.firestore.Query) => {
      let q = ref
        .where("caronaId", "==", caronaId)
        .where("remetenteId", "==", uid)
        .orderBy("criadoEm", "asc");
      if (outroUsuarioId) {
        q = q.where("destinatarioId", "==", outroUsuarioId) as firebase.firestore.Query;
      }
      return q;
    };
    const destinatarioRef = (ref: firebase.firestore.CollectionReference | firebase.firestore.Query) => {
      let q = ref
        .where("caronaId", "==", caronaId)
        .where("destinatarioId", "==", uid)
        .orderBy("criadoEm", "asc");
      if (outroUsuarioId) {
        q = q.where("remetenteId", "==", outroUsuarioId) as firebase.firestore.Query;
      }
      return q;
    };

    const remetente$ = this.ngFirestore
      .collection<MensagemDoc>("mensagens", (ref) => remetenteRef(ref))
      .snapshotChanges()
      .pipe(map((changes) => changes.map(asMensagem)));

    const destinatario$ = this.ngFirestore
      .collection<MensagemDoc>("mensagens", (ref) => destinatarioRef(ref))
      .snapshotChanges()
      .pipe(map((changes) => changes.map(asMensagem)));

    return combineLatest([remetente$, destinatario$]).pipe(
      map(([a, b]) => {
        const byId = new Map<string, MensagemDoc & { id: string }>();
        [...a, ...b].forEach((doc) => byId.set(doc.id, doc));
        return Array.from(byId.values()).sort((x, y) => {
          const tx = this.timestampToDate(x.criadoEm).getTime();
          const ty = this.timestampToDate(y.criadoEm).getTime();
          // Mensagens sem timestamp (serverTimestamp não resolvido) vão para o fim, evitando ordem errada ao enviar
          const txs = tx <= 0 ? Number.MAX_SAFE_INTEGER : tx;
          const tys = ty <= 0 ? Number.MAX_SAFE_INTEGER : ty;
          return txs - tys;
        });
      }),
      debounceTime(50),
      distinctUntilChanged((prev, curr) => {
        if (prev.length !== curr.length) return false;
        return prev.every((p, i) => p.id === curr[i]?.id);
      })
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
      visualizado: false,
    });
  }

  /**
   * Envia mensagem como SISTEMA (ex.: notificação de aceite/recusa). Só pode ser chamada pelo motorista da carona;
   * as regras do Firestore validam remetenteId == "SISTEMA" e motoristaId da carona == auth.uid.
   */
  async enviarMensagemSistema(
    caronaId: string,
    destinatarioId: string,
    texto: string
  ): Promise<void> {
    await this.ngFirestore.collection("mensagens").add({
      caronaId,
      remetenteId: REMETENTE_SISTEMA,
      destinatarioId,
      mensagem: texto.trim(),
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      visualizado: false,
    });
  }

  /**
   * Marca como vistas as mensagens enviadas para o destinatário (usuário logado) que ainda estão com visualizado = false.
   * Para conversa Sistema (caronaId null), não filtra por carona. Se remetenteId for informado, marca apenas daquela conversa.
   */
  async marcarMensagensComoVistas(
    caronaId: string | null,
    destinatarioId: string,
    remetenteId?: string
  ): Promise<void> {
    let query = this.ngFirestore.collection("mensagens").ref
      .where("destinatarioId", "==", destinatarioId)
      .where("visualizado", "==", false) as firebase.firestore.Query;
    if (caronaId != null) {
      query = query.where("caronaId", "==", caronaId);
    }
    if (remetenteId) {
      query = query.where("remetenteId", "==", remetenteId);
    }
    const snap = await query.get();

    const batch = this.ngFirestore.firestore.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { visualizado: true });
    });
    if (!snap.empty) {
      await batch.commit();
      console.log("[MensagensService] marcarMensagensComoVistas: atualizadas", snap.size, "mensagem(ns)");
    }
  }

  /**
   * Observable com a quantidade de mensagens não lidas para o usuário (destinatário, visualizado === false).
   * Atualizado em tempo real pelo Firestore.
   */
  getUnreadCount(uid: string): Observable<number> {
    return this.ngFirestore
      .collection<MensagemDoc>("mensagens", (ref) =>
        ref
          .where("destinatarioId", "==", uid)
          .where("visualizado", "==", false)
      )
      .snapshotChanges()
      .pipe(
        tap((changes) => {
          console.log("[MensagensService] getUnreadCount: snapshot recebido", {
            uid,
            quantidade: changes.length,
          });
        }),
        map((changes) => changes.length)
      );
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
   * Verifica se o usuário pode acessar o chat da carona: carona não finalizada e usuário não está em recusados.
   * Usar antes de exibir ou selecionar conversa com essa carona.
   */
  async canAcessarChatCarona(caronaId: string, uid: string): Promise<boolean> {
    const snap = await this.ngFirestore.collection("caronas").doc(caronaId).ref.get();
    const data = snap.data() as CaronaDoc | undefined;
    if (!data) return false;
    if (data.status === "FINALIZADA") return false;
    const recusados = data.recusados ?? [];
    if (recusados.includes(uid)) return false;
    return true;
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
