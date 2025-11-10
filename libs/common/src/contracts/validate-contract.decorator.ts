import { Logger } from '@nestjs/common';

const logger = new Logger('ContractValidation');

export function ValidateContract(contractClass: any) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [data] = args;

      try {
        const validatedData = contractClass.validate(data);
        return await originalMethod.apply(this, [
          validatedData,
          ...args.slice(1),
        ]);
      } catch (error) {
        logger.error(
          `Contract validation failed for ${propertyKey}: ${error.message}`,
        );
        throw error;
      }
    };

    return descriptor;
  };
}
