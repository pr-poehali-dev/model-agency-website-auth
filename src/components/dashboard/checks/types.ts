export interface Employee {
  name: string;
  email?: string;
  week: number;
  shifts?: number;
  model: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  advance: number;
  penalty: number;
  total: number;
}

export interface ProducerData {
  name: string;
  period: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  expenses: number;
  advance: number;
  penalty: number;
  total: number;
  employees: Employee[];
}