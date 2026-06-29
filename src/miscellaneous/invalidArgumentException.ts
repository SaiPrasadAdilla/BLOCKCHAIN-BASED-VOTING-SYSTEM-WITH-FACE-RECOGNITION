import { HttpException, HttpStatus } from "@nestjs/common";

export class InvalidArgumentException extends HttpException {
    constructor( message: string ) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}