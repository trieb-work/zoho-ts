/**
 * Sales order can have files attached to them
 */
export type Document = {
    /**
     * Checks whether the sales order can be sent as a mail or not.
     */
    can_send_in_mail: boolean;

    /**
     * This indicates the name of the file.
     */
    file_name: string;

    /**
     * This indicates the type of the file.
     */
    file_type: string;

    /**
     * This indicates the size of the formatted file.
     */
    file_size_formatted: string;

    /**
     * This indicates the chronological number of the attachment.
     */
    attachment_order: number;

    /**
     * Unique ID generated by the server for the document. This is used as an identifier.
     */
    document_id: string;

    /**
     * this indicates the size of the attached file.
     */
    file_size: number;
};
