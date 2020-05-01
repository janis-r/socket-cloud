export const authTokenHeaderName = "X-API-KEY";
export const authTokenErrorResponseParams = {
    status: 401,
    headers: {
        WWW_Authenticate: "Basic"
    }
};
