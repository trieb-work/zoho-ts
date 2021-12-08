import {
  Address,
  CreateSalesOrder,
  SalesOrder,
  UpdateSalesOrder,
  CreateContact,
  Contact,
  UpdateContact,
  Item
} from "../types";

export interface SalesOrderService {
  create: (salesOrder: CreateSalesOrder) => Promise<SalesOrder>;
  list: () => Promise<SalesOrder[]>;
  update: (salesOrder: UpdateSalesOrder) => Promise<SalesOrder>;
  retrieve: (id: string) => Promise<SalesOrder>;
  delete: (id: string) => Promise<void>;
  confirm: (id: string) => Promise<void>;
  markVoid: (id: string) => Promise<void>;
}

export interface ContactService {
  create: (salesOrder: CreateContact) => Promise<Contact>;
  list: () => Promise<Contact[]>;
  update: (contact: UpdateContact) => Promise<Contact>;
  retrieve: (id: string) => Promise<SalesOrder>;
  delete: (id: string) => Promise<void>;
  setPrimary: (id: string) => Promise<void>;

  addAddress(id: string, address: Address): Promise<Contact>;
}


export interface ItemService {
  retrieve:(id: string) => Promise<Item>
}