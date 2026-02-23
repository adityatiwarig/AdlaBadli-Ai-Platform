import mongoose, { Schema, type InferSchemaType } from "mongoose"

const notificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["message", "session_scheduled", "offline_meet_request"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: "", trim: true },
    relatedSessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    relatedUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: mongoose.Types.ObjectId }

export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
