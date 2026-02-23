import mongoose, { Schema, type InferSchemaType } from "mongoose"

const sessionQuestionSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    learnerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, default: "", trim: true },
    askedAt: { type: Date, default: Date.now, index: true },
    answeredAt: { type: Date },
  },
  { timestamps: true }
)

sessionQuestionSchema.index({ sessionId: 1, learnerId: 1 }, { unique: true })

export type SessionQuestionDoc = InferSchemaType<typeof sessionQuestionSchema> & { _id: mongoose.Types.ObjectId }

export const SessionQuestionModel =
  mongoose.models.SessionQuestion || mongoose.model("SessionQuestion", sessionQuestionSchema)
