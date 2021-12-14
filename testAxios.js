require(`dotenv`).config();
const axios = require(`axios`);

const authAxios = axios.create({
  baseURL: "https://workbench.import.io",
  headers: {
    Accept: "*/*",
    Host: "workbench.import.io",
    Authorization: `UserToken ${process.env.USERTOKEN}`,
  },
  params: {
    _apikey: process.env.APIKEY,
  },
});

(async()=>{
let a = await authAxios.get(
  `/api/orgs/ascential/sources/c60b7d27-c8c7-40bb-b07b-6ace6739d68e/snapshots?limit=50&sort=addedAt&sortDirection=DESC`
);
console.log(a.data.items[0]);
})();