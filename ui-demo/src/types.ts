export type DocKind = 'comanda_materiale' | 'act_defectiune';

export type DocumentRow = {
  id: string;
  kind: DocKind;
  title: string;
  documentDate: string;
  createdAt: string;
};
