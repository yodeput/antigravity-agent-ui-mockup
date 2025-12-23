import {fetch} from '@tauri-apps/plugin-http'
import {CloudCodeAPITypes} from "@/services/cloudcode-api.types.ts";

// HTTP client configuration
interface HTTPConfig {
  baseURL: string;
  headers: Record<string, string>;
}

const HTTP_CONFIG: HTTPConfig = {
  baseURL: 'https://daily-cloudcode-pa.sandbox.googleapis.com', // default to sandbox environment
  headers: {
    "User-Agent": "antigravity/windows/amd64",
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
};


const post = async <T>(endpoint: string, data: any, options?: RequestInit): Promise<T> => {

  const requestConfig: RequestInit = {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
    headers: {
      ...HTTP_CONFIG.headers,
      ...(options?.headers || {})
    }
  };

  const response = await fetch(`${HTTP_CONFIG.baseURL}${endpoint}`, requestConfig);

  return await response.json();
}


// CloudCode API service namespace
export namespace CloudCodeAPI {

  export async function fetchAvailableModels(
    authorizationKey: string,
    project: string,
  ): Promise<CloudCodeAPITypes.FetchAvailableModelsResponse> {

    const requestData = {
      "project": project
    };

    const response = await post<CloudCodeAPITypes.FetchAvailableModelsResponse | CloudCodeAPITypes.ErrorResponse>(
      '/v1internal:fetchAvailableModels',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${authorizationKey}`
        }
      }
    );

    if ("error" in response) {
      return Promise.reject(response);
    }

    return response;
  }

  export async function loadCodeAssist(
    authorizationKey: string,
  ) {
    const requestData = {metadata: {ideType: 'ANTIGRAVITY'}};

    const response = await post<CloudCodeAPITypes.LoadCodeAssistResponse | CloudCodeAPITypes.ErrorResponse>(
      '/v1internal:loadCodeAssist',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${authorizationKey}`
        }
      }
    )

    if ("error" in response) {
      return Promise.reject(response);
    }

    return response;
  }

  /**
   * curl --request POST \
   *   --url https://oauth2.googleapis.com/token \
   *   --header 'content-type: application/x-www-form-urlencoded' \
   *   --data client_id=1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com \
   *   --data client_secret=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 \
   *   --data grant_type=refresh_token \
   *   --data refresh_token=<>
   * @param refresh_token
   */
  export async function refreshAccessToken(
    refresh_token: string,
  ) {
    const requestData = {
      "client_id": "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com",
      "client_secret": "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",
      "grant_type": "refresh_token",
      "refresh_token": refresh_token
    };

    const requestConfig: RequestInit = {
      method: 'POST',
      body: JSON.stringify(requestData)
    };


    const response = await fetch(
      'https://oauth2.googleapis.com/token',
      requestConfig,
    );
    const json = await response.json() as unknown as CloudCodeAPITypes.RefreshAccessTokenResponse | CloudCodeAPITypes.ErrorResponse;

    if ("error" in json) {
      return Promise.reject(json);
    }

    return json;
  }

  export async function userinfo(
    access_token: string,
  ) {

    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      },
    );
    const json = await response.json() as unknown as CloudCodeAPITypes.UserInfoResponse | CloudCodeAPITypes.ErrorResponse;

    if ("error" in json) {
      return Promise.reject(json);
    }

    return json;
  }

}

