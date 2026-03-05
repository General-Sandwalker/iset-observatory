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
  getSchema,
  updateRow,
  insertRow,
  deleteRows,
  renameColumn,
  changeColumnType,
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

// Schema (columns + types)  (GET /api/datasets/:id/schema)
router.get('/:id/schema', requirePermission('data.view'), getSchema);

// Row operations
router.patch('/:id/rows/:rowId', requirePermission('data.import'), updateRow);  // inline edit
router.post('/:id/rows', requirePermission('data.import'), insertRow);           // add row
router.delete('/:id/rows', requirePermission('data.delete'), deleteRows);        // multi-delete

// Column schema operations
router.patch('/:id/columns/:colName/rename', requirePermission('data.import'), renameColumn);
router.patch('/:id/columns/:colName/type', requirePermission('data.import'), changeColumnType);

export default router;
