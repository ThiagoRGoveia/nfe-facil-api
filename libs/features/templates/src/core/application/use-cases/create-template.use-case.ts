import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { Template } from '../../domain/entities/template.entity';
import { TemplateDbPort } from '../ports/templates-db.port';
import { PinoLogger } from 'nestjs-pino';
import { CreateTemplateDto } from '../dtos/create-template.dto';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';

interface CreateTemplateInput {
  user: User;
  data: CreateTemplateDto;
}

@Injectable()
export class CreateTemplateUseCase {
  constructor(
    private readonly templateDbPort: TemplateDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute({ user, data }: CreateTemplateInput): Promise<Template> {
    try {
      // Validate if user can create public templates
      if (data.isPublic && user.role !== UserRole.ADMIN) {
        throw new BadRequestException('Users cannot create public templates');
      }

      // Create template with owner
      const template = this.templateDbPort.create({
        ...data,
        user: user,
      });

      await this.templateDbPort.save();
      return template;
    } catch (error) {
      this.logger.error('Failed to create template:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Failed to create template in database');
    }
  }
}
