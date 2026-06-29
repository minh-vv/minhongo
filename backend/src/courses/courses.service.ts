import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LessonStatus, LessonDeckRole, Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // ========== COURSE LISTING ==========

  /** Danh sách tất cả course công khai. Nếu có userId → kèm trạng thái enroll. */
  async listCourses(userId?: string) {
    const courses = await this.prisma.course.findMany({
      where: { isPublic: true },
      orderBy: [{ jlptLevel: 'desc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { lessons: true } },
      },
    });

    if (!userId) {
      return courses.map((c) => ({ ...c, enrolled: false }));
    }

    const enrolls = await this.prisma.userCourseProgress.findMany({
      where: { userId, courseId: { in: courses.map((c) => c.id) } },
    });
    const enrollMap = new Map(enrolls.map((e) => [e.courseId, e]));

    return courses.map((c) => {
      const enroll = enrollMap.get(c.id);
      return {
        ...c,
        enrolled: !!enroll,
        targetDate: enroll?.targetDate ?? null,
        goal: enroll?.goal ?? null,
      };
    });
  }

  /** Chi tiết course + lessons (kèm lock/progress nếu có userId) */
  async getCourseBySlug(slug: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            test: true,
            decks: {
              include: {
                deck: { include: { _count: { select: { cards: true } } } },
              },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Lộ trình không tồn tại');

    let progressMap = new Map<
      string,
      { status: LessonStatus; score: number | null }
    >();
    let enroll: Awaited<
      ReturnType<typeof this.prisma.userCourseProgress.findUnique>
    > = null;

    if (userId) {
      enroll = await this.prisma.userCourseProgress.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });
      const progress = await this.prisma.userLessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: course.lessons.map((l) => l.id) },
        },
      });
      progressMap = new Map(progress.map((p) => [p.lessonId, p]));
    }

    // Tính lock state: bài N unlocked nếu bài N-1 đã PASSED (hoặc N = first)
    let prevPassed = true; // bài đầu tiên luôn unlocked
    const lessons = course.lessons.map((lesson) => {
      const p = progressMap.get(lesson.id);
      const status = p?.status ?? LessonStatus.NOT_STARTED;
      const locked = !prevPassed && status === LessonStatus.NOT_STARTED;
      const result = {
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        summary: lesson.summary,
        skills: lesson.skills,
        estimatedMin: lesson.estimatedMin,
        hasTest: !!lesson.test,
        deckCount: lesson.decks.length,
        cardCount: lesson.decks.reduce(
          (sum, d) => sum + (d.deck._count?.cards ?? 0),
          0,
        ),
        status,
        score: p?.score ?? null,
        locked,
      };
      // Cập nhật prevPassed cho lesson tiếp theo
      if (status === LessonStatus.PASSED) prevPassed = true;
      else prevPassed = false;
      return result;
    });

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      jlptLevel: course.jlptLevel,
      textbookRef: course.textbookRef,
      isDefault: course.isDefault,
      totalLessons: course.lessons.length,
      enrolled: !!enroll,
      targetDate: enroll?.targetDate ?? null,
      goal: enroll?.goal ?? null,
      lessons,
    };
  }

  // ========== ENROLLMENT ==========

  async enroll(
    slug: string,
    userId: string,
    dto: { targetDate?: string; goal?: string },
  ) {
    const course = await this.prisma.course.findUnique({ where: { slug } });
    if (!course) throw new NotFoundException('Lộ trình không tồn tại');

    const targetDate = dto.targetDate ? new Date(dto.targetDate) : null;

    const enroll = await this.prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: { targetDate, goal: dto.goal, isActive: true },
      create: {
        userId,
        courseId: course.id,
        targetDate,
        goal: dto.goal,
      },
    });

    // Đánh dấu user đã onboarded
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardedAt: new Date() },
    });

    return enroll;
  }

  /** Các course user đã enroll, kèm tóm tắt tiến độ */
  async myCourses(userId: string) {
    const enrolls = await this.prisma.userCourseProgress.findMany({
      where: { userId, isActive: true },
      include: {
        course: { include: { _count: { select: { lessons: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (enrolls.length === 0) return [];

    const lessonProgress = await this.prisma.userLessonProgress.groupBy({
      by: ['lessonId'],
      where: {
        userId,
        status: LessonStatus.PASSED,
        lesson: { courseId: { in: enrolls.map((e) => e.courseId) } },
      },
      _count: true,
    });
    // groupBy chỉ trả về lessonId; ta cần tính passed per course → query lại với lessons relation
    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonProgress.map((lp) => lp.lessonId) } },
      select: { id: true, courseId: true },
    });
    const passedByCourse = new Map<string, number>();
    for (const lesson of lessons) {
      passedByCourse.set(
        lesson.courseId,
        (passedByCourse.get(lesson.courseId) ?? 0) + 1,
      );
    }

    return enrolls.map((e) => ({
      courseId: e.courseId,
      slug: e.course.slug,
      title: e.course.title,
      jlptLevel: e.course.jlptLevel,
      totalLessons: e.course._count.lessons,
      passedLessons: passedByCourse.get(e.courseId) ?? 0,
      startedAt: e.startedAt,
      targetDate: e.targetDate,
      goal: e.goal,
    }));
  }

  // ========== LESSON ==========

  async getLessonById(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: { select: { id: true, slug: true, title: true } },
        decks: {
          orderBy: { order: 'asc' },
          include: {
            deck: {
              include: { _count: { select: { cards: true } } },
            },
          },
        },
        test: {
          include: {
            deck: { include: { _count: { select: { cards: true } } } },
          },
        },
      },
    });

    if (!lesson) throw new NotFoundException('Bài học không tồn tại');

    // Kiểm tra lock — phải pass bài trước đó (theo order)
    if (lesson.order > 1) {
      const prevLesson = await this.prisma.lesson.findFirst({
        where: { courseId: lesson.courseId, order: lesson.order - 1 },
        select: { id: true },
      });
      if (prevLesson) {
        const prevProgress = await this.prisma.userLessonProgress.findUnique({
          where: { userId_lessonId: { userId, lessonId: prevLesson.id } },
        });
        if (prevProgress?.status !== LessonStatus.PASSED) {
          throw new BadRequestException(
            'Bạn cần hoàn thành bài trước đó để mở khóa bài này',
          );
        }
      }
    }

    const progress = await this.prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    return {
      id: lesson.id,
      order: lesson.order,
      title: lesson.title,
      summary: lesson.summary,
      skills: lesson.skills,
      theoryMd: lesson.theoryMd,
      estimatedMin: lesson.estimatedMin,
      course: lesson.course,
      decks: lesson.decks.map((ld) => ({
        deckId: ld.deck.id,
        name: ld.deck.name,
        category: ld.deck.category,
        role: ld.role,
        cardCount: ld.deck._count.cards,
      })),
      test: lesson.test
        ? {
            id: lesson.test.id,
            deckId: lesson.test.deckId,
            passScore: lesson.test.passScore,
            questionCount: lesson.test.questionCount,
            poolSize: lesson.test.deck._count.cards,
          }
        : null,
      progress: progress
        ? {
            status: progress.status,
            score: progress.score,
            attemptCount: progress.attemptCount,
            startedAt: progress.startedAt,
            completedAt: progress.completedAt,
          }
        : { status: LessonStatus.NOT_STARTED, score: null, attemptCount: 0 },
    };
  }

  /** Bài học kế tiếp cần học của user — dựa trên course đang active gần nhất */
  async getCurrentLesson(userId: string) {
    const activeEnroll = await this.prisma.userCourseProgress.findFirst({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                title: true,
                estimatedMin: true,
                skills: true,
              },
            },
          },
        },
      },
    });

    const latestCustomRoadmap = await this.prisma.customRoadmap.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        phases: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { order: 'asc' },
              include: {
                lesson: {
                  select: {
                    id: true,
                    order: true,
                    title: true,
                    estimatedMin: true,
                    skills: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let useCustom = false;
    if (latestCustomRoadmap) {
      if (!activeEnroll) {
        useCustom = true;
      } else {
        useCustom = latestCustomRoadmap.updatedAt > activeEnroll.updatedAt;
      }
    }

    if (useCustom && latestCustomRoadmap) {
      const allItems = latestCustomRoadmap.phases.flatMap((p) => p.items);
      const nextItem = allItems.find((item) => !item.isCompleted);

      if (!nextItem) {
        return {
          courseSlug: `custom-${latestCustomRoadmap.id}`,
          courseTitle: latestCustomRoadmap.title,
          finished: true,
          lesson: null,
          isCustom: true,
        };
      }

      const dayIndex = allItems.indexOf(nextItem);
      const dayNum = dayIndex + 1;

      return {
        courseSlug: `custom-${latestCustomRoadmap.id}`,
        courseTitle: latestCustomRoadmap.title,
        finished: false,
        lesson: {
          id: nextItem.lessonId ?? null,
          order: dayNum,
          title: nextItem.customTitle || nextItem.lesson?.title || `Ngày ${dayNum}`,
          skills: nextItem.lesson?.skills ?? [],
          estimatedMin: nextItem.lesson?.estimatedMin ?? 30,
          status: 'NOT_STARTED',
          customRoadmapId: latestCustomRoadmap.id,
        },
        isCustom: true,
        pace: null,
      };
    }

    if (!activeEnroll) return null;

    const lessonIds = activeEnroll.course.lessons.map((l) => l.id);
    const progress = await this.prisma.userLessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    const progMap = new Map(progress.map((p) => [p.lessonId, p]));

    // Tìm bài đầu tiên chưa PASSED
    const next = activeEnroll.course.lessons.find(
      (l) => progMap.get(l.id)?.status !== LessonStatus.PASSED,
    );

    if (!next) {
      // Đã pass hết
      return {
        courseSlug: activeEnroll.course.slug,
        courseTitle: activeEnroll.course.title,
        finished: true,
        lesson: null,
      };
    }

    const status = progMap.get(next.id)?.status ?? LessonStatus.NOT_STARTED;

    return {
      courseSlug: activeEnroll.course.slug,
      courseTitle: activeEnroll.course.title,
      finished: false,
      lesson: {
        id: next.id,
        order: next.order,
        title: next.title,
        skills: next.skills,
        estimatedMin: next.estimatedMin,
        status,
      },
      pace: this.computePace(activeEnroll, lessonIds.length, progress),
    };
  }

  /** Tính tốc độ học cần thiết để đạt deadline */
  private computePace(
    enroll: { startedAt: Date; targetDate: Date | null },
    totalLessons: number,
    progress: { status: LessonStatus }[],
  ) {
    if (!enroll.targetDate) return null;

    const passed = progress.filter(
      (p) => p.status === LessonStatus.PASSED,
    ).length;
    const remaining = totalLessons - passed;
    const now = new Date();
    const daysLeft = Math.max(
      1,
      Math.ceil(
        (enroll.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const lessonsPerWeek = Math.ceil((remaining / daysLeft) * 7);
    const overdue =
      enroll.targetDate.getTime() < now.getTime() && remaining > 0;

    return {
      totalLessons,
      passedLessons: passed,
      remainingLessons: remaining,
      daysLeft,
      lessonsPerWeek,
      overdue,
    };
  }

  // ========== LESSON ACTIONS ==========

  async startLesson(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!lesson) throw new NotFoundException('Bài học không tồn tại');

    return this.prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        status: LessonStatus.IN_PROGRESS,
        startedAt: {
          set: new Date(),
        } as Prisma.DateTimeFieldUpdateOperationsInput,
      },
      create: {
        userId,
        lessonId,
        status: LessonStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  // ========== ADMIN: CONTENT MANAGEMENT ==========

  /** Danh sách tất cả course (kể cả không public) — admin view */
  async adminListCourses() {
    return this.prisma.course.findMany({
      orderBy: [{ jlptLevel: 'desc' }, { createdAt: 'asc' }],
      include: { _count: { select: { lessons: true } } },
    });
  }

  /** Chi tiết course với toàn bộ lesson + deck attachment cho admin */
  async adminGetCourse(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            decks: {
              include: {
                deck: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    jlptLevel: true,
                    _count: { select: { cards: true } },
                  },
                },
              },
            },
            test: {
              include: {
                deck: {
                  select: {
                    id: true,
                    name: true,
                    _count: { select: { cards: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Lộ trình không tồn tại');
    return course;
  }

  async attachDeckToLesson(
    lessonId: string,
    dto: { deckId: string; role?: LessonDeckRole; order?: number },
  ) {
    const [lesson, deck] = await Promise.all([
      this.prisma.lesson.findUnique({ where: { id: lessonId } }),
      this.prisma.deck.findUnique({ where: { id: dto.deckId } }),
    ]);
    if (!lesson) throw new NotFoundException('Bài học không tồn tại');
    if (!deck) throw new NotFoundException('Deck không tồn tại');

    return this.prisma.lessonDeck.upsert({
      where: { lessonId_deckId: { lessonId, deckId: dto.deckId } },
      update: {
        role: dto.role ?? LessonDeckRole.VOCAB,
        order: dto.order ?? 0,
      },
      create: {
        lessonId,
        deckId: dto.deckId,
        role: dto.role ?? LessonDeckRole.VOCAB,
        order: dto.order ?? 0,
      },
    });
  }

  async detachDeckFromLesson(lessonId: string, deckId: string) {
    try {
      return await this.prisma.lessonDeck.delete({
        where: { lessonId_deckId: { lessonId, deckId } },
      });
    } catch {
      throw new NotFoundException('Liên kết deck-lesson không tồn tại');
    }
  }

  async setLessonTest(
    lessonId: string,
    dto: { deckId: string; passScore?: number; questionCount?: number },
  ) {
    const [lesson, deck] = await Promise.all([
      this.prisma.lesson.findUnique({ where: { id: lessonId } }),
      this.prisma.deck.findUnique({ where: { id: dto.deckId } }),
    ]);
    if (!lesson) throw new NotFoundException('Bài học không tồn tại');
    if (!deck) throw new NotFoundException('Deck không tồn tại');

    return this.prisma.lessonTest.upsert({
      where: { lessonId },
      update: {
        deckId: dto.deckId,
        passScore: dto.passScore ?? 70,
        questionCount: dto.questionCount ?? 10,
      },
      create: {
        lessonId,
        deckId: dto.deckId,
        passScore: dto.passScore ?? 70,
        questionCount: dto.questionCount ?? 10,
      },
    });
  }

  async removeLessonTest(lessonId: string) {
    try {
      return await this.prisma.lessonTest.delete({ where: { lessonId } });
    } catch {
      throw new NotFoundException('Bài này chưa có bài kiểm tra');
    }
  }

  async completeLesson(lessonId: string, userId: string, score: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { test: true },
    });
    if (!lesson) throw new NotFoundException('Bài học không tồn tại');

    const passScore = lesson.test?.passScore ?? 70;
    const passed = score >= passScore;

    const progress = await this.prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        score,
        attemptCount: { increment: 1 },
        status: passed ? LessonStatus.PASSED : LessonStatus.IN_PROGRESS,
        completedAt: passed ? new Date() : null,
      },
      create: {
        userId,
        lessonId,
        score,
        attemptCount: 1,
        status: passed ? LessonStatus.PASSED : LessonStatus.IN_PROGRESS,
        startedAt: new Date(),
        completedAt: passed ? new Date() : null,
      },
    });

    // Tìm bài tiếp theo trong cùng course
    let nextLessonId: string | null = null;
    if (passed) {
      const nextLesson = await this.prisma.lesson.findFirst({
        where: { courseId: lesson.courseId, order: lesson.order + 1 },
        select: { id: true },
      });
      nextLessonId = nextLesson?.id ?? null;
    }

    return {
      passed,
      score,
      passScore,
      attemptCount: progress.attemptCount,
      nextLessonId,
    };
  }
}
