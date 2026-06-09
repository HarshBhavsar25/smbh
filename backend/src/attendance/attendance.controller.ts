import { Controller, Get, Post, Body, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // 1. PUBLIC: Fetch student names and room numbers for attendance
  @Get('students-list')
  getStudentsList() {
    return this.attendanceService.getStudentsList();
  }

  // 2. PUBLIC: Submit attendance taken by staff
  @Post('submit')
  submitAttendance(
    @Body() body: { date: string; records: { studentId: string; status: string }[]; takenBy?: string }
  ) {
    return this.attendanceService.submitAttendance(body.date, body.records, body.takenBy);
  }

  // 3. PROTECTED: Get history of attendance (For Admin Panel)
  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  getAttendanceHistory(
    @Req() req: any,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('date') date?: string,
    @Query('studentSearch') studentSearch?: string
  ) {
    // Basic authorization check
    if (req.user?.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can view attendance history');
    }
    return this.attendanceService.getAttendanceHistory({ fromDate, toDate, date, studentSearch });
  }
}
