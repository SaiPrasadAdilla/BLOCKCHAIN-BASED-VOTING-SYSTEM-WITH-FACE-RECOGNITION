import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from "class-validator";
import mongoose from "mongoose";
import { IsRoleValid } from "src/decorators/role-validator/role-validator.decorator";

export interface user {

    name : string;

    role : string;

    password : string;

    email : string;

    associatedCompany : mongoose.Schema.Types.ObjectId;

}

export class createUserValidation {

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsRoleValid({
        message : 'Given user role is not valid. Please check and give appropriate role !!!!'
    })
    role: string;

    @IsNotEmpty()
    @MinLength(8)
    @IsStrongPassword()
    password: string;

    @IsNotEmpty()
    associatedCompany: mongoose.Schema.Types.ObjectId;

}