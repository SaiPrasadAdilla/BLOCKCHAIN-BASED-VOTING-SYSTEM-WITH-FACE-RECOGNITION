import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InitialiserService } from './initialiser-service/initialiser-service';
import { User, userSchema } from 'src/schemas/user.schema';
import { company, companySchema } from 'src/schemas/company.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: userSchema
      },
      {
        name: company.name,
        schema: companySchema
      }
    ])
  ],
  providers: [InitialiserService],
  exports: []
})
export class InitialiserModule {}
