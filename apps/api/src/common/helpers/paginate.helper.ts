import { Model, Document, PopulateOptions } from 'mongoose';
import { PaginationDto } from '../dto/pagination.dto';

export interface PaginateOptions {
  sort?: Record<string, 1 | -1>;
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
  select?: string | Record<string, 0 | 1>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function paginate<T extends Document>(
  model: Model<T>,
  filter: Record<string, any>,
  pagination: PaginationDto,
  options: PaginateOptions = {},
): Promise<PaginatedResult<T>> {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 10;
  const skip = (page - 1) * limit;

  let query: any = model
    .find(filter)
    .sort(options.sort ?? { createdAt: -1 })
    .skip(skip)
    .limit(limit);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    if (Array.isArray(options.populate)) {
      for (const pop of options.populate) {
        query = query.populate(pop);
      }
    } else {
      query = query.populate(options.populate);
    }
  }

  const [data, total] = await Promise.all([
    query.exec() as Promise<T[]>,
    model.countDocuments(filter).exec(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
