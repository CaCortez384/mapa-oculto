export interface Story {
  id: number;
  content: string;
  category: Category;
  latitude: number;
  longitude: number;
  createdAt: string;
  likes: number;
  reactions: ReactionCounts;
}

export interface NewStoryLocation {
  latitude: number;
  longitude: number;
}

export type Category = 'Miedo' | 'Amor' | 'Crimen' | 'Curiosidad';

export const CATEGORIES: Category[] = ['Miedo', 'Amor', 'Crimen', 'Curiosidad'];

export type ReactionType = 'shock' | 'sad' | 'fire' | 'laugh' | 'love';

export const REACTION_TYPES: ReactionType[] = ['shock', 'sad', 'fire', 'laugh', 'love'];

export interface ReactionCounts {
  shock: number;
  sad: number;
  fire: number;
  laugh: number;
  love: number;
}

export const REACTION_EMOJI: Record<ReactionType, string> = {
  shock: '😱',
  sad: '😢',
  fire: '🔥',
  laugh: '😂',
  love: '❤️',
};

export interface StoryFormData {
  content: string;
  category: Category;
}
