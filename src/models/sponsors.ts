import { Schema, model, models } from "mongoose";



const SponsorsSchema = new Schema(
  {
  
    name: {
      type: String,
      required: [true, "First name is required"],
      minLength: [3, "First name must be at least 3 characters"],
      maxLength: [20, "First name must be at most 20 characters"],
    },
   

  
  

    imagen: {
      type: String,
    },
    
  },
  {
    timestamps: true,
  }
);

const Sponsors = models.Sponsors || model("Sponsors", SponsorsSchema);
export default Sponsors;