import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthService } from './auth/auth-service/auth-service';
import { RequestParsingMiddleware } from 'src/middleware/request-parsing/request-parsing.middleware';
import { AuthControllerController } from './auth/auth-controller/auth-controller.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from '../users/user-service/user-service';
import { JwtService, JwtModule } from '@nestjs/jwt';
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
    ]),
    JwtModule.register({
      global: true
    })
  ],
  providers: [AuthService, JwtService, UserService],
  controllers: [AuthControllerController]
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestParsingMiddleware)
      .exclude({
        path: 'auth/profile',
        method: RequestMethod.GET
      })
      .forRoutes(AuthControllerController)
  }
}
