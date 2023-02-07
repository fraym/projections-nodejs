import { DataOrder } from "@fraym/projections-proto";

export interface Order {
    field: string;
    descending?: boolean;
}

export const getProtobufDataOrder = (order: Order[]): DataOrder[] => {
    return order.map(o => ({
        field: o.field,
        descending: o.descending ?? false,
    }));
};
