export interface Person {
  _id: string;
  name: string;
  createdAt: string;
}

export interface Site {
  _id: string;
  address: string;
  title: string;
  html?: string;
  textContent?: string;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type VisitSource =
  | "typed"
  | "link"
  | "back"
  | "forward"
  | "history"
  | "search";

export interface Visit {
  _id: string;
  personId: string;
  address: string;
  title: string;
  visitedAt: string;
  source: VisitSource;
}

export interface ApiResponse<T> {
  data: T;
}
