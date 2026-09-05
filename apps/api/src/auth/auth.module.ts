import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import { Post, PostSchema } from '../schemas/post.schema';
import { Comment, CommentSchema } from '../schemas/comment.schema';
import { Roadmap, RoadmapSchema } from '../schemas/roadmap.schema';
import { Vote, VoteSchema } from '../schemas/vote.schema';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Roadmap.name, schema: RoadmapSchema },
      { name: Vote.name, schema: VoteSchema },
    ]),
    JwtModule.registerAsync({
      imports: [NestConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
