import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Ăn uống', icon: 'Utensils', type: 'expense' },
  { id: 'cat_transport', name: 'Di chuyển', icon: 'Car', type: 'expense' },
  { id: 'cat_shopping', name: 'Mua sắm', icon: 'ShoppingBag', type: 'expense' },
  { id: 'cat_entertainment', name: 'Giải trí', icon: 'Film', type: 'expense' },
  { id: 'cat_utils', name: 'Hóa đơn & Tiện ích', icon: 'Zap', type: 'expense' },
  { id: 'cat_housing', name: 'Nhà cửa', icon: 'Home', type: 'expense' },
  { id: 'cat_health', name: 'Sức khỏe', icon: 'HeartPulse', type: 'expense' },
  { id: 'cat_salary', name: 'Tiền lương', icon: 'Briefcase', type: 'income' },
  { id: 'cat_bonus', name: 'Tiền thưởng', icon: 'PlusCircle', type: 'income' },
  { id: 'cat_invest', name: 'Đầu tư', icon: 'TrendingUp', type: 'income' },
  { id: 'cat_other_inc', name: 'Thu nhập khác', icon: 'DollarSign', type: 'income' },
  { id: 'cat_other_exp', name: 'Chi tiêu khác', icon: 'HelpCircle', type: 'expense' },
];
