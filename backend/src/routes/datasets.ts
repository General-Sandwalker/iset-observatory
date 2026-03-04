import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  uploadFile,
  previewDataset,
  importDataset,
  listDatasets,
  getDataset,
  queryTable,
  deleteDataset,
} from '../controllers/datasets.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload a file  (POST /api/datasets/upload)
router.post('/upload', requirePermission('data.import'), upload.single('file'), uploadFile);

// List all datasets (GET /api/datasets)
router.get('/', requirePermission('data.view'), listDatasets);

// Get single dataset (GET /api/datasets/:id)
router.get('/:id', requirePermission('data.view'), getDataset);

// Preview file headers + rows  (GET /api/datasets/:id/preview)
router.get('/:id/preview', requirePermission('data.import'), previewDataset);

// Create table & bulk import  (POST /api/datasets/:id/import)
router.post('/:id/import', requirePermission('data.import'), importDataset);

// Query dynamic table data  (GET /api/datasets/:id/data)
router.get('/:id/data', requirePermission('data.view'), queryTable);

// Delete dataset + table  (DELETE /api/datasets/:id)
router.delete('/:id', requirePermission('data.delete'), deleteDataset);

export default router;
