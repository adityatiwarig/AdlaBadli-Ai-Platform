import mongoose from "mongoose"

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined
}

export async function connectDb() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured")
  }

  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || "adlabadli",
    })
  }

  return global._mongooseConn
}
