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

    /**
     * Override the base Url for this request
     */
    baseUrl?: string;
};

/**
 * Enum definition of the different entities,
 * that Zoho offers.
 */
enum ZohoEntities {
    SALESORDERS = "salesorders",
    INVOICES = "invoices",
    CONTACTS = "contacts",
    ITEMS = "items",
    PURCHASEORDERS = "purchaseorders",
}

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
} & {
    [key in ZohoEntities]?: {
        code: number;
        message: string;
    }[];
};

export class ZohoApiError extends Error {
    url?: string;

    code?: number;

    constructor(err: AxiosError<{ code: number; message: string }>) {
        super(err.response?.data.message ?? err.message);
        this.url = err.request?.baseUrl + err.request?.path;

        this.code = err.response?.data.code;
    }
}

export type ZohoApiClientConfig = {
    orgId: string;
    headers: Record<string, string>;
    baseUrl?: string;
};

export class ZohoApiClient {
    private httpClient: AxiosInstance;

    static readonly BASE_URL = {
        inventory: "https://inventory.zoho.eu/api/v1",
        books: "https://books.zoho.eu/api/v3",
    };

    private constructor(config: ZohoApiClientConfig) {
        this.httpClient = axios.create({
            baseURL: config.baseUrl ?? ZohoApiClient.BASE_URL.inventory,
            headers: config.headers,
            params: {
                organization_id: config.orgId,
            },
            timeout: 30_000,
        });
    }

    /**
     * Create a zoho api instance from client id and secret
     */
    static async fromOAuth(config: {
        orgId: string;
        client: { id: string; secret: string };
        baseUrl?: string;
    }): Promise<ZohoApiClient> {
        const clientCredentials = new ClientCredentials({
            client: config.client,
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

        return new ZohoApiClient({
            orgId: config.orgId,
            headers: {
                authorization: `${res.token.token_type} ${res.token.access_token}`,
            },
            baseUrl: config.baseUrl,
        });
    }

    /**
     * Create a zoho api instance from cookies
     *
     * This is an undocumented unsupported hack
     */
    static async fromCookies(config: {
        orgId: string;
        cookie: string;
        zsrfToken: string;
        baseUrl?: string;
    }): Promise<ZohoApiClient> {
        return new ZohoApiClient({
            orgId: config.orgId,
            headers: {
                Cookie: config.cookie,
                "X-ZCSRF-TOKEN": config.zsrfToken,
                "User-Agent":
                    "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36",
            },
            baseUrl: config.baseUrl,
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
        if (req.baseUrl) {
            axiosRequest.baseURL = req.baseUrl;
        }
        if (req.timeout) {
            axiosRequest.timeout = req.timeout;
        }

        if (req.body) {
            if (typeof req.body === "string") {
                axiosRequest.data = req.body;
            } else {
                axiosRequest.data = req.body;
                axiosRequest.headers["Content-Type"] =
                    "application/json;charset=UTF-8";
            }
        }

        const res = await this.httpClient
            .request<ZohoResponse<TResponse>>(axiosRequest)
            .catch((err) => {
                throw new ZohoApiError(err);
            });

        if (res.data.code === undefined) {
            /**
             * The response object looks different for bulk update requests.
             * We check here, if this is a bulk response object
             */
            const bulkResponse = Object.keys(res.data).find((x) =>
                Object.values(ZohoEntities).includes(
                    x as unknown as ZohoEntities,
                ),
            );

            if (bulkResponse) {
                res.data[bulkResponse as ZohoEntities]?.map((x) => {
                    if (x.code !== 0)
                        throw new Error(
                            `Zoho response error [${x.code}]: ${x.message}`,
                        );
                });
            } else {
                throw new Error(
                    `Zoho returned not valid response object: ${JSON.stringify(
                        res.data,
                    )}`,
                );
            }
        } else {
            if (res.data.code !== 0) {
                console.error(
                    `Zoho response error [${res.data.code}]: ${res.data.message}`,
                );
            }
        }

        return res.data;
    }

    public async get<TResponse>(
        req: Request,
    ): Promise<ZohoResponse<TResponse>> {
        return this.request<TResponse>("GET", req);
    }

    public async post<TResponse>(
        req: Request,
    ): Promise<ZohoResponse<TResponse>> {
        return this.request<TResponse>("POST", req);
    }

    public async put<TResponse>(
        req: Request,
    ): Promise<ZohoResponse<TResponse>> {
        return this.request<TResponse>("PUT", req);
    }

    public async delete<TResponse>(
        req: Request,
    ): Promise<ZohoResponse<TResponse>> {
        return this.request<TResponse>("DELETE", req);
    }
}
