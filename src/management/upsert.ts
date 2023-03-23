import { ManagementClientConfig } from "config/config";

export const upsertProjections = async (
    schema: string,
    config: ManagementClientConfig
): Promise<void> => {
    await fetch(`${config.serverAddress}/management/projections`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            schema,
        }),
    });
};
