import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  @RequirePermissions(Permission.PROPERTIES_READ)
  findAll(
    @Query('q') q?: string,
    @Query('status') status?: PropertyStatus,
    @Query('woreda') woreda?: string,
  ) {
    return this.properties.findAll({ q, status, woreda });
  }

  @Get(':id')
  @RequirePermissions(Permission.PROPERTIES_READ)
  findOne(@Param('id') id: string) {
    return this.properties.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.PROPERTIES_WRITE)
  create(@Body() dto: CreatePropertyDto) {
    return this.properties.create(dto);
  }

  @Put(':id')
  @RequirePermissions(Permission.PROPERTIES_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.properties.update(id, dto);
  }
}
