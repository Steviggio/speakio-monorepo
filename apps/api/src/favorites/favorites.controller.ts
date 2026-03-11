import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /** Toggle a favorite (add or remove) */
  @UseGuards(JwtAuthGuard)
  @Post(':resourceId')
  async toggleFavorite(
    @Request() req: any,
    @Param('resourceId') resourceId: string,
  ) {
    return this.favoritesService.toggle(req.user.userId, resourceId);
  }

  /** List user's favorite resources */
  @UseGuards(JwtAuthGuard)
  @Get()
  async listFavorites(@Request() req: any) {
    return this.favoritesService.listFavorites(req.user.userId);
  }

  /** Remove a favorite */
  @UseGuards(JwtAuthGuard)
  @Delete(':resourceId')
  async removeFavorite(
    @Request() req: any,
    @Param('resourceId') resourceId: string,
  ) {
    return this.favoritesService.removeFavorite(req.user.userId, resourceId);
  }
}
