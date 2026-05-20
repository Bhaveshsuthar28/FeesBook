import axios from "axios";

let tokenGetter = null;
let interceptorReady = false;

const ensureInterceptor =
  () => {
    if (interceptorReady) {
      return;
    }

    axios.interceptors.request.use(
      async (config) => {
        if (
          typeof tokenGetter ===
          "function"
        ) {
          try {
            const token =
              await tokenGetter();

            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } catch (error) {
            console.error(
              "Failed to attach auth token",
              error
            );
          }
        }

        return config;
      }
    );

    interceptorReady = true;
  };

export const setClerkTokenGetter =
  (getToken) => {
    tokenGetter = getToken;
    ensureInterceptor();
  };

export const clearClerkTokenGetter =
  () => {
    tokenGetter = null;
  };

export default axios;
