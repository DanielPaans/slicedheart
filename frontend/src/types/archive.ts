export type Category = 'songs' | 'thoughts' | 'memories' | 'unknown';
export type IntentType = 'feel' | 'forget' | 'loud' | 'unknown';

export interface FragmentItem {
  id: string;
  code: string;
  title: string;
  category: string;
  recovered: string;
  integrity: number;
  tag: string;
  type?: 'SINGLE' | 'EP' | 'ALBUM';
  coverArt?: string | null;
  spotify: string | null;
  spotifyLink: string;
  note?: string;
  scrawl?: string;
}
