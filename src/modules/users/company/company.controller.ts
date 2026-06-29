import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from 'src/decorators/role/role.decorator';
import { AuthGuard } from 'src/guards/auth/auth.guard';
import { RoleGuard } from 'src/guards/role/role.guard';
import { CompanyService } from '../company-service/company-service';
import { company } from 'src/schemas/company.schema';

@Controller('company')
export class CompanyController {

    constructor(
        private companyService : CompanyService
    ){}

    @Get('all')
    @UseGuards(AuthGuard, RoleGuard)
    @Role('super-admin', 'admin')
    async getAllCompanies() {
        return await this.companyService.getAllCompanies()
    }

    @Get('all/count')
    @UseGuards(AuthGuard, RoleGuard)
    @Role('super-admin', 'admin')
    async getAllCompaniesCount() {
        return await this.companyService.getCompaniesCount()
    }

    @Post("create")
    @UseGuards(AuthGuard, RoleGuard)
    @Role('super-admin', 'admin')
    async createCompany(@Body() companyDetails : company) {
        return this.companyService.createCompany(companyDetails)
    }

}
