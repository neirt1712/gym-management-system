// Mọi module nghiệp vụ, theo nhóm API trong docs/spec/api-v3.md.
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { PackagesModule } from './packages/packages.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CheckInsModule } from './check-ins/check-ins.module';
import { MembersModule } from './members/members.module';
import { TrainersModule } from './trainers/trainers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TrainingModule } from './training/training.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';

export const FEATURE_MODULES = [
  AuthModule,
  MeModule,
  PackagesModule,
  OrdersModule,
  PaymentsModule,
  SubscriptionsModule,
  CheckInsModule,
  MembersModule,
  TrainersModule,
  AppointmentsModule,
  TrainingModule,
  UsersModule,
  ClassesModule,
  ReportsModule,
  NotificationsModule,
  HealthModule,
];
