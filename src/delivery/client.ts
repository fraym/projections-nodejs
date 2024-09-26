import { ServiceClient } from "@fraym/proto/freym/projections/delivery";
import { credentials } from "@grpc/grpc-js";
import { DeliveryClientConfig, useDeliveryConfigDefaults } from "../config/config";
import { Filter } from "./filter";
import { getProjectionData } from "./getData";
import { GetProjectionDataList, getProjectionDataList } from "./getDataList";
import { Order } from "./order";
import { AuthData } from "./auth";
import { upsertProjectionData, UpsertResponse } from "./upsert";
import { deleteProjectionData } from "./delete";
import { EventMetadata } from "./eventMetadata";
import { Wait } from "./wait";
import { getViewData as getDataFromView } from "./getViewData";
import { GetViewDataList, getViewDataList as getDataListFromView } from "./getViewDataList";

export interface DeliveryClient {
    getData: <T extends {}>(
        projection: string,
        authData: AuthData,
        id: string,
        filter?: Filter,
        returnEmptyDataIfNotFound?: boolean,
        wait?: Wait
    ) => Promise<T | null>;
    getViewData: <T extends {}>(
        view: string,
        authData: AuthData,
        filter?: Filter
    ) => Promise<T | null>;
    getDataList: <T extends {}>(
        projection: string,
        authData: AuthData,
        limit?: number,
        page?: number,
        filter?: Filter,
        order?: Order[]
    ) => Promise<GetProjectionDataList<T> | null>;
    getViewDataList: <T extends {}>(
        view: string,
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
        payload: Record<string, any>,
        eventMetadata?: EventMetadata
    ) => Promise<UpsertResponse<T>>;
    deleteDataById: (
        projection: string,
        authData: AuthData,
        dataId: string,
        eventMetadata?: EventMetadata
    ) => Promise<number>;
    deleteDataByFilter: (
        projection: string,
        authData: AuthData,
        filter?: Filter,
        eventMetadata?: EventMetadata
    ) => Promise<number>;
    close: () => Promise<void>;
}

export const newDeliveryClient = async (config?: DeliveryClientConfig): Promise<DeliveryClient> => {
    config = useDeliveryConfigDefaults(config);
    const serviceClient = new ServiceClient(config.serverAddress, credentials.createInsecure(), {
        "grpc.keepalive_time_ms": config.keepaliveInterval,
        "grpc.keepalive_timeout_ms": config.keepaliveTimeout,
        "grpc.keepalive_permit_without_calls": 1,
    });

    const getData = async <T extends {}>(
        projection: string,
        auth: AuthData,
        id: string,
        filter: Filter = { fields: {}, and: [], or: [] },
        returnEmptyDataIfNotFound: boolean = false,
        wait?: Wait
    ): Promise<T | null> => {
        return await getProjectionData<T>(
            projection,
            auth,
            id,
            filter,
            returnEmptyDataIfNotFound,
            serviceClient,
            wait
        );
    };

    const getViewData = async <T extends {}>(
        view: string,
        auth: AuthData,
        filter: Filter = { fields: {}, and: [], or: [] }
    ): Promise<T | null> => {
        return await getDataFromView<T>(view, auth, filter, serviceClient);
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

    const getViewDataList = async <T extends {}>(
        view: string,
        auth: AuthData,
        limit: number = 0,
        page: number = 1,
        filter: Filter = { fields: {}, and: [], or: [] },
        order: Order[] = []
    ): Promise<GetViewDataList<T> | null> => {
        return await getDataListFromView<T>(view, auth, limit, page, filter, order, serviceClient);
    };

    const upsertData = async <T extends {}>(
        projection: string,
        authData: AuthData,
        dataId: string,
        payload: Record<string, any>,
        eventMetadata: EventMetadata = { causationId: "", correlationId: "" }
    ): Promise<UpsertResponse<T>> => {
        return upsertProjectionData<T>(
            projection,
            authData,
            dataId,
            payload,
            eventMetadata,
            serviceClient
        );
    };

    const deleteDataById = async (
        projection: string,
        authData: AuthData,
        dataId: string,
        eventMetadata: EventMetadata = { causationId: "", correlationId: "" }
    ): Promise<number> => {
        return deleteProjectionData(
            projection,
            authData,
            dataId,
            { fields: {}, and: [], or: [] },
            eventMetadata,
            serviceClient
        );
    };

    const deleteDataByFilter = async (
        projection: string,
        authData: AuthData,
        filter: Filter = { fields: {}, and: [], or: [] },
        eventMetadata: EventMetadata = { causationId: "", correlationId: "" }
    ): Promise<number> => {
        return deleteProjectionData(projection, authData, "", filter, eventMetadata, serviceClient);
    };

    const close = async () => {
        serviceClient.close();
    };

    return {
        getData,
        getViewData,
        getDataList,
        getViewDataList,
        upsertData,
        deleteDataById,
        deleteDataByFilter,
        close,
    };
};
