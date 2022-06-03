export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> &
            Partial<Record<Exclude<Keys, K>, undefined>>;
    }[Keys];

export class Utils {
    /**
     * Takes a prefixed number like INV-24945 or STORE-234355 and
     * returnes the unprefixed number
     * @param incomingNumer
     * @returns
     */
    public getUnprefixedNumber(incomingNumer: string) {
        return incomingNumer.split("-")[1];
    }
}
