import axios from "axios";
import { MultiMethods } from "./callZoho";

export class ZohoBrowserInstance extends MultiMethods {
  constructor(config: { zohoOrgId: string }) {
    super();
    this.zohoOrgId = config.zohoOrgId;
    this.instance = axios.create({
      baseURL: "https://inventory.zoho.eu/api/v1",
      timeout: 7000,
      params: { organization_id: this.zohoOrgId },
    });
  }
}
