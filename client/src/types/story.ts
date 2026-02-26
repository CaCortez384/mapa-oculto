export interface Story {
  id: number;
  content: string;
  category: Category;
  latitude: number;
  longitude: number;
  createdAt: string;
  likes: number;
}

export interface NewStoryLocation {
  latitude: number;
  longitude: number;
}

export type Category = 'Miedo' | 'Amor' | 'Crimen' | 'Curiosidad';

export const CATEGORIES: Category[] = ['Miedo', 'Amor', 'Crimen', 'Curiosidad'];

export interface StoryFormData {
  content: string;
  category: Category;
}
