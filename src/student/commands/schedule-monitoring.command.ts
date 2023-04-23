import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { MonitorStatus } from 'src/monitor/utils/monitor.enum';
import { ScheduleStatus } from 'src/schedules/utils/schedules.enum';
import { ScheduleMonitoringDto } from '../dto/schedule-monitoring.dto';
import { ScheduleFactory } from '../../schedules/utils/schedule.factory';
import {
  InvalidDateException,
  MonitorNotFoundException,
  MonitorStatusNotAvailableException,
  MonitorTimeAlreadyScheduledException,
  NotAnAvailableTimeException,
  SameStudentException,
  StudentTimeAlreadyScheduledException,
} from '../utils/exceptions';
import { Schedule } from 'src/schedules/domain/schedule';

@Injectable()
export class ScheduleMonitoringCommand {
  constructor(private prisma: PrismaService) {}

  async execute(
    userId: number,
    monitorId: number,
    data: ScheduleMonitoringDto,
  ): Promise<Schedule> {
    const { start, end } = data;
    const now = new Date();
    const AMT_OFFSET = -4;
    now.setHours(now.getHours() + AMT_OFFSET);

    if (
      start <= now ||
      start >= end ||
      start.toLocaleDateString() !== end.toLocaleDateString()
    )
      throw new InvalidDateException();

    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId },
    });
    if (!monitor) throw new MonitorNotFoundException();

    if (monitor.id_status !== MonitorStatus.AVAILABLE)
      throw new MonitorStatusNotAvailableException();

    if (monitor.student_id === userId) throw new SameStudentException();

    await this.checkAvailability(monitorId, start, end);

    await this.checkMonitorConfirmedSchedules(monitorId, start, end);

    await this.checkStudentSchedules(userId, start, end);

    const newSchedule = await this.prisma.scheduleMonitoring.create({
      data: {
        student_id: userId,
        monitor_id: monitorId,
        start: start,
        end: end,
      },
    });

    return ScheduleFactory.createFromPrisma(newSchedule);
  }

  private async checkAvailability(monitorId: number, start: Date, end: Date) {
    const availability = await this.prisma.availableTimes.findFirst({
      where: {
        monitor_id: monitorId,
        week_day: start.getDay(),
      },
    });
    if (!availability) throw new NotAnAvailableTimeException();

    const startAvailability = new Date(start);
    startAvailability.setHours(
      Number(availability.start.split(':')[0]),
      Number(availability.start.split(':')[1]),
      0,
    );

    const endAvailability = new Date(end);
    endAvailability.setHours(
      Number(availability.end.split(':')[0]),
      Number(availability.end.split(':')[1]),
      0,
    );

    if (
      start < startAvailability ||
      start >= endAvailability ||
      end <= startAvailability ||
      end > endAvailability
    )
      throw new NotAnAvailableTimeException();
  }

  private async checkMonitorConfirmedSchedules(
    monitorId: number,
    start: Date,
    end: Date,
  ) {
    const conflitingSchedule = await this.prisma.scheduleMonitoring.findFirst({
      where: {
        monitor_id: monitorId,
        id_status: ScheduleStatus.CONFIRMED,
        OR: [
          {
            start: {
              lte: start,
            },
            end: {
              gt: start,
            },
          },
          {
            start: {
              lt: end,
            },
            end: {
              gte: end,
            },
          },
          {
            start: {
              gte: start,
            },
            end: {
              lte: end,
            },
          },
        ],
      },
    });

    if (conflitingSchedule) throw new MonitorTimeAlreadyScheduledException();
  }

  private async checkStudentSchedules(
    studentId: number,
    start: Date,
    end: Date,
  ) {
    const conflitingSchedule = await this.prisma.scheduleMonitoring.findFirst({
      include: {
        status: true,
      },
      where: {
        student_id: studentId,
        id_status: {
          in: [ScheduleStatus.CONFIRMED, ScheduleStatus.WAITING_APPROVAL],
        },
        OR: [
          {
            start: {
              lte: start,
            },
            end: {
              gt: start,
            },
          },
          {
            start: {
              lt: end,
            },
            end: {
              gte: end,
            },
          },
          {
            start: {
              gte: start,
            },
            end: {
              lte: end,
            },
          },
        ],
      },
    });

    if (conflitingSchedule)
      throw new StudentTimeAlreadyScheduledException(
        conflitingSchedule.status.status,
      );
  }
}