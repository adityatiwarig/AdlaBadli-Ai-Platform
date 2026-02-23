import mongoose, { Schema, type InferSchemaType } from "mongoose"

const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session" },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 })

export type MessageDoc = InferSchemaType<typeof messageSchema> & { _id: mongoose.Types.ObjectId }

export const MessageModel = mongoose.models.Message || mongoose.model("Message", messageSchema)
