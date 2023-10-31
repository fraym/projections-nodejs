import { DataWait } from "@fraym/proto/freym/projections/delivery";
import { Filter, getProtobufDataFilter } from "./filter";

export interface Wait {
    timeout?: number;
    conditionFilter: Filter;
}

export const getProtobufDataWait = (wait?: Wait): DataWait | undefined => {
    if (!wait) {
        return undefined;
    }

    return {
        conditionFilter: getProtobufDataFilter(wait.conditionFilter),
        timeout: wait.timeout ?? 0,
    };
};
