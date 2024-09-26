import { ServiceClient } from "@fraym/proto/freym/projections/delivery";
import { AuthData, getProtobufAuthData } from "./auth";
import { Filter, getProtobufDataFilter } from "./filter";

export const getViewData = async <T extends {}>(
    view: string,
    auth: AuthData,
    filter: Filter,
    serviceClient: ServiceClient
): Promise<T | null> => {
    return new Promise<T | null>((resolve, reject) => {
        serviceClient.getViewData(
            {
                view,
                auth: getProtobufAuthData(auth),
                filter: getProtobufDataFilter(filter),
                useStrongConsistency: false,
            },
            (error, response) => {
                if (error) {
                    reject(error.message);
                    return;
                }

                const result = response.result;

                if (!result || !result.data || Object.keys(result.data).length === 0) {
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
