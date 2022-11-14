import { ManagementServiceClient } from "@fraym/projections-proto";

export const getAllProjections = async (
    serviceClient: ManagementServiceClient
): Promise<string[]> => {
    return new Promise<string[]>((resolve, reject) => {
        serviceClient.getProjections({}, (error, response) => {
            if (error) {
                reject(error.message);
                return;
            }

            resolve(response.projectionNames);
        });
    });
};
