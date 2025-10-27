import mongoose, { mongo } from "mongoose";

const categorySchema = mongoose.Schema(
   {
      name: {type:String,required: true, unique:true}
   },
   {timestamp:true}
)

export default mongoose.model("Category", categorySchema);