import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { StudentsModule } from './students/students.module';
import { FeesModule } from './fees/fees.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { VacationsModule } from './vacations/vacations.module';
import { PostsModule } from './posts/posts.module';
import { GalleryModule } from './gallery/gallery.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { RulesController } from './rules/rules.controller';
import { LeaveRequestsController } from './leaves/leaves.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule, 
    AuthModule, 
    UsersModule, 
    RoomsModule, 
    StudentsModule, 
    FeesModule, 
    ComplaintsModule, 
    VacationsModule, 
    PostsModule, 
    GalleryModule, 
    IntegrationsModule
  ],
  controllers: [AppController, RulesController, LeaveRequestsController],
  providers: [AppService],
})
export class AppModule {}
