import { DeliveryServiceClient } from "@fraym/projections-proto";
import { AuthData, getProtobufAuthData } from "./auth";
import { Filter, getProtobufDataFilter } from "./filter";

export const getProjectionData = async <T extends {}>(
    projection: string,
    auth: AuthData,
    dataId: string,
    filter: Filter,
    returnEmptyDataIfNotFound: boolean,
    serviceClient: DeliveryServiceClient
): Promise<T | null> => {
    return new Promise<T | null>((resolve, reject) => {
        serviceClient.getData(
            {
                projection,
                auth: getProtobufAuthData(auth),
                dataId,
                filter: getProtobufDataFilter(filter),
                returnEmptyDataIfNotFound,
            },
            (error, response) => {
                if (error) {
                    reject(error.message);
                    return;
                }

                const result = response.result;

                if (!result) {
                    resolve(null);
                    return;
                }

                const data: any = {};

                for (const key in result.data) {
                    data[key] = JSON.parse(result.data[key]);
                }

                resolve(data);
            }
        );
    });
};
