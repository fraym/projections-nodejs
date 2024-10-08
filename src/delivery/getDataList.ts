import { ServiceClient } from "@fraym/proto/freym/projections/delivery";
import { AuthData, getProtobufAuthData } from "./auth";
import { Filter, getProtobufDataFilter } from "./filter";
import { getProtobufDataOrder, Order } from "./order";

export interface GetProjectionDataList<T extends {}> {
    limit: number;
    page: number;
    total: number;
    data: T[];
}

export const getProjectionDataList = async <T extends {}>(
    projection: string,
    auth: AuthData,
    limit: number,
    page: number,
    filter: Filter,
    order: Order[],
    serviceClient: ServiceClient
): Promise<GetProjectionDataList<T> | null> => {
    return new Promise<GetProjectionDataList<T> | null>((resolve, reject) => {
        serviceClient.getDataList(
            {
                projection,
                auth: getProtobufAuthData(auth),
                limit: limit.toString(),
                page: page.toString(),
                filter: getProtobufDataFilter(filter),
                order: getProtobufDataOrder(order),
                useStrongConsistency: false,
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
                    limit: parseInt(response.limit, 10),
                    page: parseInt(response.page, 10),
                    total: parseInt(response.total, 10),
                    data,
                });
            }
        );
    });
};
