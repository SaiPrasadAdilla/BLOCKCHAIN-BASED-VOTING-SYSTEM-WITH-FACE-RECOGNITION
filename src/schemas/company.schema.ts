import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type companyDocument = Document & company;

@Schema()
export class company {

    @Prop({ required: true, index: true })
    companyName : string;

    @Prop({ required: true, index: true })
    createdOn : Date;

}

export const companySchema = SchemaFactory.createForClass(company);