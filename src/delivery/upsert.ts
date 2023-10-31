import { ServiceClient } from "@fraym/proto/freym/projections/delivery";
import { AuthData, getProtobufAuthData } from "./auth";
import { EventMetadata } from "./eventMetadata";

export type UpsertResponse<T extends {}> = UpsertSuccessResponse<T> | UpsertValidationResponse;

export interface UpsertSuccessResponse<T extends {}> {
    data: T;
    id: string;
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
    serviceClient: ServiceClient
): Promise<UpsertResponse<T>> => {
    const usedPayload: Record<string, string> = {};

    for (const key in payload) {
        usedPayload[key] = JSON.stringify(payload[key]);
    }

    return new Promise<UpsertResponse<T>>((resolve, reject) => {
        serviceClient.upsertData(
            {
                projection,
                auth: getProtobufAuthData(auth),
                dataId,
                payload: usedPayload,
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
                    id: response.id,
                });
            }
        );
    });
};
