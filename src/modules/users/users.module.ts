import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserService } from './user-service/user-service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/schemas/user.schema';
import { RequestParsingMiddleware } from 'src/middleware/request-parsing/request-parsing.middleware';
import { UserController } from './user/user.controller';
import { CompanyController } from './company/company.controller';
import { CompanyService } from './company-service/company-service';
import { company, companySchema } from 'src/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name : User.name,
        schema: userSchema
      },
      {
        name: company.name,
        schema: companySchema
      }
    ])
  ],
  controllers: [UserController, CompanyController],
  providers: [UserService, CompanyService]
})
export class UsersModule {

  configure( consumer : MiddlewareConsumer ) {
    consumer
      .apply(RequestParsingMiddleware)
      .exclude(
        {
          path: 'user',
          method: RequestMethod.GET
        },
        {
          path: 'company/all',
          method: RequestMethod.GET
        },
        {
          path: 'company/all/count',
          method: RequestMethod.GET
        }
      )
      .forRoutes(UserController, CompanyController)
  }

}
