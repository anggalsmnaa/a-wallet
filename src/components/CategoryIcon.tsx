import {
  Briefcase,
  Car,
  Coins,
  Film,
  HeartPulse,
  Package,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Zap,
} from 'lucide-react';
import type { CategoryIconName } from '../types';

interface CategoryIconProps {
  name?: CategoryIconName;
  className?: string;
}

export function CategoryIcon({ name, className = 'h-5 w-5' }: CategoryIconProps) {
  switch (name) {
    case 'utensils':
      return <Utensils className={className} aria-hidden="true" />;
    case 'car':
      return <Car className={className} aria-hidden="true" />;
    case 'shopping-bag':
      return <ShoppingBag className={className} aria-hidden="true" />;
    case 'zap':
      return <Zap className={className} aria-hidden="true" />;
    case 'film':
      return <Film className={className} aria-hidden="true" />;
    case 'heart-pulse':
      return <HeartPulse className={className} aria-hidden="true" />;
    case 'briefcase':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'trending-up':
      return <TrendingUp className={className} aria-hidden="true" />;
    case 'coins':
      return <Coins className={className} aria-hidden="true" />;
    case 'package':
    default:
      return <Package className={className} aria-hidden="true" />;
  }
}
