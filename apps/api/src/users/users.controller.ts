import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}
