import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserService } from '../user-service/user-service';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RoleGuard } from 'src/guards/role/role.guard';
import { Role } from 'src/decorators/role/role.decorator';
import { createUserValidation } from '../user.interface';

@Controller('user')
export class UserController {

    constructor(
        private userService : UserService
    ) {}

    @Post('create-user')
    @UseGuards(AuthGuard, RoleGuard)
    @Role( 'super-admin', 'admin', 'owner' )
    createUser(@Body() userDetails : createUserValidation) {
        return this.userService.createUser(userDetails);
    }

}
