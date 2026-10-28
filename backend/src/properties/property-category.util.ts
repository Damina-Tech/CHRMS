import { BadRequestException } from '@nestjs/common';
import { PropertyCategory, PropertyType } from '@prisma/client';

/** saving/kebele are residential-only; condominium may be residential or commercial. */
export function assertPropertyCategoryType(
  type: PropertyType,
  category: PropertyCategory | null | undefined,
) {
  if (type === PropertyType.residential) {
    if (!category) {
      throw new BadRequestException(
        'Residential properties require a category: saving, kebele, or condominium',
      );
    }
    return;
  }

  // commercial
  if (category && category !== PropertyCategory.condominium) {
    throw new BadRequestException(
      'Commercial properties may only use category condominium (or leave category empty)',
    );
  }
}
