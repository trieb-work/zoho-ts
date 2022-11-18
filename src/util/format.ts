import { format } from "date-fns";

/**
 * Formats a date object to the needed representation for Zoho
 * @param date
 * @returns
 */
const lastModifiedDateFormat = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm:ssxx");
};

export { lastModifiedDateFormat };
