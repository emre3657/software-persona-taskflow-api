export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
