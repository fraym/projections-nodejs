import { DeliveryServiceClient } from "@fraym/projections-proto";

export const getProjectionData = async <T extends {}>(
    tenantId: string,
    projection: string,
    dataId: string,
    returnEmptyDataIfNotFound: boolean,
    serviceClient: DeliveryServiceClient
): Promise<T | null> => {
    return new Promise<T | null>((resolve, reject) => {
        serviceClient.getData(
            {
                tenantId,
                projection,
                dataId,
                limit: 0,
                page: 0,
                returnEmptyDataIfNotFound,
                filter: { fields: {}, and: [], or: [] },
                order: [],
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

                const data: any = {};
                const resultData = response.result[0].data;

                for (const key in resultData) {
                    data[key] = JSON.parse(resultData[key]);
                }

                resolve(data);
            }
        );
    });
};
