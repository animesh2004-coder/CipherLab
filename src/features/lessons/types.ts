export interface Lesson {
  id: string;
  title: string;
  shortSummary: string;
  readTime: string;
  category: 'fundamentals' | 'ciphers' | 'modern' | 'security';
  sections: {
    heading: string;
    content: string;
    keyTakeaway?: string;
    callout?: {
      type: 'tip' | 'warning' | 'info';
      title: string;
      text: string;
    };
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ComparisonItem {
  feature: string;
  blockCipher: string;
  streamCipher: string;
  explanation: string;
}

