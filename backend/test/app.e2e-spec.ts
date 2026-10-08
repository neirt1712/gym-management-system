import { Body, Controller, Get, Module, Post, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { IsString, Length } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { CurrentUser, Roles } from '../src/common/auth/decorators';
import type { AccessTokenPayload } from '../src/common/auth/jwt-auth.guard';
import type { AuthUser } from '../src/common/http/request-context';

/* Endpoint chỉ dùng trong test, để thử guard và ValidationPipe khi chưa có endpoint thật. */
class ProbeDto {
  @IsString()
  @Length(10, 10)
  phone: string;
}

@Controller('probe')
class ProbeController {
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Roles('ADMIN')
  @Get('admin')
  admin() {
    return { ok: true };
  }

  @Roles('ADMIN')
  @Post('echo')
  echo(@Body() dto: ProbeDto) {
    return dto;
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

describe('Khung backend (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const tokenFor = (payload: AccessTokenPayload) => `Bearer ${jwt.sign(payload)}`;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule, ProbeModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health trả 200 và requestId trong header', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('đường dẫn không tồn tại trả NOT_FOUND theo mẫu chung', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/khong-co').expect(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', details: null });
    expect(typeof res.body.error.requestId).toBe('string');
  });

  it('chưa đăng nhập thì UNAUTHENTICATED', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/probe/me').expect(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('token sai chữ ký thì UNAUTHENTICATED', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/probe/me')
      .set('Authorization', 'Bearer khong.phai.token')
      .expect(401);
  });

  it('đăng nhập rồi thì đọc được người dùng hiện tại', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/probe/me')
      .set('Authorization', tokenFor({ sub: 'u-1', role: 'MEMBER', tv: 0 }))
      .expect(200);
    expect(res.body).toEqual({ id: 'u-1', role: 'MEMBER', tokenVersion: 0 });
  });

  it('sai vai trò thì FORBIDDEN, đúng vai trò thì qua', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/probe/admin')
      .set('Authorization', tokenFor({ sub: 'u-1', role: 'MEMBER', tv: 0 }))
      .expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');

    await request(app.getHttpServer())
      .get('/api/v1/probe/admin')
      .set('Authorization', tokenFor({ sub: 'u-9', role: 'ADMIN', tv: 0 }))
      .expect(200);
  });

  it('dữ liệu sai thì VALIDATION_ERROR, details liệt kê field', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/probe/echo')
      .set('Authorization', tokenFor({ sub: 'u-9', role: 'ADMIN', tv: 0 }))
      .send({ phone: '123', extra: 'x' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['phone', 'extra']));
  });
});
