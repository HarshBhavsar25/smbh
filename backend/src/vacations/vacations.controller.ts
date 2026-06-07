import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('vacations')
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    // Attach studentId from the authenticated user's profile
    const studentId = body.studentId || req.user?.studentProfileId;
    return this.vacationsService.create({ ...body, studentId });
  }

  @Get()
  async findAll() {
    return this.vacationsService.findAll();
  }

  @Get('my')
  async findMine(@Request() req: any) {
    const studentId = req.user?.studentProfileId;
    return this.vacationsService.findForStudent(studentId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.vacationsService.update(id, body);
  }
}
