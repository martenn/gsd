import {
  IsNumber,
  IsString,
  IsOptional,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ReorderTaskRequest } from '@gsd/types';

function AtLeastOneOf(properties: string[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'atLeastOneOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          return properties.some((prop) => obj[prop] !== undefined && obj[prop] !== null);
        },
        defaultMessage(args: ValidationArguments) {
          const props = args.constraints[0] as string[];
          return `At least one of the following properties must be provided: ${props.join(', ')}`;
        },
      },
    });
  };
}

export class ReorderTaskDto implements ReorderTaskRequest {
  @IsNumber()
  @IsOptional()
  @ValidateIf((o: ReorderTaskDto) => o.afterTaskId === undefined)
  @AtLeastOneOf(['newOrderIndex', 'afterTaskId'])
  newOrderIndex?: number;

  @IsString()
  @IsOptional()
  @ValidateIf((o: ReorderTaskDto) => o.newOrderIndex === undefined)
  afterTaskId?: string;
}
