import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from '@/core/users/domain/entities/user.entity';
import { TemplateDbPort } from '../ports/templates-db.port';
import { PinoLogger } from 'nestjs-pino';
import { UserRole } from '@/core/users/domain/entities/user.entity';

interface DeleteTemplateInput {
  user: User;
  id: number;
}

@Injectable()
export class DeleteTemplateUseCase {
  constructor(
    private readonly templateDbPort: TemplateDbPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute({ user, id }: DeleteTemplateInput): Promise<void> {
    try {
      // Find template
      const template = await this.templateDbPort.findById(id);
      if (!template) {
        throw new NotFoundException('Template not found');
      }

      const owner = await template.owner?.load();

      // Corrected permission check
      if (user.role !== UserRole.ADMIN && (!owner || owner.id !== user.id)) {
        throw new BadRequestException("You don't have permission to delete this template");
      }

      if (template.isPublic && user.role !== UserRole.ADMIN) {
        throw new BadRequestException("You don't have permission to delete public templates");
      }

      // Delete template
      await this.templateDbPort.delete(id);
      await this.templateDbPort.save();
    } catch (error) {
      this.logger.error({ err: error, templateId: id }, 'Failed to delete template');
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete template from database');
    }
  }
}
