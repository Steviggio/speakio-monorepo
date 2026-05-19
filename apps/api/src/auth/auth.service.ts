import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel('Post') private postModel: Model<any>,
    @InjectModel('Comment') private commentModel: Model<any>,
    @InjectModel('Roadmap') private roadmapModel: Model<any>,
    @InjectModel('Vote') private voteModel: Model<any>,
  ) {}

  // Verifies email/password against bcrypt hash; returns sanitized user or null.
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

  // Signs a JWT with user email, ID, and role, then returns token + user.
  login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  // Creates a new user with hashed password and consent timestamp, then auto-logs in.
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
      consentGivenAt: new Date(),
      consentVersion: 'v1.0',
    });

    return this.login(user);
  }

  // Handles Google OAuth: links existing accounts or creates new users, then logs in.
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

  // Generates a time-limited reset token and stores it on the user document.
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

  // Validates a reset token, hashes the new password, and clears the token.
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

  // Updates the user's email after checking uniqueness.
  async changeEmail(userId: string, newEmail: string) {
    const existingEmail = await this.usersService.findByEmail(newEmail);
    if (existingEmail) {
      throw new UnauthorizedException('Email already in use');
    }

    await this.usersService.update(userId, { email: newEmail });
    return { message: 'Email updated successfully' };
  }

  // GDPR-compliant deletion: anonymizes user, archives content, removes personal data.
  async deleteAccount(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return { message: 'Account deleted successfully' };
    }

    if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const filePath = path.join(process.cwd(), user.avatarUrl);
      try {
        await fs.unlink(filePath);
      } catch {}
    }

    await this.commentModel.updateMany(
      { author: userId },
      { $set: { content: '[deleted]' } },
    );

    await this.postModel.updateMany(
      { author: userId },
      { $set: { content: '[deleted]', title: '[deleted]', status: 'deleted', tags: [] } },
    );

    await this.roadmapModel.deleteMany({ owner: userId });
    await this.voteModel.deleteMany({ user: userId });

    const anonymizedId = crypto.randomBytes(8).toString('hex');
    await this.usersService.update(userId, {
      email: `deleted_${anonymizedId}@anonymous.speakio`,
      username: `deleted_${anonymizedId}`,
      passwordHash: undefined,
      googleId: undefined,
      bio: undefined,
      avatarUrl: undefined,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
      favoriteResources: [],
      learningLanguages: [],
      consentGivenAt: undefined,
      consentVersion: undefined,
      deletedAt: new Date(),
    });

    return { message: 'Account and personal data deleted successfully' };
  }
}
