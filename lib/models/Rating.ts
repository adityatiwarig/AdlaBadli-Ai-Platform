import mongoose, { Schema, type InferSchemaType } from "mongoose"

const ratingSchema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    raterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ratedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    punctuality: { type: Number, required: true, min: 1, max: 5 },
    teachingQuality: { type: Number, required: true, min: 1, max: 5 },
    behavior: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
)

ratingSchema.index({ sessionId: 1, raterId: 1 }, { unique: true })

export type RatingDoc = InferSchemaType<typeof ratingSchema> & { _id: mongoose.Types.ObjectId }

export const RatingModel = mongoose.models.Rating || mongoose.model("Rating", ratingSchema)
