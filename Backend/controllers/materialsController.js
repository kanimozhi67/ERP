import Material from '../models/Material.js';

// CREATE
export const createMaterial = async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET ALL
export const getMaterials = async (req, res) => {
  try {
    const materials = await Material.find();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
export const getMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ error: "Material not found" });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!material) return res.status(404).json({ error: "Material not found" });
    res.json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ error: "Material not found" });
    res.json({ message: "Material deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
