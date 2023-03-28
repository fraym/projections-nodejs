import { DeliveryServiceClient } from "@fraym/projections-proto";

import { AuthData, getProtobufAuthData } from "./auth";
import { EventMetadata } from "./eventMetadata";
import { Filter, getProtobufDataFilter } from "./filter";

export const deleteProjectionData = async (
    projection: string,
    auth: AuthData,
    dataId: string,
    filter: Filter,
    eventMetadata: EventMetadata,
    serviceClient: DeliveryServiceClient
): Promise<number> => {
    return new Promise<number>((resolve, reject) => {
        serviceClient.deleteData(
            {
                projection,
                auth: getProtobufAuthData(auth),
                dataId,
                filter: getProtobufDataFilter(filter),
                eventMetadata,
            },
            (error, response) => {
                if (error) {
                    reject(error.message);
                    return;
                }

                resolve(response.numberOfDeletedEntries);
            }
        );
    });
};
