import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../database/prisma.service';
import { StudentService } from 'src/student/student.service';
import { CourseService } from 'src/course/course.service';
import { TeacherService } from 'src/teacher/teacher.service';
import { SubjectService } from 'src/subject/subject.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    TeacherService,
    PrismaService,
    StudentService,
    CourseService,
    SubjectService,
  ],
  exports: [UserService],
})
export class UserModule {}
