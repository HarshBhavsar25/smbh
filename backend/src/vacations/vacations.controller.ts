import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('vacations')
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @Post()
  async create(@Body() body: any) {
    return this.vacationsService.create(body);
  }

  @Get()
  async findAll() {
    return this.vacationsService.findAll();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.vacationsService.update(id, body);
  }
}
