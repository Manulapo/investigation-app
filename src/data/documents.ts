import type { Document } from '../types'

export const documents: Document[] = [
  {
    id: "d1",
    type: "image",
    src: "https://picsum.photos/300/200?random=10",
    alt: "Rapporto Preliminare",
    initial: true
  },
  {
    id: "d2",
    type: "pdf",
    src: "https://example.com/document.pdf",
    alt: "Verbale Interrogatorio",
    initial: true
  },
  {
    id: "d3",
    type: "image",
    src: "https://picsum.photos/300/200?random=11",
    alt: "Foto Scena Crimine",
    initial: true
  },
  {
    id: "c1_m1",
    type: "image",
    src: "https://picsum.photos/300/200?random=1",
    triggerMessageId: "msg_turn1_success",
    contactId: "c1",
    initial: false
  },
  {
    id: "c1_m2",
    type: "image",
    src: "https://picsum.photos/300/200?random=2",
    triggerMessageId: "msg_turn3_success",
    contactId: "c1",
    initial: false
  },
  {
    id: "c1_m3",
    type: "image",
    src: "https://picsum.photos/300/200?random=3",
    triggerMessageId: "msg_turn3_success",
    contactId: "c1",
    initial: false
  },
  {
    id: "c1_m4",
    type: "image",
    src: "https://picsum.photos/300/200?random=4",
    triggerMessageId: "msg_turn3_success",
    contactId: "c1",
    initial: false
  },
  {
    id: "c1_m5",
    type: "audio",
    src: "https://drive.google.com/file/d/1dZ4mMLld8fQgPR_pxZmMb-tP2Q1cnBIr/view?usp=drive_link",
    triggerMessageId: "msg_turn3_success",
    contactId: "c1",
    initial: false
  },
  {
    id: "c2_m1",
    type: "image",
    src: "https://picsum.photos/300/200?random=7",
    triggerMessageId: "msg_turn1_success",
    contactId: "c2",
    initial: false
  },
  {
    id: "c2_m2",
    type: "image",
    src: "https://picsum.photos/300/200?random=8",
    triggerMessageId: "msg_turn3_success",
    contactId: "c2",
    initial: false
  },
  {
    id: "c2_m3",
    type: "image",
    src: "https://picsum.photos/300/200?random=9",
    triggerMessageId: "msg_turn1_success",
    contactId: "c2",
    initial: false
  },
  {
    id: "c2_m4",
    type: "pdf",
    src: "https://drive.google.com/file/d/1oOMEqMMoQQ_5o1vHhYknI_l3l8mlTB43/view?usp=drive_link",
    alt: "Rapporto Investigativo Caso Ombra",
    contactId: "c2",
    initial: false
  },
  {
    id: "c3_m1",
    type: "image",
    src: "https://picsum.photos/300/200?random=10",
    triggerMessageId: "msg_turn4_success",
    contactId: "c3",
    initial: false
  }
]
