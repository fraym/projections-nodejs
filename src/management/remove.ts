import { ManagementClientConfig } from "config/config";

export const removeProjections = async (
    projectionNames: string[],
    config: ManagementClientConfig
): Promise<void> => {
    const response = await fetch(`${config.serverAddress}/management/projections`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            projectionNames,
        }),
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }
};
