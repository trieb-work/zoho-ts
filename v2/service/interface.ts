import {
  CreateSalesOrder,
  SalesOrder,
  UpdateSalesOrder,
} from "../types/salesOrder";

export interface SalesOrderService {
  create: (salesOrder: CreateSalesOrder) => Promise<SalesOrder>;
  list: () => Promise<SalesOrder[]>;
  update: (salesOrder: UpdateSalesOrder) => Promise<SalesOrder>;
  retrieve: (id: string) => Promise<SalesOrder>;
  delete: (id: string) => Promise<void>;
  confirm: (id: string) => Promise<void>;
  markVoid: (id: string) => Promise<void>;
}
