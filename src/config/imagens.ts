/**
 * Fotos do Wikimedia Commons, guardadas em src/assets/fotos. Créditos completos
 * em docs/CREDITOS-IMAGENS.md. Fotos ilustrativas: não são do restaurante.
 */
import type { ImageMetadata } from 'astro';
import arrozTamboril from '../assets/fotos/arroz-tamboril.jpg';
import borregoBrasa from '../assets/fotos/borrego-brasa.jpg';
import dourada from '../assets/fotos/dourada.jpg';
import polvoLagareiro from '../assets/fotos/polvo-lagareiro.jpg';
import polvoPrato from '../assets/fotos/polvo-prato.jpg';
import sardinhasGrelha from '../assets/fotos/sardinhas-grelha.jpg';
import sardinhasPrato from '../assets/fotos/sardinhas-prato.jpg';
import sardinhasVinho from '../assets/fotos/sardinhas-vinho.jpg';
import vinho from '../assets/fotos/vinho.jpg';

export type Foto = {
  ficheiro: string;
  src: ImageMetadata;
  alt: string;
  autor: string;
  licenca: string;
  fonte: string;
};

const CC0 = 'CC0';
const CC_BY_4 = 'CC BY 4.0';
const CC_BY_SA_4 = 'CC BY-SA 4.0';

export const fotos = {
  polvoLagareiro: {
    ficheiro: 'polvo-lagareiro.jpg',
    src: polvoLagareiro,
    alt: 'Polvo assado com alho e batatas, visto de perto',
    autor: 'August Dominus',
    licenca: CC0,
    fonte: 'https://commons.wikimedia.org/wiki/File:Polvo_%C3%A0_Lagareiro.jpg',
  },
  polvoPrato: {
    ficheiro: 'polvo-prato.jpg',
    src: polvoPrato,
    alt: 'Polvo com legumes verdes e batata num prato de barro',
    autor: 'August Dominus',
    licenca: CC0,
    fonte: 'https://commons.wikimedia.org/wiki/File:Polvo_%C3%A0_Lagareiro_u_Portu.jpg',
  },
  arrozTamboril: {
    ficheiro: 'arroz-tamboril.jpg',
    src: arrozTamboril,
    alt: 'Arroz de tamboril e camarão num tacho de barro',
    autor: 'Kolforn',
    licenca: CC_BY_SA_4,
    fonte: 'https://commons.wikimedia.org/wiki/File:Monkfish_and_shrimp_rice,_Olh%C3%A3o,_30_June_2015.JPG',
  },
  sardinhasVinho: {
    ficheiro: 'sardinhas-vinho.jpg',
    src: sardinhasVinho,
    alt: 'Quatro sardinhas assadas com batatas e um copo de vinho',
    autor: 'Renhour48',
    licenca: CC0,
    fonte: 'https://commons.wikimedia.org/wiki/File:4_sardines_grill%C3%A9es.jpg',
  },
  sardinhasGrelha: {
    ficheiro: 'sardinhas-grelha.jpg',
    src: sardinhasGrelha,
    alt: 'Sardinhas na grelha, sobre as brasas',
    autor: 'Joseolgon',
    licenca: CC_BY_SA_4,
    fonte: 'https://commons.wikimedia.org/wiki/File:Sardinhas_(1).jpg',
  },
  sardinhasPrato: {
    ficheiro: 'sardinhas-prato.jpg',
    src: sardinhasPrato,
    alt: 'Prato de sardinhas assadas com batatas e salada',
    autor: 'Duarte Briz',
    licenca: CC_BY_SA_4,
    fonte: 'https://commons.wikimedia.org/wiki/File:Sardinhas_assadas.jpg',
  },
  dourada: {
    ficheiro: 'dourada.jpg',
    src: dourada,
    alt: 'Dourada grelhada aberta num prato, com limão',
    autor: 'Viet-hoian1',
    licenca: CC_BY_SA_4,
    fonte: 'https://commons.wikimedia.org/wiki/File:Dourada_grelhada_em_Set%C3%BAbal.jpg',
  },
  borregoBrasa: {
    ficheiro: 'borrego-brasa.jpg',
    src: borregoBrasa,
    alt: 'Costeletas de borrego a grelhar sobre as chamas',
    autor: 'domdomegg',
    licenca: CC_BY_4,
    fonte: 'https://commons.wikimedia.org/wiki/File:Lamb_chops_on_the_barbecue_07.jpg',
  },
  vinho: {
    ficheiro: 'vinho.jpg',
    src: vinho,
    alt: 'Copo de vinho branco no balcão de uma tasca',
    autor: 'Sarah Stierch (Missvain)',
    licenca: CC_BY_4,
    fonte: 'https://commons.wikimedia.org/wiki/File:Vinho_Verde_at_Tasca_Tasca_-_Sarah_Stierch.jpg',
  },
} satisfies Record<string, Foto>;

/** Galeria: a primeira ocupa duas linhas e a última a largura toda. */
export const galeria: Foto[] = [fotos.sardinhasGrelha, fotos.dourada, fotos.sardinhasPrato, fotos.borregoBrasa];
