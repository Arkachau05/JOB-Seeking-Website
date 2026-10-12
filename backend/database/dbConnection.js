import mongoose from "mongoose";

export const dbConnection = () => {
  const documentDbHost = process.env.DOCDB_HOST;
  const uri = documentDbHost
    ? `mongodb://${encodeURIComponent(process.env.DOCDB_USER)}:${encodeURIComponent(
        process.env.DOCDB_PASSWORD
      )}@${documentDbHost}:27017/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`
    : process.env.MONGO_URI;

  mongoose
    .connect(uri, {
      dbName: "MERN_JOB_SEEKING_WEBAPP",
      ...(documentDbHost && {
        tls: true,
        tlsCAFile:
          process.env.DOCDB_TLS_CA_FILE ||
          "/etc/ssl/certs/rds-global-bundle.pem",
      }),
    })
    .then(() => {
      console.log("Connected to database.");
    })
    .catch((err) => {
      console.log(`Some Error occured. ${err}`);
    });
};
