import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { user } from '../user.interface';
import { InvalidArgumentException } from 'src/miscellaneous/invalidArgumentException';
import { functionNotExecutedException } from 'src/miscellaneous/functionNotExecutedException';
import { resourceCreatedException } from 'src/miscellaneous/resourceCreatedException';

@Injectable()
export class UserService {

    private readonly logger : Logger = new Logger(UserService.name);

    constructor(
        @InjectModel(User.name) private userModel : Model<User>
    ){}

    public async checkUser ( username : string, password: string ) {
        
        const userCount = await this.userModel.find({email: username}).countDocuments();
        
        if( userCount > 0 ) {
            
            const user = await this.userModel.findOne({ email : username });
            const comparePassword = await bcrypt.compare(password, user.password);

            if(comparePassword) {
                return "user_checks_complete";
            } else {
                return "check_password";
            }

        } else {
            return "check_user";
        }
    
    }

    public async fetchUser ( username: string ) {
        return await this.userModel.findOne({ email : username }).populate('associatedCompany');
    }

    public async createUser ( userDetails : user ) {
        
        const userCount = await this.userModel.find({ email : userDetails.email }).countDocuments();
        if( userCount > 0 ) {
            return new InvalidArgumentException("user already present")
        } else {
            
            try{
                
                const passwordHash = await bcrypt.hash(userDetails.password, Number(process.env.salt_rounds));
                const user : user = {
                    name : userDetails.name,
                    email : userDetails.email,
                    role : userDetails.role,
                    password : passwordHash,
                    associatedCompany: userDetails.associatedCompany
                };
                const userCreation = new this.userModel(user);
                userCreation.save();

                return new resourceCreatedException("User Created !!!!")

            } catch(error) {
                return new functionNotExecutedException(error.toString())
            }

        }
    
    }

}
