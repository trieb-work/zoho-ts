import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ClientCredentials } from "simple-oauth2";

export type Request = {
  path: string[];
  /**
   * Url Paramters
   */
  params?: Record<string, string | number | boolean>;
  /**
   * Request body will be serialized to json
   */
  body?: unknown;

  headers?: Record<string, string | number | boolean>;

  /**
   * Retry the request a number of times while backing off exponentially
   */
  retry?: number;

  /**
   * in milliseconds
   * @default 7000
   */
  timeout?: number;
};

export type ZohoResponse<TResponse> = TResponse & {
  /**
   * Zoho Inventory error code. This will be zero for a success response and non-zero in case of an error.
   */
  code: number;
  /**
   * Message for the invoked API.
   */
  message: string;

  page_context?: {
    page: number;
    per_page: number;
    has_more_page: boolean;
  };
};

export class ZohoApiError extends Error {
  path?: string;

  constructor(err: AxiosError<{ code: number; message: string }>) {
    super(err.response?.data.message ?? err.message);
    this.path = err.request?.path;
  }
}

export class ZohoApiClient {
  private httpClient: AxiosInstance;

  private constructor(orgId: string, headers: Record<string, string>) {
    this.httpClient = axios.create({
      baseURL: "https://inventory.zoho.eu/api/v1",
      headers,
      params: {
        organization_id: orgId,
      },
      timeout: 7000,
    });
  }

  /**
   * Create a zoho api instance from client id and secret
   */
  static async fromClientSecret(
    orgId: string,
    client: { id: string; secret: string },
  ): Promise<ZohoApiClient> {
    const clientCredentials = new ClientCredentials({
      client,
      auth: {
        tokenHost: "https://accounts.zoho.eu",
        tokenPath: "/oauth/v2/token",
      },
      options: {
        authorizationMethod: "body",
      },
    });

    const res = await clientCredentials.getToken({
      scope: "ZohoInventory.FullAccess.all",
    });

    if (res.token.error) {
      throw new Error(res.token.error);
    }

    return new ZohoApiClient(orgId, {
      authorization: `${res.token.token_type} ${res.token.access_token}`,
    });
  }

  /**
   * Create a zoho api instance from cookies
   *
   * This is an undocumented unsupported hack
   */
  static async fromBrowserCookies(config: {
    orgId: string;
    cookie: string;
    zsrfToken: string;
  }): Promise<ZohoApiClient> {
    return new ZohoApiClient(config.orgId, {
      Cookie: config.cookie,
      "X-ZCSRF-TOKEN": config.zsrfToken,
      "User-Agent":
        "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
    });
  }

  private async request<TResponse>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    req: Request,
  ): Promise<ZohoResponse<TResponse>> {
    const axiosRequest: AxiosRequestConfig = {
      method,
      url: `/${req.path.join("/")}`,
      headers: req.headers ?? {},
      params: req.params,
    };
    if (req.timeout) {
      axiosRequest.timeout = req.timeout;
    }

    if (req.body) {
      if (typeof req.body === "string") {
        axiosRequest.data = req.body;
      } else {
        axiosRequest.data = req.body;
        axiosRequest.headers["Content-Type"] = "application/json;charset=UTF-8";
      }
    }

    const res = await this.httpClient
      .request<ZohoResponse<TResponse>>(axiosRequest)
      .catch((err) => {
        throw new ZohoApiError(err);
      });

    if (res.data.code !== 0) {
      console.error(
        `Zoho response error [${res.data.code}]: ${res.data.message}`,
      );
    }

    return res.data;
  }

  public async get<TResponse>(req: Request): Promise<ZohoResponse<TResponse>> {
    return this.request<TResponse>("GET", req);
  }

  public async post<TResponse>(req: Request): Promise<ZohoResponse<TResponse>> {
    return this.request<TResponse>("POST", req);
  }

  public async put<TResponse>(req: Request): Promise<ZohoResponse<TResponse>> {
    return this.request<TResponse>("PUT", req);
  }

  public async delete<TResponse>(
    req: Request,
  ): Promise<ZohoResponse<TResponse>> {
    return this.request<TResponse>("DELETE", req);
  }
}