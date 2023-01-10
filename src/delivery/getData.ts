import { DeliveryServiceClient } from "@fraym/projections-proto";

export type GetProjectionData = Record<string, any>;

export const getProjectionData = async (
    tenantId: string,
    projection: string,
    dataId: string,
    returnEmptyDataIfNotFound: boolean,
    serviceClient: DeliveryServiceClient
): Promise<GetProjectionData | null> => {
    return new Promise<GetProjectionData | null>((resolve, reject) => {
        serviceClient.getData(
            {
                tenantId,
                projection,
                dataId,
                limit: 0,
                page: 0,
                returnEmptyDataIfNotFound,
                filter: { fields: {}, and: [], or: [] },
            },
            (error, response) => {
                if (error) {
                    reject(error.message);
                    return;
                }

                if (response.result.length !== 1) {
                    resolve(null);
                    return;
                }

                const data: Record<string, any> = {};
                const resultData = response.result[0].data;

                for (const key in resultData) {
                    data[key] = JSON.parse(resultData[key]);
                }

                resolve(data);
            }
        );
    });
};
