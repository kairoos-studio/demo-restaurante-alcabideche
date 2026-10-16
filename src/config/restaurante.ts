/**
 * Único ficheiro a editar para personalizar a demo.
 *
 * Tudo o que está a `null` aparece no site como marcador discreto
 * [POR CONFIRMAR] (ex.: "—,— €"). Não preencher com valores inventados: só com
 * dados confirmados pelo restaurante.
 */

export const restaurante = {
  nome: 'A Ponte',
  tipo: 'Restaurante',
  mote: 'Cozinha portuguesa de família, em Alvide.',
  zona: 'Alvide, Alcabideche',

  morada: {
    rua: 'Rua de São Bernardo',
    codigoPostal: '2755-069 Alcabideche',
  },

  /** [POR CONFIRMAR: telefone] Ex.: '+351 2XX XXX XXX'. Com número, o botão "Ligar" fica ativo. */
  telefone: null as string | null,

  /**
   * [POR CONFIRMAR: WhatsApp] Formato internacional, só dígitos (ex.: '351XXXXXXXXX').
   * Enquanto for `null`, o botão aparece desativado com a nota "por confirmar".
   */
  whatsapp: null as string | null,

  /** Mensagem pré-preenchida do botão de WhatsApp. */
  mensagemReserva: 'Olá! Gostava de reservar uma mesa n\'A Ponte.\nDia: \nHora: \nPessoas: \nNome: ',

  /**
   * [POR CONFIRMAR: horário] Um único bloco de horário.
   * `dias` e `horas` a `null` aparecem como marcadores.
   */
  horario: [
    { dias: null, horas: null },
    { dias: null, horas: null },
    { dias: null, horas: null },
  ] as { dias: string | null; horas: string | null }[],

  /** [POR CONFIRMAR: horário] Dia de descanso, se houver. */
  descanso: null as string | null,

  /** Serviços referidos em dados públicos (a reconfirmar antes de publicar). */
  servicos: ['Ar condicionado', 'Estacionamento', 'Wi-fi gratuito', 'Acessível', 'MB Way e cartões'],
} as const;

export type ItemMenu = {
  nome: string;
  descricao: string;
  /** [POR CONFIRMAR: preço] em euros, ex.: 12.5. `null` mostra "—,— €". */
  preco: number | null;
};

export type ChaveFoto = 'polvoPrato' | 'arrozTamboril' | 'sardinhasVinho';

/** Os três da casa, com foto. Pratos referidos em avaliações públicas. */
export const destaques: (ItemMenu & { foto: ChaveFoto; nota: string })[] = [
  {
    nome: 'Polvo',
    descricao: 'À portuguesa, com batata e um fio de azeite.',
    preco: null,
    foto: 'polvoPrato',
    nota: 'Elogiado nas avaliações',
  },
  {
    nome: 'Arroz de tamboril',
    descricao: 'Malandrinho, servido no tacho, para partilhar.',
    preco: null,
    foto: 'arrozTamboril',
    nota: 'Dá para três pessoas',
  },
  {
    nome: 'Sardinhas',
    descricao: 'Assadas na brasa, como manda a tradição.',
    preco: null,
    foto: 'sardinhasVinho',
    nota: 'Clássico português',
  },
];

export const menu: { titulo: string; itens: ItemMenu[] }[] = [
  {
    titulo: 'Do mar',
    itens: [
      { nome: 'Peixe fresco do dia', descricao: 'Grelhado, conforme o que houver.', preco: null },
      { nome: 'Paella', descricao: 'Para partilhar.', preco: null },
    ],
  },
  {
    titulo: 'Da brasa',
    itens: [
      { nome: 'Costeleta de borrego', descricao: 'Grelhada na brasa.', preco: null },
      { nome: 'Carnes grelhadas', descricao: 'Cortes a confirmar.', preco: null },
    ],
  },
  {
    titulo: 'Para acompanhar',
    itens: [{ nome: 'Vinho a copo', descricao: 'Da casa.', preco: null }],
  },
];
