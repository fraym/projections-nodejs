import { DeliveryServiceClient } from "@fraym/projections-proto";
import { credentials } from "@grpc/grpc-js";
import { DeliveryClientConfig, useDeliveryConfigDefaults } from "../config/config";
import { Filter } from "./filter";
import { getProjectionData } from "./getData";
import { GetProjectionDataList, getProjectionDataList } from "./getDataList";
import { Order } from "./order";
import { AuthData } from "./auth";
import { upsertProjectionData, UpsertResponse } from "./upsert";
import { deleteProjectionData } from "./delete";

export interface DeliveryClient {
    getData: <T extends {}>(
        projection: string,
        authData: AuthData,
        id: string,
        filter?: Filter,
        returnEmptyDataIfNotFound?: boolean
    ) => Promise<T | null>;
    getDataList: <T extends {}>(
        projection: string,
        authData: AuthData,
        limit?: number,
        page?: number,
        filter?: Filter,
        order?: Order[]
    ) => Promise<GetProjectionDataList<T> | null>;
    upsertData: <T extends {}>(
        projection: string,
        authData: AuthData,
        dataId: string,
        payload: T
    ) => Promise<UpsertResponse<T>>;
    deleteDataById: (projection: string, authData: AuthData, dataId: string) => Promise<number>;
    deleteDataByFilter: (
        projection: string,
        authData: AuthData,
        filter?: Filter
    ) => Promise<number>;
    close: () => Promise<void>;
}

export const newDeliveryClient = async (config?: DeliveryClientConfig): Promise<DeliveryClient> => {
    config = useDeliveryConfigDefaults(config);
    const serviceClient = new DeliveryServiceClient(
        config.serverAddress,
        credentials.createInsecure(),
        {
            "grpc.keepalive_time_ms": config.keepaliveInterval,
            "grpc.keepalive_timeout_ms": config.keepaliveTimeout,
            "grpc.keepalive_permit_without_calls": 1,
        }
    );

    const getData = async <T extends {}>(
        projection: string,
        auth: AuthData,
        id: string,
        filter: Filter = { fields: {}, and: [], or: [] },
        returnEmptyDataIfNotFound: boolean = false
    ): Promise<T | null> => {
        return await getProjectionData<T>(
            projection,
            auth,
            id,
            filter,
            returnEmptyDataIfNotFound,
            serviceClient
        );
    };

    const getDataList = async <T extends {}>(
        projection: string,
        auth: AuthData,
        limit: number = 0,
        page: number = 1,
        filter: Filter = { fields: {}, and: [], or: [] },
        order: Order[] = []
    ): Promise<GetProjectionDataList<T> | null> => {
        return await getProjectionDataList<T>(
            projection,
            auth,
            limit,
            page,
            filter,
            order,
            serviceClient
        );
    };

    const upsertData = async <T extends {}>(
        projection: string,
        authData: AuthData,
        dataId: string,
        payload: T
    ): Promise<UpsertResponse<T>> => {
        return upsertProjectionData<T>(projection, authData, dataId, payload, serviceClient);
    };

    const deleteDataById = async (
        projection: string,
        authData: AuthData,
        dataId: string
    ): Promise<number> => {
        return deleteProjectionData(
            projection,
            authData,
            dataId,
            { fields: {}, and: [], or: [] },
            serviceClient
        );
    };

    const deleteDataByFilter = async (
        projection: string,
        authData: AuthData,
        filter: Filter = { fields: {}, and: [], or: [] }
    ): Promise<number> => {
        return deleteProjectionData(projection, authData, "", filter, serviceClient);
    };

    const close = async () => {
        serviceClient.close();
    };

    return {
        getData,
        getDataList,
        upsertData,
        deleteDataById,
        deleteDataByFilter,
        close,
    };
};
