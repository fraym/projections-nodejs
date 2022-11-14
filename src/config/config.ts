export interface ClientConfig {
    // serverAddress: address of the crud service
    serverAddress: string;
    // keepaliveInterval: grpc connection keepalive ping interval in milliseconds
    keepaliveInterval?: number;
    // keepaliveTimeout: grpc connection keepalive ping timeout in milliseconds
    keepaliveTimeout?: number;
}

export const useConfigDefaults = (config: ClientConfig): Required<ClientConfig> => {
    return {
        serverAddress: config.serverAddress,
        keepaliveTimeout: config.keepaliveTimeout ?? 3 * 1000,
        keepaliveInterval: config.keepaliveInterval ?? 40 * 1000,
    };
};
