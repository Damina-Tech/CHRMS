import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { RentalsService } from './rentals.service';

@Controller('rentals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RentalsController {
  constructor(private readonly rentals: RentalsService) {}

  @Get()
  @RequirePermissions(Permission.RENTALS_READ)
  findAll() {
    return this.rentals.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.RENTALS_READ)
  findOne(@Param('id') id: string) {
    return this.rentals.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.RENTALS_WRITE)
  create(@Body() dto: CreateRentalDto) {
    return this.rentals.create(dto);
  }

  @Put(':id')
  @RequirePermissions(Permission.RENTALS_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateRentalDto) {
    return this.rentals.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.RENTALS_WRITE)
  remove(@Param('id') id: string) {
    return this.rentals.remove(id);
  }
}
