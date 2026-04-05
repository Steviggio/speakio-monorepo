import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      const result = user.toObject();
      delete result.passwordHash;
      return result;
    }
    return null;
  }

  login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: any) {
    const { email, username, password } = registerDto;
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.usersService.create({
      email,
      username,
      passwordHash,
    });

    return this.login(user);
  }

  async googleLogin(reqUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }) {
    if (!reqUser) {
      throw new UnauthorizedException('No user from google');
    }

    let user = await this.usersService.findByEmail(reqUser.email);

    if (user) {
      if (!user.googleId) {
        user = await this.usersService.update(user._id.toString(), {
          googleId: reqUser.googleId,
          avatarUrl: user.avatarUrl || reqUser.picture,
        });
      }
    } else {
      user = await this.usersService.create({
        email: reqUser.email,
        username:
          `${reqUser.firstName}${reqUser.lastName}${Math.floor(Math.random() * 10000)}`.toLowerCase(),
        googleId: reqUser.googleId,
        avatarUrl: reqUser.picture,
        role: 'USER',
        locale: 'en',
        learningLanguages: [],
      });
    }

    return this.login(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message:
          'If an account with that email exists, we sent a password reset link.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000);

    await this.usersService.update(user._id.toString(), {
      resetPasswordToken: resetToken,
      resetPasswordExpires,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[DEV] Reset token generated for ${email} (token: ${resetToken.slice(0, 8)}...)`,
      );
    }
    return {
      message:
        'If an account with that email exists, we sent a password reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService['userModel'].findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password has been successfully reset' };
  }

  async changeEmail(userId: string, newEmail: string) {
    const existingEmail = await this.usersService.findByEmail(newEmail);
    if (existingEmail) {
      throw new UnauthorizedException('Email already in use');
    }

    await this.usersService.update(userId, { email: newEmail });
    return { message: 'Email updated successfully' };
  }

  async deleteAccount(userId: string) {
    await this.usersService.update(userId, { deletedAt: new Date() });
    return { message: 'Account deleted successfully' };
  }
}
