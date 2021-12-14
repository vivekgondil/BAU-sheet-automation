require(`dotenv`).config();
const axios = require(`axios`);
const { GoogleSpreadsheet } = require("google-spreadsheet");

let sheetDetails = {
  sheetId: "1xX28X9jWCg9W5srbcjx9RE9evBGaJBPrwN50WtbapbM",
  index: 0,
};
const getSheet = async ({ sheetId, index, title }) => {
  const creds = {
    client_email: process.env.client_email,
    private_key: process.env.private_key,
  };
  const doc = new GoogleSpreadsheet(sheetId);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  if (title) return doc.sheetsByTitle[title];
  return doc.sheetsByIndex[index];
};
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

async function saveData(rows, i) {
  return new Promise(async(resolve, reject) => {
    try {
      let snapshots = await authAxios.get(
        `/api/orgs/ascential/sources/${rows[i].workbench_id}/snapshots?limit=50&sort=addedAt&sortDirection=DESC`
      );
      let [month, date, year] = new Date()
        .toLocaleDateString("en-US")
        .split("/");
      const today = `${year}-${month}-${date}`;
      //   for (let snapshot in snapshots.data.items) {
      for (let j = 0; j < snapshots.data.items.length; j++) {
        // console.log(snapshots.data.items[j].id);
        let pushes = await authAxios.get(
          `/api/orgs/ascential/snapshots/${snapshots.data.items[j].id}/pushes`
        );
        if (!pushes.data.items.length == 0) {
          //   for (let push in pushes.data.items) {
          for (let k = 0; k < pushes.data.items.length; k++) {
            if (pushes.data.items[k].metadata.customZipUri) {
              if (
                pushes.data.items[k].metadata.customZipUri.includes(
                  "production"
                )
              ) {
                if (pushes.data.items[k].completedAt.includes(today))
                  rows[i].status = 1;
                else rows[i].status = 0;
              } else {
                rows[i].status = 0;
              }
            }
          }
          break;
        }
        if (!snapshots.data.items[j].statusUpdatedAt.includes(today)) {
          rows[i].status = 0;
          break;
        }
      }
      await rows[i].save();
      // console.log(rows[i].status);
      resolve("Done");
    } catch (error) {
      console.log(error.message);
    }
  });
}

async function main() {
  let sheet = await getSheet(sheetDetails);
  let rows = await sheet.getRows();
  //   rows = rows.filter((row, index) => index < 10);

  let promises = [];
  for (let i = 0; i < rows.length; i++) {
    promises.push(saveData(rows, i));
  }
  Promise.all(promises).then(values => {
    console.log(values); 
  });
}

main();
