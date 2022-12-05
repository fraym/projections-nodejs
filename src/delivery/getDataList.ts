import { DeliveryServiceClient } from "@fraym/projections-proto";

export interface GetProjectionDataList {
    limit: number;
    page: number;
    data: Record<string, any>[];
}

export const getProjectionDataList = async (
    tenantId: string,
    projection: string,
    limit: number,
    page: number,
    serviceClient: DeliveryServiceClient
): Promise<GetProjectionDataList | null> => {
    return new Promise<GetProjectionDataList | null>((resolve, reject) => {
        serviceClient.getData(
            {
                tenantId,
                projection,
                dataId: "",
                limit,
                page,
                returnEmptyDataIfNotFound: false,
            },
            (error, response) => {
                if (error) {
                    reject(error.message);
                    return;
                }

                const data: Record<string, any>[] = [];

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
