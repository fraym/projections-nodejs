import { ServiceClient } from "@fraym/proto/freym/projections/delivery";
import { AuthData, getProtobufAuthData } from "./auth";
import { Filter, getProtobufDataFilter } from "./filter";
import { Wait, getProtobufDataWait } from "./wait";

export const getProjectionData = async <T extends {}>(
    projection: string,
    auth: AuthData,
    dataId: string,
    filter: Filter,
    returnEmptyDataIfNotFound: boolean,
    serviceClient: ServiceClient,
    wait?: Wait
): Promise<T | null> => {
    return new Promise<T | null>((resolve, reject) => {
        serviceClient.getData(
            {
                projection,
                auth: getProtobufAuthData(auth),
                dataId,
                filter: getProtobufDataFilter(filter),
                returnEmptyDataIfNotFound,
                wait: getProtobufDataWait(wait),
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
