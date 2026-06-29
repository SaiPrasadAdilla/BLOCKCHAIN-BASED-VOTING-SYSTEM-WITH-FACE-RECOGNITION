import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { user } from 'src/modules/users/user.interface';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InitialiserService implements OnModuleInit {
  private readonly logger: Logger = new Logger(InitialiserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('company') private companyModel: Model<any>,
  ) {}

  async onModuleInit() {
    this.logger.log('Initialising the Application !!!!');
    const adminCheck = await this.checkSuperAdmin();

    if (adminCheck == false) {
      try {
        const hash = await bcrypt.hash(
          process.env.admin_password,
          Number(process.env.salt_rounds),
        );
        const companyName =
          process.env.DEFAULT_COMPANY_NAME || 'DefaultCompany';

        const createdAdminCompany = new this.companyModel({
          companyName: companyName,
          createdOn: new Date(),
        });
        await createdAdminCompany.save();

        const adminUserDetails: user = {
          name: 'admin',
          role: 'super-admin',
          email: process.env.admin_username,
          password: hash,
          associatedCompany: createdAdminCompany._id as any,
        };
        const createdAdmin = new this.userModel(adminUserDetails);
        await createdAdmin.save();
        this.logger.log('Super admin user created 👑 !!!!');
      } catch (error) {
        console.log(error);
        this.logger.error(
          'Error in creating the super admin user !!!! Please check the logs in detail',
        );
      }
    } else {
      this.logger.log('Starting the Application ..... ⏳');
    }
  }

  private async checkSuperAdmin(): Promise<boolean> {
    this.logger.log('Checking Superadmin user in the application !!!!');
    const adminCheckCount = await this.userModel
      .find({ email: process.env.admin_username })
      .countDocuments();
    if (adminCheckCount > 0) {
      this.logger.log('Super admin user found 👑 !!!!');
      return true;
    } else {
      this.logger.warn('Super admin user not found !!!!');
      return false;
    }
  }
}
