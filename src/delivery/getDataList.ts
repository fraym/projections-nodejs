import { DataFilter, DeliveryServiceClient } from "@fraym/projections-proto";

export interface GetProjectionDataList<T extends {}> {
    limit: number;
    page: number;
    data: T[];
}

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

const getProtobufDataFilter = (filter: Filter): DataFilter => {
    const fields: Record<string, FieldFilter> = {};

    for (const fieldName in filter.fields) {
        const field = filter.fields[fieldName];
        let value: string = "";

        if (field.type === "String" && typeof field.value == "string") {
            value = field.value;
        } else {
            value = JSON.stringify(field.value);
        }

        fields[fieldName] = {
            operation: field.operation,
            type: field.type,
            value,
        };
    }

    return {
        fields: fields,
        and: filter.and.map(and => getProtobufDataFilter(and)),
        or: filter.or.map(or => getProtobufDataFilter(or)),
    };
};

export const getProjectionDataList = async <T extends {}>(
    tenantId: string,
    projection: string,
    limit: number,
    page: number,
    filter: Filter,
    serviceClient: DeliveryServiceClient
): Promise<GetProjectionDataList<T> | null> => {
    return new Promise<GetProjectionDataList<T> | null>((resolve, reject) => {
        serviceClient.getData(
            {
                tenantId,
                projection,
                dataId: "",
                limit,
                page,
                returnEmptyDataIfNotFound: false,
                filter: getProtobufDataFilter(filter),
            },
            (error, response) => {
                if (error) {
                    reject(error.message);
                    return;
                }

                const data: any[] = [];

                for (const result of response.result) {
                    const dataRecord: Record<string, any> = {};
                    const resultData = result.data;

                    for (const key in resultData) {
                        dataRecord[key] = JSON.parse(resultData[key]);
                    }

                    data.push(dataRecord);
                }

                resolve({
                    limit: response.limit,
                    page: response.page,
                    data,
                });
            }
        );
    });
};
