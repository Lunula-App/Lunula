import { CyclePhase } from './cycle';

export type ArticleSectionType = 'heading' | 'paragraph' | 'bullet_list' | 'callout' | 'tip';

export interface ArticleSection {
  type: ArticleSectionType;
  text?: string;
  items?: string[];
}

export interface ArticleSource {
  label: string;
  url: string;
}

export interface Article {
  slug: string;
  phase: CyclePhase;
  title: string;
  summary: string;
  readTimeMinutes: number;
  content: ArticleSection[];
  tags: string[];
  sources: ArticleSource[];
}
