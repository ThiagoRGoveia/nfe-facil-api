import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { CreateTemplateDto } from '../../../application/dtos/create-template.dto';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { UpdateTemplateDto } from '../../../application/dtos/update-template.dto';
import { CreateTemplateUseCase } from '../../../application/use-cases/create-template.use-case';
import { UpdateTemplateUseCase } from '../../../application/use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from '../../../application/use-cases/delete-template.use-case';
import { TemplateDbPort } from '../../../application/ports/templates-db.port';
import { Template } from '../../../domain/entities/template.entity';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { PaginatedRestResponse } from '@lib/commons/dtos/paginated-response.factory';
import { Request } from '@lib/commons/types/express/request';
import { RestQueryDto } from '@lib/commons/dtos/rest.query.dto';
import { Sort, SortDirection } from '@lib/commons/dtos/sort.dto';

const PaginatedTemplateResponse = PaginatedRestResponse(Template);

@ApiTags('templates')
@Controller('templates')
export class TemplateController {
  constructor(
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase,
    private readonly templateDbPort: TemplateDbPort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new template' })
  @ApiBody({
    type: CreateTemplateDto,
    description: 'Template creation data',
  })
  @ApiCreatedResponse({
    type: Template,
    description: 'Successfully created template',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() createTemplateDto: CreateTemplateDto): Promise<Template> {
    return this.createTemplateUseCase.execute({
      user: req.user,
      data: createTemplateDto,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiOkResponse({
    type: Template,
    description: 'Template found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async findOne(@Param('id') id: Template['id']): Promise<Template> {
    return this.templateDbPort.findByIdOrFail(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all templates' })
  @ApiOkResponse({
    type: PaginatedTemplateResponse,
    description: 'Paginated list of templates',
  })
  async findAll(@Req() req: Request, @Query() query: RestQueryDto): Promise<PaginatedResponse<Template>> {
    const pagination = query.toPagination();
    const sort = query.toSort();
    const defaultSort: Sort = { field: 'createdAt', direction: SortDirection.DESC };
    if (req.user.role === UserRole.ADMIN) {
      return await this.templateDbPort.findAll(undefined, pagination, { ...defaultSort, ...sort });
    } else {
      return await this.templateDbPort.findByUser(req.user.id, undefined, pagination, { ...defaultSort, ...sort });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiBody({
    type: UpdateTemplateDto,
    description: 'Template update data',
  })
  @ApiOkResponse({
    type: Template,
    description: 'Template updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async update(
    @Req() req: Request,
    @Param('id') id: Template['id'],
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template> {
    return this.updateTemplateUseCase.execute({
      user: req.user,
      id,
      data: updateTemplateDto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiNoContentResponse({
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: Template['id']): Promise<void> {
    await this.deleteTemplateUseCase.execute({
      user: req.user,
      id,
    });
  }
}
