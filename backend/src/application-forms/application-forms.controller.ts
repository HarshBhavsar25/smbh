import { 
  Controller, Get, Post, Delete, Param, Body, UseGuards, 
  UseInterceptors, UploadedFile, Req, ForbiddenException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApplicationFormsService } from './application-forms.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('application-forms')
export class ApplicationFormsController {
  constructor(
    private readonly applicationFormsService: ApplicationFormsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const secureUrl = await this.cloudinaryService.uploadFile(file, 'admission_documents');
    return { url: secureUrl };
  }

  @Post()
  async create(@Body() createDto: any) {
    return this.applicationFormsService.create(createDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Req() req: any) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can view application forms');
    }
    return this.applicationFormsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can view application forms');
    }
    return this.applicationFormsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can delete application forms');
    }
    return this.applicationFormsService.remove(id);
  }
}
