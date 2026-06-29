import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { company } from "./company.schema";

export type userDocument = User & Document;

@Schema()
export class User {

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, index: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true, index: true })
    role: string;

    @Prop({ required: true, type:  mongoose.Schema.Types.ObjectId, ref: 'company'})
    associatedCompany: company

}

export const userSchema = SchemaFactory.createForClass(User);