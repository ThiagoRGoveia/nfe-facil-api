import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Filter } from '@/infra/dtos/filter.dto';
import { Sort } from '@/infra/dtos/sort.dto';
import { CreateClientDto } from '../../../application/dtos/create-client.dto';
import { UpdateClientDto } from '../../../application/dtos/update-client.dto';
import { CreateClientUseCase } from '../../../application/use-cases/create-client.use-case';
import { UpdateClientUseCase } from '../../../application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from '../../../application/use-cases/delete-client.use-case';
import { ClientDbPort } from '../../../application/ports/client-db.port';
import { Client } from '../../../domain/entities/client.entity';

@ApiTags('clients')
@Controller('clients')
export class ClientController {
  constructor(
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
    private readonly clientDbPort: ClientDbPort,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'client created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createClientDto: CreateClientDto) {
    return this.createClientUseCase.execute(createClientDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'client found' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'client not found' })
  async findOne(@Param('id') id: string): Promise<Client | null> {
    return this.clientDbPort.findById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of clients' })
  async findAll(@Query() pagination: Pagination, @Query() filter: Filter, @Query() sort: Sort): Promise<Client[]> {
    return this.clientDbPort.findAll();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiResponse({ status: HttpStatus.OK, description: 'client updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'client not found' })
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.updateClientUseCase.execute({
      id,
      data: updateClientDto,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'client deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'client not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.deleteClientUseCase.execute({ id });
  }
}
