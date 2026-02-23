import mongoose, { Schema, type InferSchemaType } from "mongoose"

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, default: "" },
    offlineMeetPreferred: { type: Boolean, default: false },
    teachSkills: { type: [String], default: [] },
    learnSkills: { type: [String], default: [] },
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    learningStyle: {
      type: String,
      enum: ["visual", "auditory", "reading", "kinesthetic", "mixed"],
      default: "mixed",
    },
    languages: { type: [String], default: ["English"] },
    availabilitySlots: { type: [String], default: [] },
    credits: { type: Number, default: 40 },
    trustScore: { type: Number, default: 50 },
    reliabilityScore: { type: Number, default: 50 },
    sessionsCompleted: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
)

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId }

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema)
