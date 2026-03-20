import { NextRequest, NextResponse } from 'next/server';
import { productService } from '@/lib/products';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const rawLimit = parseInt(searchParams.get('limit') || '20');
  const rawOffset = parseInt(searchParams.get('offset') || '0');

  const filters = {
    category: searchParams.get('category') || undefined,
    subCategory: searchParams.get('subCategory') || undefined,
    search: searchParams.get('search') || undefined,
    limit: isNaN(rawLimit) ? 20 : Math.max(1, Math.min(100, rawLimit)),
    offset: isNaN(rawOffset) ? 0 : Math.max(0, rawOffset),
  };

  const products = productService.getAll(filters);
  const total = productService.getTotalCount({
    category: filters.category,
    subCategory: filters.subCategory,
    search: filters.search,
  });

  return NextResponse.json({
    products,
    total,
    limit: filters.limit,
    offset: filters.offset,
  });
}
