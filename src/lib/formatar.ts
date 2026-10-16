/** Funções puras (testadas em tests/formatar.test.ts). */

export const MARCADOR_PRECO = '—,— €';
export const MARCADOR_HORAS = '—h — · —h —';
export const MARCADOR_DIAS = 'Dias —';
export const MARCADOR_TELEFONE = '+351 ——— ——— ———';

/** Preço em euros no formato português, ou o marcador se não estiver confirmado. */
export function formatarPreco(preco: number | null): string {
  if (preco === null) return MARCADOR_PRECO;
  return `${preco.toFixed(2).replace('.', ',')} €`;
}

/** Só dígitos e o "+" inicial; falha se o número for curto demais para ser real. */
function digitos(numero: string): string {
  const d = numero.replace(/\D/g, '');
  if (d.length < 9) throw new Error(`Número inválido: "${numero}". Usar o formato internacional.`);
  return d;
}

/** Link `tel:` ou `null` sem número confirmado (o botão fica desativado). */
export function linkTelefone(numero: string | null): string | null {
  if (numero === null) return null;
  return `tel:+${digitos(numero)}`;
}

/** Link do WhatsApp com mensagem pré-preenchida, ou `null` sem número confirmado. */
export function linkWhatsApp(numero: string | null, mensagem: string): string | null {
  if (numero === null) return null;
  return `https://wa.me/${digitos(numero)}?text=${encodeURIComponent(mensagem)}`;
}

/** Link de pesquisa do Google Maps (sem embed, sem chave). */
export function linkMapa(morada: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(morada)}`;
}

/** Data no formato AAAA-MM-DD no fuso local (não em UTC, como `toISOString`). */
export function dataLocalISO(data: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

/** Resumo da reserva simulada, ex.: "Ana, mesa para 4 pessoas, sábado, 7 de novembro, às 20:30." */
export function resumoReserva(nome: string, pessoas: string, diaISO: string, hora: string): string {
  const dia = new Date(`${diaISO}T00:00`).toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const quantas = pessoas === '1' ? '1 pessoa' : `${pessoas === '10' ? '10 ou mais' : pessoas} pessoas`;
  return `${nome.trim()}, mesa para ${quantas}, ${dia}, às ${hora}.`;
}
