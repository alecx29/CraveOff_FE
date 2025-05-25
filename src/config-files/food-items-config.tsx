export interface Summary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface FoodItem {
  name: string;
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  createdAt?: string;
}

export interface Food {
  calories: string;
  carbs: string;
  protein: string;
  fats: string;
  quantity: string;
  name: string;
}
