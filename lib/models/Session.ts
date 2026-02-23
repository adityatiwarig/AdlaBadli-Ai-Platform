import mongoose, { Schema, type InferSchemaType } from "mongoose"

const sessionSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    learnerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    skill: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    startTime: { type: Date },
    plannedDuration: { type: Number, default: 60 },
    endTime: { type: Date },
    duration: { type: Number },
    creditsTransferred: { type: Number, default: 0 },
    teacherConfirmed: { type: Boolean, default: false },
    learnerConfirmed: { type: Boolean, default: false },
    meetingRoomId: { type: String, trim: true, index: true },
    meetingProvider: { type: String, default: "jitsi", trim: true },
    summary: { type: String, default: "" },
    summaryUpdatedAt: { type: Date },
    aiInsights: [
      {
        agent: { type: String, trim: true },
        title: { type: String, trim: true },
        content: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    deletedBy: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  },
  { timestamps: true }
)

export type SessionDoc = InferSchemaType<typeof sessionSchema> & { _id: mongoose.Types.ObjectId }

export const SessionModel = mongoose.models.Session || mongoose.model("Session", sessionSchema)
