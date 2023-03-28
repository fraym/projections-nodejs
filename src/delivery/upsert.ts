import { DeliveryServiceClient } from "@fraym/projections-proto";
import { AuthData, getProtobufAuthData } from "./auth";
import { EventMetadata } from "./eventMetadata";

export type UpsertResponse<T extends {}> = UpsertSuccessResponse<T> | UpsertValidationResponse;

export interface UpsertSuccessResponse<T extends {}> {
    data: T;
}

export interface UpsertValidationResponse {
    validationErrors: string[];
    fieldValidationErrors: Record<string, string>;
}

export const isUpsertSuccessResponse = <T extends {}>(
    response: UpsertResponse<T>
): response is UpsertSuccessResponse<T> => {
    return response.hasOwnProperty("data");
};

export const isUpsertValidationResponse = <T extends {}>(
    response: UpsertResponse<T>
): response is UpsertValidationResponse => {
    return !response.hasOwnProperty("data");
};

export const upsertProjectionData = async <T extends {}>(
    projection: string,
    auth: AuthData,
    dataId: string,
    payload: Record<string, any>,
    eventMetadata: EventMetadata,
    serviceClient: DeliveryServiceClient
): Promise<UpsertResponse<T>> => {
    return new Promise<UpsertResponse<T>>((resolve, reject) => {
        serviceClient.upsertData(
            {
                projection,
                auth: getProtobufAuthData(auth),
                dataId,
                payload,
                eventMetadata,
            },
            (error, response) => {
                if (error) {
                    reject(error.message);
                    return;
                }

                if (response.validationErrors || response.fieldValidationErrors) {
                    resolve({
                        validationErrors: response.validationErrors,
                        fieldValidationErrors: response.fieldValidationErrors,
                    });
                    return;
                }

                const data: any = {};

                for (const key in response.newData) {
                    data[key] = JSON.parse(response.newData[key]);
                }

                resolve({
                    data,
                });
            }
        );
    });
};
