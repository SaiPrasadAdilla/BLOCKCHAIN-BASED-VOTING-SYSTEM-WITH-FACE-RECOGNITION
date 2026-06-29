import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { functionNotExecutedException } from 'src/miscellaneous/functionNotExecutedException';
import { resourceCreatedException } from 'src/miscellaneous/resourceCreatedException';
import { company } from 'src/schemas/company.schema';

@Injectable()
export class CompanyService {
    
    private readonly logger : Logger = new Logger(CompanyService.name);

    constructor(
        @InjectModel(company.name) private companyModel : Model<company>
       
    ){}

    async getAllCompanies() {
        return await this.companyModel.find({}).exec();
    }

    async getCompaniesCount() {
        return await this.companyModel.find({}).countDocuments().exec();
    }

    async createCompany( companyDetails : company ) {
        
        try{
            const newCompany : company = {
                companyName: companyDetails.companyName,
                createdOn : new Date()
            }
    
            const newCompanySave = new this.companyModel(newCompany);
            newCompanySave.save();

            return new resourceCreatedException("Company Created");
        }
        catch(err) {
            return new functionNotExecutedException(err.toString());
        }
        

    }

}
