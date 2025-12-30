export const c2_informant = {
  id: "c2",
  initialMessage: "Salve detective. Sono il Detective Rossi. Ho ricevuto informazioni che potrebbero interessarti sul caso 'Ombra'.",
  timeline: [
    {
      id: "event_c2_1",
      turnId: 2,
      type: "narrative",
      triggerAfter: null,
      messages: [
        "Detective, ho informazioni cruciali da condividere con te.",
        "Ma prima devo verificare che tu sia chi dici di essere."
      ]
    },
    {
      id: "event_c2_2",
      turnId: 2,
      type: "puzzle",
      preQuestion: "Per verificare la tua autorizzazione, rispondi: Qual è il tuo numero di distintivo? (risposta: detective badge)",
      maxAttempts: 3,
      penaltySeconds: 15,
      notification: {
        notificationContact: "c1",
        notificationMessage: "Hai ricevuto un messaggio dall'Informatore"
      },
      solution: {
        keywords: ["detective", "badge"],
        response: {
          text: "Autorizzazione confermata. Ecco le informazioni riservate sul caso 'Ombra'.",
          messageId: "msg_turn2_success",
          evidenceText: "Il distintivo numero 4782 appartiene all'agente speciale Luca Martini, attualmente sotto copertura nell'operazione 'shadow'.",
          mediaId: ["c2_m4"]
        }
      },
      hints: [
        "Il numero di distintivo è essenziale per l'accesso.",
        "Pensa alla tua identità di detective."
      ],
      fallbacks: [
        "Codice non riconosciuto.",
        "Accesso negato.",
        "Credenziali non valide."
      ]
    },
    {
      id: "event_c2_3",
      turnId: 2,
      type: "narrative",
      triggerAfter: "msg_turn2_success",
      messages: [
        "Perfetto. Ora possiamo lavorare insieme.",
        "Le cose stanno per diventare interessanti, detective."
      ]
    },
    {
      id: "event_c2_4",
      turnId: 5,
      type: "puzzle",
      preQuestion: "Per verificare la tua autorizzazione finale, rispondi: Qual è il tuo numero di distintivo? (risposta: detective badge)",
      maxAttempts: 3,
      penaltySeconds: 30,
      notification: {
        notificationContact: "c3",
        notificationMessage: "Hai ricevuto un messaggio dal risolutore"
      },
      solution: {
        keywords: ["detective", "badge"],
        response: {
          text: "Autorizzazione confermata. Ecco le informazioni riservate sul caso 'Ombra'.",
          messageId: "msg_turn5_success",
          evidenceText: "Il distintivo numero 4782 appartiene all'agente speciale Luca Martini, attualmente sotto copertura nell'operazione 'Ombra'."
        }
      },
      hints: [
        "Il numero di distintivo è essenziale per l'accesso.",
        "Ricorda la risposta precedente."
      ],
      fallbacks: [
        "Codice non riconosciuto.",
        "Accesso negato.",
        "Credenziali non valide."
      ]
    }
  ]
}
