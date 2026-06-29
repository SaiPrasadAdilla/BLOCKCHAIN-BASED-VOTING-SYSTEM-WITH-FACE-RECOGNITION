import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { user } from 'src/modules/users/user.interface';

@Injectable()
export class RoleGuard implements CanActivate {

  constructor(
    private reflector : Reflector
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean  {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if(!roles) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    const user : user = request.user;
    return this.matchRoles( roles, user.role );
  }

  private matchRoles( roles: string[], userRole: string ) {
    if( roles.includes(userRole) ) {
      return true;
    } else {
      return false;
    }
  }

}
