import { DeliveryServiceClient } from "@fraym/projections-proto";
import { credentials } from "@grpc/grpc-js";
import { ClientConfig, useConfigDefaults } from "../config/config";
import { getProjectionData, GetProjectionData } from "./getData";
import { GetProjectionDataList, getProjectionDataList } from "./getDataList";

export interface DeliveryClient {
    getData: (
        tenantId: string,
        type: string,
        id: string,
        returnEmptyDataIfNotFound?: boolean
    ) => Promise<GetProjectionData | null>;
    getDataList: (
        tenantId: string,
        type: string,
        limit?: number,
        page?: number
    ) => Promise<GetProjectionDataList | null>;
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

    const getData = async (
        tenantId: string,
        projection: string,
        id: string,
        returnEmptyDataIfNotFound: boolean = false
    ): Promise<GetProjectionData | null> => {
        return await getProjectionData(
            tenantId,
            projection,
            id,
            returnEmptyDataIfNotFound,
            serviceClient
        );
    };

    const getDataList = async (
        tenantId: string,
        projection: string,
        limit: number = 0,
        page: number = 1
    ): Promise<GetProjectionDataList | null> => {
        return await getProjectionDataList(tenantId, projection, limit, page, serviceClient);
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
