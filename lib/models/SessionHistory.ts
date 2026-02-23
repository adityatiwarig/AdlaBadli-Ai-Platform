import mongoose, { Schema, type InferSchemaType } from "mongoose"

const sessionHistorySchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    completedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
)

sessionHistorySchema.index({ sessionId: 1, userId: 1 }, { unique: true })

export type SessionHistoryDoc = InferSchemaType<typeof sessionHistorySchema> & { _id: mongoose.Types.ObjectId }

export const SessionHistoryModel =
  mongoose.models.SessionHistory || mongoose.model("SessionHistory", sessionHistorySchema)
