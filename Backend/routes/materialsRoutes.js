import express from "express";
import {
  createMaterial,
  getMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialsController.js";

const router = express.Router();

router.post("/", createMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterial);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

export default router;
