import Form from "../models/Form.js";

export const createForm = async (req, res) => {
  try {
    const { firstName, lastName, email, age, gender, address, startDate, hobbies } = req.body;

    
    if (!firstName || !lastName || !email || !age || !gender || !address || !startDate || !hobbies) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const form = new Form({
      firstName,
      lastName,
      email,
      age,
      gender,
      address,
      startDate,
      hobbies,
    });

    await form.save();
    res.status(201).json({ message: "Form submitted successfully", form });
  } catch (error) {
    res.status(500).json({ message: "Error creating form", error: error.message });
  }
};


//  Get all forms
export const getForms = async (req, res) => {
   try {
     const forms = await Form.find();
     res.status(200).json(forms);
   } catch (error) {
     res.status(500).json({ message: "Error fetching forms", error: error.message });
   }
 };
 
 //  Get form by ID
 export const getFormById = async (req, res) => {
   try {
     const form = await Form.findById(req.params.id);
     if (!form) return res.status(404).json({ message: "Form not found" });
     res.status(200).json(form);
   } catch (error) {
     res.status(500).json({ message: "Error fetching form", error: error.message });
   }
 };
 
 //  Update form
 export const updateForm = async (req, res) => {
   try {
     const form = await Form.findByIdAndUpdate(req.params.id, req.body, {
       new: true,
       runValidators: true,
     });
     if (!form) return res.status(404).json({ message: "Form not found" });
     res.status(200).json({ message: "Form updated successfully", form });
   } catch (error) {
     res.status(400).json({ message: "Error updating form", error: error.message });
   }
 };
 
 //  Delete form
 export const deleteForm = async (req, res) => {
   try {
     const form = await Form.findByIdAndDelete(req.params.id);
     if (!form) return res.status(404).json({ message: "Form not found" });
     res.status(200).json({ message: "Form deleted successfully" });
   } catch (error) {
     res.status(500).json({ message: "Error deleting form", error: error.message });
   }
 };
 