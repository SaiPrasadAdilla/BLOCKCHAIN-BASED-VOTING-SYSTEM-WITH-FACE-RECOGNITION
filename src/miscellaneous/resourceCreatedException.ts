import { HttpException, HttpStatus } from "@nestjs/common";

export class resourceCreatedException extends HttpException {
    constructor( message: string ) {
        super(message, HttpStatus.CREATED);
    }
}