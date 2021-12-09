import { ZohoApiClient } from "../client/client";
import {
  SalesOrder,
  CreateSalesOrder,
  UpdateSalesOrder,
} from "../types/salesOrder";
import type { RequireOnlyOne } from "./util";
export class SalesOrderHandler {
  private client: ZohoApiClient;

  constructor(client: ZohoApiClient) {
    this.client = client;
  }

  public async create(salesOrder: CreateSalesOrder): Promise<SalesOrder> {
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

  public async delete(ids: string[]): Promise<void> {
    await this.client.delete({
      path: ["salesorders"],
      params: {
        salesorder_ids: ids.join(","),
      },
    });
  }

  public async confirm(ids: string[]): Promise<void> {
    const chunkSize = 25;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      await this.client.post<{ salesorder: SalesOrder }>({
        path: ["salesorders", "status", "confirmed"],
        body: {
          salesorder_ids: chunk.join(","),
        },
      });
    }
  }

  public async markVoid(ids: string[]): Promise<void> {
    const chunkSize = 25;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      await this.client.post<{ salesorder: SalesOrder }>({
        path: ["salesorders", "status", "void"],
        body: {
          salesorder_ids: chunk.join(","),
        },
      });
    }
  }

  public async setCustomFieldValue(
    opts: RequireOnlyOne<
      {
        customFieldId?: never;
        customFieldName?: string;

        salesOrderIds: string[];
        value: number | string | boolean;
      },
      "customFieldId" | "customFieldName"
    >,
  ): Promise<void> {
    await this.client.put<{ salesorder: SalesOrder }>({
      path: ["salesorders"],
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `bulk_update=true&JSONString=${JSON.stringify({
        custom_fields: [
          {
            [opts.customFieldId ? "customfield_id" : "api_name"]:
              opts.customFieldId ?? opts.customFieldName,
            value: opts.value,
          },
        ],
        salesorder_id: opts.salesOrderIds.join(","),
      })}`,
    });
  }

  public async search(fragment: string): Promise<SalesOrder[]> {
    const salesOrders: SalesOrder[] = [];
    let hasMorePages = true;
    let page = 1;

    while (hasMorePages) {
      const res = await this.client.get<{ salesorders: SalesOrder[] }>({
        path: ["salesorders"],
        params: {
          salesorder_number_contains: fragment,
          page,
        },
      });

      salesOrders.push(...res.salesorders);
      hasMorePages = res.page_context?.has_more_page ?? false;
      page = res.page_context?.page ?? 0 + 1;
    }
    return salesOrders;
  }
}
