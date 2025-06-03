import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '@lib/users/core/domain/entities/user.entity';
import { Template } from '../../domain/entities/template.entity';
import { TemplateDbPort } from '../ports/templates-db.port';
import { PinoLogger } from 'nestjs-pino';
import { UpdateTemplateDto } from '../dtos/update-template.dto';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';

interface UpdateTemplateInput {
  user: User;
  id: Template['id'];
  data: UpdateTemplateDto;
}

@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    private readonly templateDbPort: TemplateDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute({ user, id, data }: UpdateTemplateInput): Promise<Template> {
    try {
      // Find template
      const template = await this.templateDbPort.findById(id);
      if (!template) {
        throw new NotFoundException('Template not found');
      }

      // Check ownership
      if (template.user?.id !== user.id && user.role !== UserRole.ADMIN) {
        throw new BadRequestException("You don't have permission to update this template");
      }

      // Update template
      const updatedTemplate = this.templateDbPort.update(id, data);
      await this.templateDbPort.save();

      return updatedTemplate;
    } catch (error) {
      this.logger.error({ err: error, templateId: id }, 'Failed to update template');
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update template in database');
    }
  }
}
