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
import { CreateWebhookDto } from '../../../application/dtos/create-webhook.dto';
import { UpdateWebhookDto } from '../../../application/dtos/update-webhook.dto';
import { CreateWebhookUseCase } from '../../../application/use-cases/create-webhook.use-case';
import { UpdateWebhookUseCase } from '../../../application/use-cases/update-webhook.use-case';
import { DeleteWebhookUseCase } from '../../../application/use-cases/delete-webhook.use-case';
import { WebhookDbPort } from '../../../application/ports/webhook-db.port';
import { Webhook } from '../../../domain/entities/webhook.entity';
import { UserRole } from '@lib/users/core/domain/entities/user.entity';
import { PaginatedRestResponse } from '@lib/commons/dtos/paginated-response.factory';
import { Request } from '@lib/commons/types/express/request';
import { RestQueryDto } from '@lib/commons/dtos/rest.query.dto';
import { PaginatedResponse } from '@lib/commons/types/paginated-response.type';
import { SortDirection } from '@lib/commons/dtos/sort.dto';
import { NotifyWebhookUseCase } from '../../../application/use-cases/notify-webhook.use-case';
import { NotifyWebhookDto } from '../../../application/dtos/notify-webhook.dto';

const PaginatedWebhookResponse = PaginatedRestResponse(Webhook);

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhookDbPort: WebhookDbPort,
    private readonly createWebhookUseCase: CreateWebhookUseCase,
    private readonly updateWebhookUseCase: UpdateWebhookUseCase,
    private readonly deleteWebhookUseCase: DeleteWebhookUseCase,
    private readonly notifyWebhookUseCase: NotifyWebhookUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiBody({ type: CreateWebhookDto, description: 'Webhook creation data' })
  @ApiCreatedResponse({ type: Webhook, description: 'Successfully created webhook' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() createWebhookDto: CreateWebhookDto): Promise<Webhook> {
    return this.createWebhookUseCase.execute({
      user: req.user,
      data: createWebhookDto,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiOkResponse({ type: Webhook, description: 'Webhook found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Webhook not found' })
  async findOne(@Param('id') id: string): Promise<Webhook> {
    return this.webhookDbPort.findByIdOrFail(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all webhooks' })
  @ApiOkResponse({ type: PaginatedWebhookResponse, description: 'Paginated list of webhooks' })
  async findAll(@Req() req: Request, @Query() query: RestQueryDto): Promise<PaginatedResponse<Webhook>> {
    const pagination = query.toPagination();
    const sort = query.toSort();
    const defaultSort = { field: 'createdAt', direction: SortDirection.DESC };

    if (req.user.role === UserRole.ADMIN) {
      return this.webhookDbPort.findAll(undefined, pagination, { ...defaultSort, ...sort });
    }
    return this.webhookDbPort.findByUser(req.user.id, undefined, pagination, { ...defaultSort, ...sort });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update webhook' })
  @ApiBody({ type: UpdateWebhookDto, description: 'Webhook update data' })
  @ApiOkResponse({ type: Webhook, description: 'Webhook updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Webhook not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ): Promise<Webhook> {
    return this.updateWebhookUseCase.execute({
      user: req.user,
      id,
      data: updateWebhookDto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook' })
  @ApiNoContentResponse({ description: 'Webhook deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Webhook not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    await this.deleteWebhookUseCase.execute({
      user: req.user,
      id,
    });
  }

  @Post('notify')
  @ApiOperation({ summary: 'Trigger webhook notifications' })
  @ApiBody({ type: NotifyWebhookDto })
  @ApiOkResponse({ description: 'Notifications dispatched successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @HttpCode(HttpStatus.OK)
  async notify(@Req() req: Request, @Body() notifyDto: NotifyWebhookDto): Promise<void> {
    return this.notifyWebhookUseCase.execute({
      user: req.user,
      ...notifyDto,
    });
  }
}
