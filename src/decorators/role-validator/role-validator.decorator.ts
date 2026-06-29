import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ async: true })
export class IsRoleValidConstraint implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): boolean  {
        const roles = ["super-admin", "admin", "owner", "write", "read"];
        if(roles.includes(value)) {
            return true;
        } else {
            return false;
        }
    }
}

export function IsRoleValid(validationOptions ?: ValidationOptions) {
    return function ( object: object, propertyName: string ) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsRoleValidConstraint
        })
    }
}