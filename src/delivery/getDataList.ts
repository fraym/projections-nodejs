import { DeliveryServiceClient } from "@fraym/projections-proto";
import { Filter, getProtobufDataFilter } from "./filter";
import { getProtobufDataOrder, Order } from "./order";

export interface GetProjectionDataList<T extends {}> {
    limit: number;
    page: number;
    data: T[];
}

export const getProjectionDataList = async <T extends {}>(
    tenantId: string,
    projection: string,
    limit: number,
    page: number,
    filter: Filter,
    order: Order[],
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
                order: getProtobufDataOrder(order),
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
