// @flow

declare type SongStyles = {
  titulo: any,
  fuente: any,
  lineaNotas: any,
  lineaTituloNotaEspecial: any,
  lineaNotaEspecial: any,
  lineaNotasConMargen: any,
  lineaNormal: any,
  prefijo: any
};

declare type SongLine = {
  texto: string,
  style: any,
  prefijo: string,
  prefijoStyle: any,
  sufijo: string,
  sufijoStyle: any,
  canto: boolean,
  cantoConIndicador: boolean,
  notas: boolean,
  inicioParrafo: boolean,
  notaEspecial: boolean,
  tituloEspecial: boolean,
  textoEspecial: boolean
};

declare type SongFile = {
  nombre: string,
  titulo: string,
  fuente: string
};

declare type Song = {
  key: string,
  titulo: string,
  fuente: string,
  path: string,
  nombre: string,
  locale: string,
  files: any,
  fullText: string,
  lines: Array<string>,
  patchable?: boolean,
  patched?: boolean,
  patchedTitle?: string,
  error?: any
};

declare type SongRef = Song | SongFile;

declare type SearchParams = {
  filter: any,
  title_key?: string
};

declare type SearchItem = {
  title_key: string,
  divider?: boolean,
  note?: string,
  route?: string,
  params?: SearchParams,
  badge?: any,
  chooser?: string
};

declare type ListType = 'eucaristia' | 'palabra' | 'libre';
