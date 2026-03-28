export interface Tag {
  id: string;
  name: string;
  color: string | null;
  sortOrder?: number;
}

export interface Todo {
  id: string;
  title: string;
  completed: number;
  date: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  recurringId?: string | null;
  tags: Tag[];
}
