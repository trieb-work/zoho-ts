import { Mixin } from "ts-mixer";
import * as methods from "./callZoho";

export * from "./types";

export class ZohoClientInstance extends Mixin(methods.MultiMethods) {}
