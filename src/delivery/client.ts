import { DeliveryServiceClient } from "@fraym/projections-proto";
import { credentials } from "@grpc/grpc-js";
import { ClientConfig, useConfigDefaults } from "../config/config";
import { Filter } from "./filter";
import { getProjectionData } from "./getData";
import { GetProjectionDataList, getProjectionDataList } from "./getDataList";
import { Order } from "./order";

export interface DeliveryClient {
    getData: <T extends {}>(
        tenantId: string,
        type: string,
        id: string,
        returnEmptyDataIfNotFound?: boolean
    ) => Promise<T | null>;
    getDataList: <T extends {}>(
        tenantId: string,
        type: string,
        limit?: number,
        page?: number,
        filter?: Filter,
        order?: Order[]
    ) => Promise<GetProjectionDataList<T> | null>;
    close: () => Promise<void>;
}

export const newDeliveryClient = async (config?: ClientConfig): Promise<DeliveryClient> => {
    config = useConfigDefaults(config);
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
        tenantId: string,
        projection: string,
        id: string,
        returnEmptyDataIfNotFound: boolean = false
    ): Promise<T | null> => {
        return await getProjectionData<T>(
            tenantId,
            projection,
            id,
            returnEmptyDataIfNotFound,
            serviceClient
        );
    };

    const getDataList = async <T extends {}>(
        tenantId: string,
        projection: string,
        limit: number = 0,
        page: number = 1,
        filter: Filter = { fields: {}, and: [], or: [] },
        order: Order[] = []
    ): Promise<GetProjectionDataList<T> | null> => {
        return await getProjectionDataList<T>(
            tenantId,
            projection,
            limit,
            page,
            filter,
            order,
            serviceClient
        );
    };

    const close = async () => {
        serviceClient.close();
    };

    return {
        getData,
        getDataList,
        close,
    };
};
