export interface Asset {
  id: string;
  user_id: string;
  type: string; // e.g., crypto, stock, real_estate, custom
  name: string;
  value: number;
  currency: string;
  created_at: string;
}

export interface Liability {
  id: string;
  user_id: string;
  type: string; // e.g., mortgage, loan, credit_card, custom
  name: string;
  value: number;
  currency: string;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  feature_name: string;
  enabled: boolean;
  updated_by?: string;
  updated_at: string;
} 