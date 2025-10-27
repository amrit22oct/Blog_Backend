import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    startDate: { type: Date, required: true },
    hobbies: { type: String, required: true },
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);

export default Form;
