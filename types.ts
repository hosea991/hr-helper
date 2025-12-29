export interface Person {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  members: Person[];
}

export enum AppMode {
  INPUT = 'INPUT',
  DRAW = 'DRAW',
  GROUPS = 'GROUPS',
}
