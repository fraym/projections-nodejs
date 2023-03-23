import { ManagementClientConfig } from "config/config";

export const removeProjections = async (
    projectionNames: string[],
    config: ManagementClientConfig
): Promise<void> => {
    await fetch(`${config.serverAddress}/management/projections`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            projectionNames,
        }),
    });
};
