import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Delete,
  Res,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectModel('Post') private postModel: Model<any>,
    @InjectModel('Comment') private commentModel: Model<any>,
    @InjectModel('Roadmap') private roadmapModel: Model<any>,
    @InjectModel('Vote') private voteModel: Model<any>,
  ) {}

  @Get(':id/profile')
  async getProfile(@Param('id', ParseObjectIdPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;
    return safeUser;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.userId;
    const updatedUser = await this.usersService.update(userId, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    const safeUser = updatedUser.toObject();
    delete safeUser.passwordHash;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;
    return safeUser;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const userId = req.user.userId;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;
    return safeUser;
  }

  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  async exportMyData(@Request() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [posts, comments, roadmaps, votes] = await Promise.all([
      this.postModel.find({ author: userId }).select('-__v').lean().exec(),
      this.commentModel.find({ author: userId }).select('-__v').lean().exec(),
      this.roadmapModel.find({ owner: userId }).select('-__v').lean().exec(),
      this.voteModel.find({ user: userId }).select('-__v').lean().exec(),
    ]);

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    delete safeUser.resetPasswordToken;
    delete safeUser.resetPasswordExpires;

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: safeUser,
      posts,
      comments,
      roadmaps,
      votes,
      favorites: safeUser.favoriteResources,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="speakio-data-export-${new Date().toISOString().split('T')[0]}.json"`,
    );
    res.send(JSON.stringify(exportData, null, 2));
  }
}

