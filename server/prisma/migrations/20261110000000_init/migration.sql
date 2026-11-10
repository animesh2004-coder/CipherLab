-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'CONTENT_ADMIN', 'PLATFORM_ADMIN');

-- CreateTable users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "externalId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable lessons
CREATE TABLE "lessons" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "readTime" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable quizzes
CREATE TABLE "quizzes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "passingScore" INTEGER NOT NULL DEFAULT 3,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable questions
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "quizId" UUID NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable question_options
CREATE TABLE "question_options" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "questionId" UUID NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable lesson_progress
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable quiz_attempts
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "gradedAnswers" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_events
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable idempotency_keys
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "response" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_externalId_key" ON "users"("externalId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_externalId_idx" ON "users"("externalId");
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");
CREATE INDEX "lessons_slug_idx" ON "lessons"("slug");
CREATE INDEX "lessons_sortOrder_idx" ON "lessons"("sortOrder");
CREATE INDEX "lessons_category_idx" ON "lessons"("category");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_slug_key" ON "quizzes"("slug");
CREATE INDEX "quizzes_slug_idx" ON "quizzes"("slug");

-- CreateIndex
CREATE INDEX "questions_quizId_idx" ON "questions"("quizId");
CREATE INDEX "questions_quizId_sortOrder_idx" ON "questions"("quizId", "sortOrder");

-- CreateIndex
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");
CREATE INDEX "question_options_questionId_sortOrder_idx" ON "question_options"("questionId", "sortOrder");

-- CreateIndex
CREATE INDEX "lesson_progress_userId_idx" ON "lesson_progress"("userId");
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");
CREATE UNIQUE INDEX "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_idempotencyKey_key" ON "quiz_attempts"("idempotencyKey");
CREATE INDEX "quiz_attempts_userId_quizId_idx" ON "quiz_attempts"("userId", "quizId");
CREATE INDEX "quiz_attempts_idempotencyKey_idx" ON "quiz_attempts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "audit_events_userId_idx" ON "audit_events"("userId");
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");
CREATE INDEX "audit_events_resourceType_resourceId_idx" ON "audit_events"("resourceType", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");
CREATE INDEX "idempotency_keys_key_idx" ON "idempotency_keys"("key");
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

