import {
  Between,
  Like,
  ILike,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Equal,
  FindOptionsWhere,
  FindManyOptions,
  Repository,
  ObjectLiteral,
} from 'typeorm';

export function buildDynamicFilters<T>(filters: Record<string, any>, dateField?: string): FindOptionsWhere<T> {
  const where: any = {};

  if (!filters) {
    return where;
  }

  // Handle fromDate and toDate range checks if dateField is provided
  if (dateField) {
    const fromDate = filters.fromDate;
    const toDate = filters.toDate;
    delete filters.fromDate;
    delete filters.toDate;

    if (fromDate || toDate) {
      const isStringDateField = dateField === 'readingDate';

      if (fromDate && toDate) {
        if (isStringDateField) {
          where[dateField] = Between(fromDate, toDate);
        } else {
          const start = new Date(fromDate);
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          where[dateField] = Between(start, end);
        }
      } else if (fromDate) {
        if (isStringDateField) {
          where[dateField] = MoreThanOrEqual(fromDate);
        } else {
          where[dateField] = MoreThanOrEqual(new Date(fromDate));
        }
      } else if (toDate) {
        if (isStringDateField) {
          where[dateField] = LessThanOrEqual(toDate);
        } else {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          where[dateField] = LessThanOrEqual(end);
        }
      }
    }
  }

  if (Object.keys(filters).length === 0) {
    return where;
  }

  type OperatorType = 'gte' | 'gt' | 'lte' | 'lt' | 'like' | 'ilike' | 'eq' | 'in';

  Object.keys(filters).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value = filters[key];
    if (value === undefined || value === null || value === '') {
      return;
    }

    // 1. Check for operator-based filtering (e.g., ?age[gte]=20)
    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.keys(value).forEach((op) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        let opValue = value[op];

        // Format casting
        if (typeof opValue === 'string' && !isNaN(Number(opValue)) && opValue.trim() !== '') {
          opValue = Number(opValue);
        }

        switch (op as OperatorType) {
          case 'gte':
            where[key] = MoreThanOrEqual(opValue);
            break;
          case 'gt':
            where[key] = MoreThan(opValue);
            break;
          case 'lte':
            where[key] = LessThanOrEqual(opValue);
            break;
          case 'lt':
            where[key] = LessThan(opValue);
            break;
          case 'like':
            where[key] = Like(`%${opValue}%`);
            break;
          case 'ilike':
            where[key] = ILike(`%${opValue}%`);
            break;
          case 'eq':
            where[key] = Equal(opValue);
            break;
          case 'in':
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            where[key] = In(Array.isArray(opValue) ? opValue : [opValue]);
            break;
        }
      });
      return; // Skip the rest of the logic for this key once operators are handled
    }

    const valueStr = String(value);

    // 2. Date filtering: Check if the key seems to be a date field
    if (
      key === 'createdAt' ||
      key === 'updatedAt' ||
      key.toLowerCase().includes('date')
    ) {
      const startOfDay = new Date(valueStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(valueStr);
      endOfDay.setHours(23, 59, 59, 999);
      if (!isNaN(startOfDay.getTime())) {
        where[key] = Between(startOfDay, endOfDay);
        return;
      }
    }

    // 3. Fallback for array parsing from comma-separated string
    if (valueStr.includes(',') && !valueStr.includes(' ')) {
      const arr = valueStr.split(',');
      where[key] = In(arr);
      return;
    }

    // 4. Check if it's a number (for exact numeric matches, e.g. age, salary)
    if (!isNaN(Number(valueStr)) && valueStr.trim() !== '') {
      where[key] = Number(valueStr);
      return;
    }

    // 5. Otherwise, assume it's a string that requires a LIKE search
    where[key] = Like(`%${valueStr}%`);
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return where;
}

export function buildSortOptions(sort?: string) {
  // e.g., sort="name:ASC,createdAt:DESC"
  const order: Record<string, 'ASC' | 'DESC'> = {};
  if (sort) {
    const sortFields = sort.split(',');
    sortFields.forEach((field) => {
      const [key, direction] = field.split(':');
      order[key] = direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    });
  } else {
    order.createdAt = 'DESC'; // Important: Always order results for predictable pagination.
  }
  return order;
}

export function buildQueryOptions<T extends ObjectLiteral>(
  repository: Repository<T>,
  page = 1,
  limit = 10,
  searchTerm = '',
  sort = '',
  filters: Record<string, any> = {},
  searchFields: string[] = ['name'],
): FindManyOptions<T> {
  const skip = (page - 1) * limit;

  const order = buildSortOptions(sort);

  // Find date field dynamically from repository metadata columns
  const dateField = repository?.metadata?.columns?.find((c) =>
    c.propertyName === 'date' ||
    c.propertyName === 'readingDate' ||
    c.propertyName === 'createdAt'
  )?.propertyName;

  const where = buildDynamicFilters<T>(filters, dateField);

  const findOptions: FindManyOptions<any> = {
    take: limit,
    skip: skip,
    order: order as any,
  };

  if (searchTerm && searchFields.length > 0) {
    // Add search condition. Using `Like` for partial matching in PostgreSQL.
    findOptions.where = searchFields.map((field) => ({
      ...where,
      [field]: Like(`%${searchTerm}%`),
    })) as any;
  } else if (Object.keys(where).length > 0) {
    findOptions.where = where;
  }

  return findOptions;
}
