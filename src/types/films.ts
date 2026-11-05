export interface StoryBook {
  id: string;
  title: string;
  author: string;
  image: string;
  createdAt: number;
  expiresAt: number;
  dominantColor?: string;
  caption?: string;
  isAddCard?: boolean;
}
