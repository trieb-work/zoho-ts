import { ZohoApiClient } from "../client/client";
import {
  Item
} from "../types";
import { ItemService } from "./interface";
export class ItemHandler implements ItemService {
  private client: ZohoApiClient;

  constructor(client: ZohoApiClient) {
    this.client = client;
  }

 
  public async retrieve(id: string): Promise<Item> {
    const res = await this.client.get<{ item: Item }>({
      path: ["items", id],
    });

    if (!res.item){
        throw new Error(`Item with id: ${id} was not found`)
    }
    return res.item;
  }
 
}
