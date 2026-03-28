import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './properties/properties.module';
import { RentalPaymentsModule } from './rental-payments/rental-payments.module';
import { RentalsModule } from './rentals/rentals.module';
import { ReportsModule } from './reports/reports.module';
import { SalePaymentsModule } from './sale-payments/sale-payments.module';
import { SalesModule } from './sales/sales.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    TenantsModule,
    RentalsModule,
    RentalPaymentsModule,
    SalesModule,
    SalePaymentsModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
