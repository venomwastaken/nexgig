export const myId = (api: any) => {
  return api.get("/users/me")
};