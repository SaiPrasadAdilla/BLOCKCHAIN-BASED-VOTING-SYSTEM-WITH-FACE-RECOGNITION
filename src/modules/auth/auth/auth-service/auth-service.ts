import { ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/users/user-service/user-service';
import { jwtPayload } from '../../auth.interface';

@Injectable()
export class AuthService {

    private readonly logger : Logger = new Logger(AuthService.name);

    constructor(
        private usersService : UserService,
        private jwtService : JwtService
    ){}

    async signIn(username: string, password: string) {
        
        const check_user = await this.usersService.checkUser(username, password);
        switch(check_user) {
            
            case 'user_checks_complete':
                const user = await this.usersService.fetchUser(username);
                const jwtPayload : jwtPayload = {
                    username : user.email,
                    role : user.role,
                    associatedCompany : user.associatedCompany.companyName
                }
                return {
                    jwt : await this.jwtService.signAsync(jwtPayload,{ secret : process.env.secret_key })
                } 

            case 'check_password':
                throw new UnauthorizedException();

            case 'check_user':
                throw new NotFoundException();

            default:
                throw new ForbiddenException();

        }
        
    }

}
