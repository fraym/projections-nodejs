import { config } from "dotenv";

export interface DeliveryClientConfig {
    // serverAddress: address of the projection service
    serverAddress: string;
    // keepaliveInterval: grpc connection keepalive ping interval in milliseconds
    keepaliveInterval?: number;
    // keepaliveTimeout: grpc connection keepalive ping timeout in milliseconds
    keepaliveTimeout?: number;
}

export const getEnvDeliveryConfig = (): DeliveryClientConfig => {
    config();

    const serverAddress = process.env.PROJECTIONS_SERVER_ADDRESS ?? "";
    let keepaliveInterval: number | undefined;
    let keepaliveTimeout: number | undefined;

    const keepaliveIntervalString = process.env.PROJECTIONS_CONNECTION_KEEPALIVE_INTERVAL;
    const keepaliveTimeoutString = process.env.PROJECTIONS_CONNECTION_KEEPALIVE_INTERVAL;

    if (keepaliveIntervalString) {
        keepaliveInterval = parseInt(keepaliveIntervalString, 10);
    }

    if (keepaliveTimeoutString) {
        keepaliveTimeout = parseInt(keepaliveTimeoutString, 10);
    }

    return {
        serverAddress,
        keepaliveInterval,
        keepaliveTimeout,
    };
};

export const useDeliveryConfigDefaults = (
    config?: DeliveryClientConfig
): Required<DeliveryClientConfig> => {
    if (!config) {
        config = getEnvDeliveryConfig();
    }

    return {
        serverAddress: config.serverAddress,
        keepaliveTimeout: config.keepaliveTimeout ?? 3 * 1000,
        keepaliveInterval: config.keepaliveInterval ?? 40 * 1000,
    };
};
