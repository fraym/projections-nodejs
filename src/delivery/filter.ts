import { DataFilter } from "@fraym/projections-proto";

export interface Filter {
    fields: Record<string, FieldFilter>;
    and: Filter[];
    or: Filter[];
}

export interface FieldFilter {
    type: string;
    operation: string;
    value: any;
}

export const getProtobufDataFilter = (filter: Filter): DataFilter => {
    const fields: Record<string, FieldFilter> = {};

    for (const fieldName in filter.fields) {
        const field = filter.fields[fieldName];
        fields[fieldName] = {
            operation: field.operation,
            type: field.type,
            value: JSON.stringify(field.value),
        };
    }

    return {
        fields: fields,
        and: filter.and.map(and => getProtobufDataFilter(and)),
        or: filter.or.map(or => getProtobufDataFilter(or)),
    };
};
