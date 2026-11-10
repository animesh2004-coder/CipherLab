export interface StudentProgress {
  completedLessonIds: string[];
  quizAnswers: Record<string, number>; // questionId -> selectedIndex
  quizCompleted: boolean;
  quizScore: number;
  quizTotal: number;
  lastUpdated: string;
}

export const INITIAL_PROGRESS: StudentProgress = {
  completedLessonIds: [],
  quizAnswers: {},
  quizCompleted: false,
  quizScore: 0,
  quizTotal: 5,
  lastUpdated: new Date().toISOString(),
};

