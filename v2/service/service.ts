import { ZohoApiClient } from "../client/client";
import {
  SalesOrder,
  CreateSalesOrder,
  UpdateSalesOrder,
} from "../types/salesOrder";
import { SalesOrderService } from "./interface";
export class SalesOrderHandler implements SalesOrderService {
  private client: ZohoApiClient;

  constructor(client: ZohoApiClient) {
    this.client = client;
  }

  public async createSalesOrder(
    salesOrder: CreateSalesOrder,
  ): Promise<SalesOrder> {
    const res = await this.client.post<{ salesorder: SalesOrder }>({
      path: ["salesorders"],
      body: salesOrder,
      params: {
        ignore_auto_number_generation: true,
      },
    });

    return res.salesorder;
  }

  public async list(): Promise<SalesOrder[]> {
    const res = await this.client.get<{ salesorders: SalesOrder[] }>({
      path: ["salesorders"],
    });

    return res.salesorders;
  }
  public async update(salesOrder: UpdateSalesOrder): Promise<SalesOrder> {
    const res = await this.client.put<{ salesorder: SalesOrder }>({
      path: ["salesorders", salesOrder.salesorder_id.toString()],
      body: salesOrder,
    });

    return res.salesorder;
  }
  public async retrieve(id: string): Promise<SalesOrder> {
    const res = await this.client.get<{ salesorder: SalesOrder }>({
      path: ["salesorders", id],
    });

    return res.salesorder;
  }
  public async delete(id: string): Promise<void> {
    await this.client.delete({
      path: ["salesorders", id],
    });
  }
  public async confirm(id: string): Promise<void> {
    await this.client.post<{ salesorder: SalesOrder }>({
      path: ["salesorders", id, "status", "confirmed"],
    });
  }

  public async markVoid(id: string): Promise<void> {
    await this.client.post<{ salesorder: SalesOrder }>({
      path: ["salesorders", id, "status", "void"],
    });
  }
}
